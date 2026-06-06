# Implementation Plan — PerfectPLAY Native App

> Derived from `docs/SPEC.md` (product) and `docs/TECHNICAL_SPEC.md` (architecture).
> This document sequences the build, fixes contract details discovered in the np2 source
> that the tech spec glossed over, and defines a TDD workflow for each phase.

---

## Status (as of 2026-06-04)

| Phase | Status | Tests | Notes |
|---|---|---|---|
| 0 — API layer fix | ✅ Complete | 7 suites | Per-action decode contract corrected |
| 1 — Card logic & assets | ✅ Complete | 10 suites | 59 PNGs, cardDeck, parseInputHand, cardImageMap |
| 2 — Card UI components | ✅ Complete | 13 suites | CardKeyboard, HandDisplay, EvTable |
| 3 — Live Play vertical | ✅ Complete | 15 suites / 268 tests | Running on iOS 26.5 simulator vs local Django |
| 4 — Authentication | ✅ Complete | 17 suites / 283 tests | signUp/signIn/logout, auth screens, account tab |
| 5 — Training (FG) | ✅ Complete | 20 suites / 314 tests | Full DEAL→hold→DRAW loop, paytable, EV table |
| 6 — Game Configuration | ✅ Complete | 22 suites / 355 tests | Cascade selectors, recent games, setup dispatch |
| 7 — Voice | ✅ Complete | 24 suites / 397 tests | expo-speech-recognition; LP card entry + FG hold commands |
| 8a — Payments (Android) | 🔲 Next | — | Google Play Billing via RevenueCat |
| 8b — Payments (iOS) | 🔲 Deferred | — | Apple IAP via RevenueCat; needs Developer Program enrollment |
| 9 — Polish | 🔲 | — | — |

**Known issues to fix before Phase 9:**
- Firebase auth persistence warning — add `initializeAuth` + AsyncStorage persistence
- `SafeAreaView` from `react-native` deprecated — switch to `react-native-safe-area-context`
- NativeWind metro transformer disabled — needs `react-native-reanimated` to re-enable
- `USE_LOCAL_BACKEND = true` in `lib/dispatch.ts` — must be set to `false` before production build

**Completed 2026-06-02:**
- Phase 4: authApi.ts, firebaseAuthErrors.ts, login/signup/forgot screens, account tab auth state
- Phase 5: applyDealResult, applyDrawResult, formatHoldMessage (31 tests); training screen with
  DEAL→hold→DRAW loop, Hand Assist EV toggle, hold outcome banner, paytable with winning row
  highlight, card notation boxes (A♣ K♦…) below cards, setup dispatch on mount
- Style: dark teal theme, AppHeader, CardKeyboard circular keys, StrategyLine light blue
- Fixes: CardKeyboard raw input buffer (useRef, normalised output); direct Django dispatch
  (no np2 envelope); pre-warm anonymous Firebase auth; HOLD→HELD tap logic

**Completed 2026-06-04:**
- Phase 6: constants/gameData.ts (all 5 game groups, ptFromVariantPaytable); lib/previousGames.ts
  (parse/prepend/serialize, 15 tests); config.tsx modal with cascade selectors, bet/denom pickers,
  recent games, setup dispatch on confirm, savePreviousGames for logged-in users; 41 new tests
- AppHeader ≡ moved to left side (was top-right, conflicted with iOS simulator overlay)
- Phase 7: expo-speech-recognition (native iOS/Android, not AssemblyAI); applyHoldIntent.ts
  (intentToPositions pure function, 28 tests); cardPhraseParser.ts ("ace of clubs" → "Ac", 19 tests);
  useVoiceInput (LP card entry + deal/reset/backspace commands); useVoiceControl (FG hold intents
  + draw, TTS echo via expo-speech, callbacksRef for stale-closure safety); CardKeyboard extended
  with forwardRef/useImperativeHandle addToken(); 🎤 button on LP and Training control rows
- **Build toolchain switched to EAS Build + expo-dev-client.** Xcode no longer used as a build
  tool — only as a simulator host. `yarn build:sim:ios` / `yarn build:sim:android` replace
  `expo run:ios` / `expo run:android`. Daily development: `yarn start` + installed dev client.
  See `docs/EAS_SETUP_GUIDE.md` for one-time setup. Payment spec updated: Apple IAP via
  RevenueCat (not reader-app web link). `docs/PAYMENT_SETUP_GUIDE.md` covers store setup.
- NativeWind metro transformer disabled — needs `react-native-reanimated` to re-enable

