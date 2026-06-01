# Implementation Plan — PerfectPLAY Native App

> Derived from `docs/SPEC.md` (product) and `docs/TECHNICAL_SPEC.md` (architecture).
> This document sequences the build, fixes contract details discovered in the np2 source
> that the tech spec glossed over, and defines a TDD workflow for each phase.

---

## Status (as of 2026-05-31)

| Phase | Status | Tests | Notes |
|---|---|---|---|
| 0 — API layer fix | ✅ Complete | 7 suites | Per-action decode contract corrected |
| 1 — Card logic & assets | ✅ Complete | 10 suites | 59 PNGs, cardDeck, parseInputHand, cardImageMap |
| 2 — Card UI components | ✅ Complete | 13 suites | CardKeyboard, HandDisplay, EvTable |
| 3 — Live Play vertical | ✅ Complete | 15 suites / 268 tests | Screens wired, running on iOS 26.5 simulator |
| 4 — Authentication | 🔲 Next | — | — |
| 5 — Training (FG) | 🔲 | — | — |
| 6 — Game Configuration | 🔲 | — | — |
| 7 — Voice | 🔲 | — | — |
| 8 — Account / Payments | 🔲 | — | — |
| 9 — Polish | 🔲 | — | — |

**Known issues to fix before Phase 9:**
- Firebase auth persistence warning — add `initializeAuth` + AsyncStorage persistence (Phase 4)
- `SafeAreaView` from `react-native` deprecated — switch to `react-native-safe-area-context`
- NativeWind metro transformer disabled — needs `react-native-reanimated` to re-enable
- Simulator network error on DEAL — expected in simulator without VPN/tunnel; test on device

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

- Scaffold is on **Expo SDK 56** (tech spec said 53 — 56 supersedes it; update the tech spec
  note). React 19, RN 0.85.
- **`expo-av` is deprecated** on SDK 53+. For voice capture use **`expo-audio`**
  (`expo-av` was installed in scaffold — replace it in the voice phase).

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

### Phase 7 — Voice (reimplementation, not port)

> SPEC: FG voice (hold commands + TTS) is **device-testing only, not production**. LP voice
> (card entry) is the shippable target. The 2,400-line np2 `VoiceStreamInput` is web-audio
> plumbing — **do not port it**. Reuse only the already-ported intent/parse utils + extract
> the position-mapping logic.

**Tests-first:**
- `voice/utils/applyHoldIntent.test.ts`: extract pure `intentToPositions(intent, hand) →
  number[]` from np2's `applyHoldIntent` (rank/suit/pair/two-pair/trips/positions/all/none);
  test each branch. (interpretCommand/normalizeSpeech/buildHoldPhrase already tested.)
- `voice/utils/cardPhraseToToken.test.ts`: "ace of clubs" → `Ac` (LP card entry mapping).

**Implementation:**
- `voice/audio/recorder.ts`: **`expo-audio`** PCM16 @16kHz mono capture → ~100ms frames
  (replaces Web Audio AudioWorklet). iOS `playAndRecord` session; Android `RECORD_AUDIO`.
- `voice/assemblyClient.ts`: WS `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&
  encoding=pcm_s16le&format_turns=true&token=…`; token from `GET /api/assemblyai-token`.
- `voice/hooks/useVoiceInput.ts` (LP): frames→WS; final transcript→`detectIntent`/card-token→
  `ParseInputHand`→gameStore; "deal"→confirm; "next hand" on Results→nextHand.
- `voice/hooks/useVoiceControl.ts` (FG, behind a flag): `intentToPositions`→holds;
  "draw"→draw; TTS via **`expo-speech`** `buildHoldPhrase`.

**DoD:** Device — LP: speak 5 cards → hand populates → "deal" → results. FG (flagged):
"hold the pair" marks correct cards; "draw" resolves; TTS confirms.
**Dependency:** confirm `/api/assemblyai-token` is live on Django (else add it).

---

### Phase 8 — Account / Membership & payments

**Tests-first:**
- `lib/membership.test.ts`: map Firestore membership → plan label/status; gate logic
  (member vs visitor).
- `lib/pricing.test.ts`: env prices → display strings ($12.95/$99.00/$4.99/$5.00 setup).

**Implementation:** `(tabs)/account.tsx` — membership status + plan. **iOS (reader app):**
prices + `Linking.openURL('https://perfectplay.vegas/#member')`, no in-app purchase.
**Android:** `@stripe/stripe-react-native` sheet (Monthly CC / Annual / 48-Hr) + PayPal
(Monthly) → same Django checkout endpoints. Restore: `mergeLoginUserData` on focus.

**DoD:** Device — iOS opens web purchase; Android renders native sheet; membership reflects
after purchase. (Platform-split via `Platform.OS`.)

---

### Phase 9 — Polish

Dark mode (NativeWind), haptics on key taps, splash/icon, error boundaries, `console.log`
suppression in production, accessibility labels on cards/keys.

---

## 5. Verification (end-to-end, per SPEC §Verification)

- `yarn test` green at every phase boundary (CI gate).
- `yarn start` → Expo Go on physical iOS + Android.
- vpengine smoke: `AcKdThJh2s` / Bonus 6/5 → EV table decodes.
- Auth: signup → Firestore doc; login → previousGames/membership hydrate.
- Training: DEAL→hold pair→DRAW→correct banner + credit update.
- Voice LP: speak 5 cards → hand populates → "deal".
- Voice FG (flagged): "hold the pair" → correct HELD.
- Payments: iOS web link; Android native sheet.

---

## 6. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| **`/api/assemblyai-token` may not exist on Django** | Voice blocked | Verify early (Phase 0 recon); add endpoint server-side if missing |
| **`expo-audio` PCM16 frame streaming** (no AudioWorklet equiv) | LP/FG voice | Prototype capture→WS in isolation before Phase 7; fall back to chunked file upload if streaming unviable |
| **Per-action decode contract** (§3.1) | Wrong results silently | Fixed in Phase 0 with explicit tests |
| **iOS reader-app payment compliance** | App Store rejection | Already chosen reader model; no IAP code on iOS |
| **Firebase anon-auth + AsyncStorage persistence on RN** | Dispatch auth fails | `initializeAuth` with RN persistence already wired; test on device early |
| **Suit glyphs / card PNG rendering in RN** | Visual breakage | Verify in Phase 1–2 on device |
| **Engine response shape drift vs np2** | Mapping bugs | Mappers are pure + tested against real captured payloads |

---

## 7. Asset / Port Checklist

- [ ] `assets/cards/` ← 59 PNGs from `np2/public/images/igtImages/`
- [ ] `lib/gameIcons.ts` ← verbatim
- [ ] `lib/cardDeck.ts`, `lib/parseInputHand.ts` ← verbatim (strip MUI)
- [ ] `lib/firebaseAuthErrors.ts` ← `generateFirebaseAuthErrorMessage`
- [ ] `constants/games/*` ← GameConstants + 5 variant constant files
- [ ] `paytable/data/*.json` ← 5 JSON + types
- [ ] voice utils — already ported (interpretCommand, normalizeSpeech, buildHoldPhrase)
- [ ] `lib/gamblerAlert.ts` — already ported
- [ ] `voice/utils/applyHoldIntent.ts` ← extract pure `intentToPositions` from np2-newvoice

---

## 8. Suggested Commit Cadence

One commit per phase (or per red→green→refactor cycle within a phase), tests passing each
time. Branch off `main` per vertical if parallelism is wanted; otherwise linear on `main`
is fine for a solo dev. Push after each green phase.