---

## 1. Context & Current State

The scaffold (committed) has: Expo Router + 3 tabs, three Zustand stores, Firebase init,
full API layer (`dispatch`, `decode`, `compression`, `gamblerAlert`), card logic
(`cardDeck`, `parseInputHand`, `cardImageMap`, `gameIcons`), card UI components
(`CardKeyboard`, `HandDisplay`, `CardImage`, `EvTable`), game logic (`buildCheckRequest`,
`applyCheckResult`), Live Play screens (entry + results), and **268 passing tests**.
Tailwind CSS downgraded to v3 (NativeWind v4 requirement). Firebase init simplified to
`getAuth()` (Metro could not resolve `firebase/auth/react-native` subpath).

**Build philosophy:** This is a *behavioural port*, not a UI port. The np2 web components
are MUI/Tailwind/DOM and cannot be copied. What ports cleanly is **pure logic** (parsers,
card deck, intent detection, credit math, state transitions). What must be **reimplemented**
is anything touching the DOM, Web Audio, or MUI. The strategy engine is untouched — the app
is a new client of the same `vegaslearning.com/api`.

---

## 2. Guiding Principles

1. **TDD throughout.** Every pure-logic module: write the test first (red), implement
   (green), refactor. Components: write a render/interaction test alongside. Manual device
   testing is the final gate for screens, voice, and payments — but all *logic underneath*
   them is unit-tested first. Target: the logic layer (`lib/`, `stores/`, `voice/utils/`,
   `game/` reducers) is ~100% covered before its screen is wired.
2. **Contract fidelity over cleverness.** The engine expects exact request shapes and returns
   exact response shapes (documented in §3). Port them verbatim; do not "improve" them.
3. **Extract pure reducers from np2's components.** np2's game logic lives tangled inside
   2,000-line components (WinLine, HandInput). Extract the *decisions* (credit math, hold
   outcome, previousGames rotation) into pure, tested functions in `lib/` and `game/`, then
   the RN components just call them.
4. **One feature vertical at a time, each shippable.** Live Play first (the priority), then
   auth, then Training, then config, then voice, then payments.

---

## 3. Critical Contracts (discovered in np2 source — corrections to the tech spec)

These are the things that will silently break if not done exactly right.

### 3.1 Per-action response encoding ⚠️ (current `dispatch.ts` is wrong)

The dispatch endpoint returns `{ title, data: { status, data: { actionPayload } } }`.
Success gate: **`data.data.status === 200 && data.title === 'successful'`**.
But `actionPayload` is decoded **differently per action**:

| Action  | Decoding | Source of truth (np2) |
|---------|----------|----------------------|
| `check` | base64 → `pako.inflate` → `JSON.parse(JSON.parse(x))` (double parse) | results/handinput `confirmInputHandler` |
| `deal`  | `JSON.parse(actionPayload)` (plain, single) | WinLine `handleDealButton` |
| `draw`  | `JSON.parse(actionPayload)` (plain, single) | WinLine `handleDrawButton` |
| `setup` | `JSON.parse(actionPayload)` (plain, single) | sidedrawer `dispatchSetup` |

**Action required:** refactor `lib/dispatch.ts` to return the raw `actionPayload` + title,
and add `lib/decode.ts` with `decodeCheck()` (compressed, double-parse) and `decodePlain()`
(single parse). Update `lib/dispatch.test.ts` accordingly. The current implementation always
decompresses — correct only for `check`.

### 3.2 Card notation & hand string

- `noSpacesHand`: 10 chars = 5 × (rank+suit), e.g. `AcKdThJh2s`. Empty = `XXXXXXXXXX`.
- Rank chars: `A 2 3 4 5 6 7 8 9 T J Q K` (T = ten). Suit chars: `c d h s`.
- **Deuces Wild:** internally `2`→`W` in `noSpacesHand`; shown as `2` on the keyboard input
  line (`dispHand`). Before dispatch, `httpHand` converts `W`→`2` (engine wants `2`).
- `httpHand`: array form `['Ac','Kd',...]`, sent as `JSON.stringify(httpHand)` in `check`.

### 3.3 `pt` (paytable code) construction

`pt = gameName + '_' + paytableName.replace(/\//g, '_')` → e.g. `Bonus` + `6/5` = `Bonus_6_5`.
Casual-visitor default: `gameType='Bonus Poker'`, `gameName='Bonus'`, `paytableName='6/5'`,
`pt='Bonus_6_5'`, `coinValue='1'`, `coinsPlayed='5'`.

### 3.4 `previousGames` (Recent Games) format

Comma-joined triples `displayName,gameName,paytableName`, up to 5 games (max 15 tokens).
On select: rotate the chosen triple to the front. On new game: prepend, truncate to 15.
Persist via `authApi('savePreviousGames')` → `POST /api/auth/previousgames`
`{ action:'UPDATE', email, previousGames }`. Not available to unauthenticated users.

### 3.5 Credit math (Training, from WinLine)

- **After deal, on hold-confirm (`updateHolds`):** `creditSum -= coinValue * coinsPlayed`
  (and `bestCreditSum` likewise). This is the bet being placed.
- **On DRAW:** `winSum = paytable[payValue][coinsPlayed] * coinValue`; `creditSum += winSum`.
  `bestWin = paytable[suggestedPayValue][coinsPlayed] * coinValue`; `bestCreditSum += bestWin`.
  `gameNumber++`. Low-credit (< 25) prompts a "+$100" top-up.
- These become a pure tested reducer: `applyDrawResult(state, drawResults) → newState`.

### 3.6 Hold outcome (Training)

`selectHoldOutcome(gamblerAlert, payValue)` (already ported & tested) returns
`CORRECT HOLD.` | `SUCCESSFUL HOLD.` | `BAD HOLD`. Plus special-case message rewriting in
`handleDrawButton` for equal-EV pairs ("COULD HOLD EITHER PAIR: Xs OR Ys") and 4-to-straight
edge cases — extract into a tested `formatHoldMessage()`.

### 3.7 Card images

52 face PNGs + 4 wild (`2w_of_*`) + `cardback` live in `np2/public/images/igtImages/`
(59 files). np2's `ImageSelect("Ac")` maps a 2-char code → asset. Port the PNGs to
`assets/cards/` and write `cardImageMap.ts` using RN `require()` (RN needs static
`require`, not dynamic paths). Wild deuces (`W` suit) → `2w_of_<suit>` variant.

### 3.8 Suit glyphs

`gameIcons` = unicode `♣ ♦ ♥ ♠` (`♣ ♦ ♥ ♠`), plus `*`=`✱`,
backspace=`⌫`. Used in the `dispHand` display line. Verify they render in RN `<Text>`
(they do, but confirm on-device). Port `gameIcons.ts` verbatim.

### 3.9 Version / dependency notes

- Scaffold is on **Expo SDK 56** (tech spec said 53 — 56 supersedes it). React 19, RN 0.85.
- **Voice uses `expo-speech-recognition`**, not AssemblyAI or `expo-audio`. No PCM capture,
  no WebSocket streaming. `expo-av` remains in the project but is unused by voice.
- **Build toolchain is EAS Build** + `expo-dev-client`. `expo run:ios` / `expo run:android`
  are no longer used. See `docs/EAS_SETUP_GUIDE.md`.

---

## 4. Phased Implementation (TDD)

Each phase lists **tests-first**, then **implementation**, then **Definition of Done (DoD)**.

### Phase 0 — Fix the API layer (do first; everything depends on it)

**Tests-first:**
- `lib/decode.test.ts`: `decodeCheck()` round-trips a base64+pako+double-stringified object;
  `decodePlain()` parses a plain JSON actionPayload.
- Update `lib/dispatch.test.ts`: assert dispatch returns `{ title, actionPayload }` (raw),
  success gate honours `data.data.status === 200 && title === 'successful'`, anonymous
  sign-in path, auth header.

**Implementation:** refactor `lib/dispatch.ts` (return raw payload + title); add `lib/decode.ts`.

**DoD:** all green; a live smoke test (`name:'setup', pt:'Bonus_6_5'`) returns parseable data.

---

### Phase 1 — Card logic & assets (pure, fully testable)

**Tests-first:**
- `lib/cardDeck.test.ts`: `getDeck()` = 52 unique; `dealCards` count; `getDispHand` maps suits
  to glyphs; `sortBadHoldCards` orders by rank.
- `lib/parseInputHand.test.ts`: rank-before-suit normalization; dedupe; 5-card cap; `BS`
  deletes 1 (keyboard) / 2 (voice); deuces `2`↔`W` display rule.
- `lib/cardImageMap.test.ts`: every 2-char code (incl. `2w`/wild) resolves to a non-null asset.

**Implementation:** port `gameIcons.ts`, `cardDeck.ts`, `parseInputHand.ts` (verbatim,
strip MUI); copy 59 PNGs → `assets/cards/`; write `cardImageMap.ts`.

**DoD:** green; image map covers all 53 faces + wilds + cardback.

---

### Phase 2 — Card UI components (component tests)

**Tests-first (`@testing-library/react-native`):**
- `CardKeyboard.test.tsx`: renders 4 suits + 13 ranks + `# * BS`; tapping a key calls the
  input handler with the right value.
- `HandDisplay.test.tsx`: renders 5 slots; `XX` → cardback; FG tap toggles hold chip;
  LP-Results mode read-only.
- `EvTable.test.tsx`: renders N rows from `resultsList`; tap → `setEvSelectedCardPositions`;
  highlighted row reflects selection.

**Implementation:** `components/cards/{CardKeyboard,HandDisplay,CardImage}.tsx`,
`components/ev/EvTable.tsx`. Wire to `gameStore`/`simStore`. Hold chip mirrors np2 SimHoldLine
(HOLD vs HELD, colour tokens already in `tailwind.config.js`).

**DoD:** green; components render in isolation in a Storybook-less harness (plain test render).

---

### Phase 3 — Live Play vertical (the priority feature)

**Tests-first:**
- `game/buildCheckRequest.test.ts`: `(noSpacesHand, pt, coins, coinValue)` → correct `check`
  body, with `W`→`2` conversion for deuces.
- `game/applyCheckResult.test.ts`: maps a decoded `check` result into `gameStore`
  (holdCardPositions, resultsList, evs, strategyPrintLine, payValue, gameState='After Deal').

**Implementation:**
- `(tabs)/index.tsx`: StrategyLine + HandDisplay + CardKeyboard + DEAL button + paytable/EV
  toggle. DEAL → `buildCheckRequest` → `dispatch` → `decodeCheck` → `applyCheckResult` →
  `router.push('/liveplay/results')`.
- `liveplay/results.tsx`: HandDisplay (read-only, holds highlighted) + StrategyLine + EvTable
  (tap to explore) + Why-This-Hold button (modal, plain-language; port `whyThisHold` copy) +
  paytable toggle + **Next Hand** (resets gameStore → `router.back()`).

**DoD:** Manual device smoke test — enter `AcKdThJh2s` on Bonus 6/5, DEAL, see correct hold
highlighted + EV table; Next Hand returns to entry. (Verification §5.)

---

### Phase 4 — Authentication

**Tests-first:**
- `lib/authApi.test.ts` (firebase mocked): `signUp`/`signIn`/`logout` call the right Firebase
  fns; `mergeLoginUserData`/`savePreviousGames` POST the right bodies + bearer token;
  error→message mapping.
- `lib/firebaseAuthErrors.test.ts`: port `generateFirebaseAuthErrorMessage`, test code→copy.

**Implementation:** `lib/authApi.ts` (port only the needed actions: getCurrentUser, signUp,
signIn, logoutUser, saveNewUserData, mergeLoginUserData, savePreviousGames,
sendNewPasswordEmail, sendVerificationEmail — **omit** PayPal/coupon/VPN/email-validation).
`hooks/useAuth.ts` (already partially in `_layout.tsx`). Auth screens
(`app/(auth)/login.tsx`, `signup.tsx`) — email+password, NativeWind forms.
On login: `mergeLoginUserData` → hydrate `isMember`/`previousGames` into appStore.

**DoD:** Sign up → Firestore doc created; log in → membership + previousGames hydrate;
logout clears state. (Device.)

---

### Phase 5 — Training (Full Game) vertical

**Tests-first:**
- `game/dealReducer.test.ts`: `deal` result → simStore (hand, holdCardPositions, resultsList,
  gameState, dealText='DRAW').
- `game/applyDrawResult.test.ts`: credit math (§3.5) — bet deduction, winSum, creditSum,
  bestCreditSum, gameNumber++; low-credit flag at <25.
- `game/formatHoldMessage.test.ts`: CORRECT/SUCCESSFUL/BAD + equal-pair + 4-straight cases.
- `game/handAssist.test.ts`: toggle shows/hides EV table per gameState.

**Implementation:** `(tabs)/training.tsx` — HandDisplay (tap-to-hold) + EvTable (when Hand
Assist on) + WinLine (CREDIT / PerfectPLAY / WIN) + HoldOutcomeBanner + DEAL/DRAW button +
"What would it have been?" (shadow EV). Local random deal via `cardDeck` OR keyboard entry.
DEAL→`deal` dispatch→`decodePlain`→`dealReducer`. DRAW→`draw` dispatch→`applyDrawResult`→banner.

**DoD:** Device — DEAL, hold a pair, DRAW → correct banner + credits update; Hand Assist
toggles EV table; shadow EV shows post-draw.

---

### Phase 6 — Game Configuration modal

**Tests-first:**
- `lib/previousGames.test.ts`: rotate-to-front; prepend+truncate-to-15; parse triples → rows.
- `game/buildSetupRequest.test.ts`: selectors → `pt`; `setup` dispatch wiring.
- `constants/games` import test: cascade arrays present; `pt` derivation per variant.

**Implementation:** port `constants/games/*` (GameConstants + Bonus/DblDbl/Deuces/Triple/Other)
and `paytable/data/*.json`. `app/config.tsx` modal: RecentGames + GameMenus cascade
(member-gated, locked CTA for visitors) + BetPicker + DenominationPicker + Confirm
(`setup` dispatch → simStore strategy/value/paytable → `savePreviousGames` → `router.back()`).

**DoD:** Device — member can switch game/paytable/bet/denom; visitor sees locked state;
recent games quick-switch works and persists.

---

### Phase 7 — Voice ✅ Complete

> Uses **`expo-speech-recognition`** (native iOS/Android) — not AssemblyAI. Completely
> independent of np2-newvoice's WebSocket/PCM pipeline. Reuses the ported pure logic core.

**Tests (42 total across voice utils):**
- `voice/utils/applyHoldIntent.test.ts`: `intentToPositions(intent, hand)` — all 10 intent
  types, 28 tests.
- `voice/utils/cardPhraseParser.test.ts`: "ace of clubs" → `Ac`, command detection, 19 tests.
- `voice/utils/interpretCommand.test.ts`, `normalizeSpeech.test.ts`, `buildHoldPhrase.test.ts`
  (ported from np2-newvoice, previously complete).

**Implementation (actual):**
- `expo-speech-recognition`: `useSpeechRecognitionEvent('result')` fires on each transcript.
  No audio capture, no WebSocket, no streaming. Permissions via `app.json` plugin.
- `voice/hooks/useVoiceInput.ts` (LP): final transcript → `parseCardPhrase()` →
  `keyboardRef.current.addToken(token)` or command callback. Partial shown in strategy line.
- `voice/hooks/useVoiceControl.ts` (FG): final transcript → `detectIntent()` →
  `intentToPositions()` → hold chips updated. "draw" → DRAW handler. TTS echo via
  `expo-speech`. `callbacksRef` pattern avoids stale hand closure after DEAL.
- `CardKeyboard`: extended with `forwardRef` + `useImperativeHandle` exposing `addToken()`.
  Feeds voice tokens through `ParseInputHand` keeping `rawInputRef` in sync.
- 🎤 button on LP and Training control rows. Active state = dark red background.

**DoD:** Device (EAS dev client) — LP: speak 5 cards → hand populates → "deal" → results.
FG: "hold the pair" marks correct cards; "draw" resolves; TTS confirms hold aloud.

---

### Phase 8a — Account / Membership (Android)

> iOS payments are deferred to Phase 8b. On iOS in this phase the account screen shows
> membership status (for users who subscribed via the web app) but no purchase UI.

**Pre-requisites:** Complete Part A of `docs/PAYMENT_SETUP_GUIDE.md` checklist —
Google Play Console products, RevenueCat Android app, entitlement, offering, webhook,
np2 `/api/revenuecat-webhook` endpoint, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` env var.

**Tests-first:**
- `lib/membership.test.ts`: map RevenueCat `CustomerInfo.entitlements.active` → appStore
  `isMember`/`ppPlanType`; plan label display logic.

**Implementation:**
- `yarn add react-native-purchases` then `yarn build:sim:android` (native package — EAS rebuild required).
- `lib/purchases.ts`: `Purchases.configure(androidKey)` on app launch; `getOfferings()`;
  `purchasePackage(pkg)`; `getCustomerInfo()` → `isMember`.
- `(tabs)/account.tsx`:
  - All platforms: if member → show plan name + expiry + Restore button.
  - Android: if not member → show offering packages (Monthly / Annual / 48-Hr) with prices
    from RevenueCat offering, each with a purchase button.
  - iOS (Phase 8a): if not member → show plan info only, no purchase UI yet.
- `AppState` listener: re-fetch `getCustomerInfo()` on foreground return.
- Restore purchases: `Purchases.restorePurchases()`.

**DoD:** Android sandbox — tap Monthly → Play Billing test sheet → purchase completes →
account screen shows "Member". Restore: existing subscriber → membership reflected.

---

### Phase 8b — Payments (iOS, Deferred)

> Blocked on Apple Developer Program enrollment ($99/yr). Begin when enrollment is active.

**Pre-requisites:** Complete Part B of `docs/PAYMENT_SETUP_GUIDE.md` checklist —
App Store Connect products, RevenueCat iOS app added to existing project,
`EXPO_PUBLIC_REVENUECAT_IOS_KEY` env var.

**Implementation:**
- Add `EXPO_PUBLIC_REVENUECAT_IOS_KEY` to env; update `lib/purchases.ts` to pass the
  correct key per platform (`Platform.OS`).
- `yarn build:sim:ios` to rebuild dev client with both keys configured.
- Enable iOS purchase UI in account screen (same packages, same flow as Android).

**DoD:** iOS sandbox — tap Monthly → StoreKit sandbox sheet → purchase completes →
account screen shows "Member". Restore works. RevenueCat webhook updates Firestore.

---

### Phase 9 — Polish

Dark mode (NativeWind), haptics on key taps, splash/icon, error boundaries, `console.log`
suppression in production, accessibility labels on cards/keys.

---

## 5. Verification (end-to-end, per SPEC §Verification)

- `yarn test` green at every phase boundary (CI gate).
- `yarn start` → EAS development client on iOS simulator / Android emulator.
- vpengine smoke: `AcKdThJh2s` / Bonus 6/5 → EV table decodes.
- Auth: signup → Firestore doc; login → previousGames/membership hydrate.
- Training: DEAL→hold pair→DRAW→correct banner + credit update.
- Voice LP: speak 5 cards → hand populates → "deal".
- Voice FG (flagged): "hold the pair" → correct HELD.
- Payments: iOS sandbox purchase → entitlement active; Android Play Billing test → entitlement active; Restore purchases works.

---

## 6. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| **Per-action decode contract** (§3.1) | Wrong results silently | Fixed in Phase 0 with explicit tests |
| **EAS build queue time** | Slow native rebuild loop | Rebuilds rare (native package changes only); free tier ~15 min; paid tier faster. `eas build --local` as fallback |
| **EAS project ID not yet initialised** | First build blocked | Run `eas login && eas init` before Phase 8 (see `docs/EAS_SETUP_GUIDE.md`) |
| **Google Play products not created** | Phase 8a blocked | Complete Part A of `docs/PAYMENT_SETUP_GUIDE.md` before starting Phase 8a code |
| **Apple Developer Program not enrolled** | Phase 8b blocked | Deferred by design — complete enrollment when ready, then work Part B of payment guide |
| **RevenueCat sandbox latency** | Slow test loop | Use StoreKit Configuration file for local sandbox testing (no network needed) |
| **$5 setup fee can't be IAP** | Pricing change required | Not charged to native app subscribers — already documented in SPEC |
| **Firebase anon-auth + AsyncStorage persistence on RN** | Dispatch auth fails | `initializeAuth` with RN persistence already wired; test on device early |
| **Suit glyphs / card PNG rendering in RN** | Visual breakage | Verified in Phase 1–2 on device |
| **Engine response shape drift vs np2** | Mapping bugs | Mappers are pure + tested against real captured payloads |

---

## 7. Asset / Port Checklist

- [x] `assets/cards/` ← 59 PNGs from `np2/public/images/igtImages/`
- [x] `lib/gameIcons.ts` ← verbatim
- [x] `lib/cardDeck.ts`, `lib/parseInputHand.ts` ← verbatim (strip MUI)
- [x] `lib/firebaseAuthErrors.ts` ← `generateFirebaseAuthErrorMessage`
- [x] `constants/gameData.ts` ← all 5 game groups consolidated (replaces separate constant files)
- [x] `lib/gamblerAlert.ts` ← ported
- [x] voice utils ← interpretCommand, normalizeSpeech, buildHoldPhrase (from np2-newvoice)
- [x] `voice/utils/applyHoldIntent.ts` ← `intentToPositions` extracted from np2-newvoice
- [x] `voice/utils/cardPhraseParser.ts` ← LP card phrase detection (new, not a port)
- [ ] `paytable/data/*.json` ← not yet ported (paytable stats display deferred)

---

## 8. Suggested Commit Cadence

One commit per phase (or per red→green→refactor cycle within a phase), tests passing each
time. Branch off `main` per vertical if parallelism is wanted; otherwise linear on `main`
is fine for a solo dev. Push after each green phase.
