# Design Notes — PerfectPLAY Native App

> Companion to `IMPLEMENTATION_PLAN.md` and `TECHNICAL_SPEC.md`. Records *why* key decisions
> were made — source investigations, contract discoveries, judgement calls, and spec changes.
> Updated as the build progresses.

---

## Why I read the np2 source instead of trusting the tech spec

The technical spec is a faithful summary, but a summary is lossy. An engine client lives or
dies on exact request/response shapes, and those only exist in one place: the working web
code at `/devspot/np2`. So before planning, I read the real implementations of the four
things the native app must replicate exactly:

- `commonApi.ts` — the dispatch contract
- `keyboard.tsx` + `parseInputHand.tsx` + `cardDeck.ts` — card entry
- `authApi.ts` — the auth/Firestore surface
- `VoiceStreamInput.tsx` + `assemblyClient.ts` — the voice pipeline (np2-newvoice)

That reading changed the plan in four material ways, documented below.

---

## Discovery 1 — The response encoding is per-action, not uniform

This is the most important finding. The tech spec (and therefore the scaffolded
`lib/dispatch.ts`) assumed every dispatch response is base64 + pako-compressed JSON. That is
**only true for the `check` action**.

Reading the four call sites in np2:

- `check` (HandInput `confirmInputHandler`): base64 → `pako.inflate` → `JSON.parse(JSON.parse(x))`. Compressed **and double-parsed**.
- `deal` (WinLine `handleDealButton`): `JSON.parse(actionPayload)`. Plain.
- `draw` (WinLine `handleDrawButton`): `JSON.parse(actionPayload)`. Plain.
- `setup` (sidedrawer `dispatchSetup`): `JSON.parse(actionPayload)`. Plain.

The original `dispatch.ts` always decompressed — correct for Live Play, silently broken for
Training and config. Phase 0 fixed this: `dispatch` returns raw `actionPayload`; `lib/decode.ts`
provides `decodeCheck()` (compressed) and `decodePlain()` (plain), each tested.

A second correction: the native app calls Django directly at `http://localhost:8000/api/`
rather than through np2's `/api/common/dispatch` route. Django's response shape is also
different — it returns the payload directly, not wrapped in `{ title, data: { data: ... } }`.
`dispatch.ts` handles this by checking whether the raw response is a string (check) or object
(all others).

## Discovery 2 — Card notation has a deuces-wild dual representation

`noSpacesHand` is a 10-char string, `XXXXXXXXXX` when empty. In Deuces Wild games the `2` is
represented as `W` *internally* (in `noSpacesHand`), displayed as `2` on the keyboard line,
and converted **back** to `2` (`httpHand`) before the request reaches the engine. Three
representations of the same card depending on where you are in the pipeline. `ParseInputHand`
encodes this rule; the card image layer needs the `2w_of_<suit>` wild PNG variants. This is
tested explicitly in Phase 1.

## Discovery 3 — The game logic is tangled inside giant components

`WinLine.tsx` is ~1,900 lines; `VoiceStreamInput.tsx` is ~2,400. The actual *decisions* —
how credits move, how a hold outcome is classified, how the previousGames list rotates — are
a few dozen lines buried in DOM/MUI/state-machine noise. The right move is to extract those
decisions into pure functions and test them in isolation:

- `applyDrawResult()` — credit math
- `formatHoldMessage()` — CORRECT/SUCCESSFUL/BAD + equal-pair + 4-to-a-straight cases
- `previousGames` rotate-to-front / prepend-truncate-15 logic (`lib/previousGames.ts`)
- `intentToPositions(intent, hand)` — voice hold→card-position mapping (`voice/utils/applyHoldIntent.ts`)

The RN components become thin: call a tested reducer and render its output.

## Discovery 4 — Voice is a reimplementation, not a port

The original plan called for AssemblyAI WebSocket streaming, matching np2-newvoice. After
reading `VoiceStreamInput.tsx`, that's the wrong call. The file is overwhelmingly **web-audio
survival code**: AudioWorklet PCM conversion, Bluetooth HFP→A2DP transition handling, iOS
`speechSynthesis` gesture quirks, React Strict-Mode phantom-mount guards, WebSocket
reconnection state machines. Almost none of that transfers to React Native.

The native app uses **`expo-speech-recognition`** instead — native iOS `SFSpeechRecognizer`
and Android `SpeechRecognizer`, no streaming, no external API, no PCM capture pipeline. The
two voice implementations are completely independent. What transfers from np2-newvoice is the
small portable core: `interpretCommand`, `normalizeSpeech`, `buildHoldPhrase`. These are pure
functions that process text strings — the STT provider is irrelevant to them.

**CardKeyboard voice integration** required a non-obvious change: voice needs to feed card
tokens through CardKeyboard's internal `rawInputRef`, not bypass it. Bypassing would cause the
next keyboard tap to start from a stale buffer. Solution: `forwardRef` + `useImperativeHandle`
exposes `addToken(token)` which calls `ParseInputHand` twice (rank then suit) keeping the ref
in sync. Voice and keyboard input are now interchangeable mid-entry.

**`callbacksRef` in `useVoiceControl`**: the `useSpeechRecognitionEvent` handler is
registered once; if it captured `hand` from the closure, it would see the stale hand from
before the most recent DEAL. A `useRef` that mirrors the `callbacks` prop ensures the handler
always reads the current hand.

---

## Discovery 5 — np2 payments have nothing to do with Django

The original spec and early planning assumed Django handled payments alongside the vpengine
API. Reading the np2 source: **all payment processing is in np2** (Next.js API routes). Django
hosts only the strategy engine.

np2 payment flow:
1. User pays on np2's Stripe-hosted checkout page
2. Stripe webhook (`/api/stripe-webhook`) fires `checkout.session.completed`
3. Webhook writes `member: true`, plan type, subscription IDs, `currentPeriodEnd` to Firestore
4. The native app's `authApi.ts` reads these same Firestore fields via `mergeLoginUserData`

PayPal follows the same pattern via `/api/paypal-webhook`.

No receipt validation code in np2 — Stripe's `constructEvent()` signature check is the
authenticity gate.

---

## Payment decision — RevenueCat IAP (not reader-app link)

The original spec used the "reader app" model on iOS: display prices, open `perfectplay.vegas`
in Safari, user purchases on the web, app re-reads Firestore on return. This avoids Apple's
30% cut but creates friction: the user leaves the app, authenticates on the web if needed,
purchases, returns, and the app has to detect the change.

Decision changed to **Apple IAP + Google Play Billing via RevenueCat**. Reasons:
- Substantially better UX — purchase within the app in two taps
- RevenueCat handles receipt validation server-side — no custom validation endpoint needed
- Same RevenueCat SDK abstracts both platforms behind one API
- RevenueCat's webhook can write to Firestore, keeping web and native subscriber state in sync

**One net-new backend piece**: np2 needs `/api/revenuecat-webhook` — ~40 lines mirroring
what the Stripe webhook already does. Without it, native IAP subscribers would appear as
non-members on the web app.

**$5 setup fee**: Apple IAP cannot represent a setup fee alongside a recurring subscription.
This charge is dropped for native app subscribers.

---

## Judgement calls

**Phase ordering follows the SPEC's priority, not the dependency graph's convenience.** Live
Play goes first (Phase 3) because it works for an anonymous user against `Bonus_6_5` without
auth or config. It delivers the headline value earliest.

**Each phase is a shippable vertical.** Rather than "build all stores, then all components,
then all screens," each phase cuts top-to-bottom through one feature and ends at a
device-verifiable state.

**AppHeader ≡ moved to left side.** The hamburger button was originally top-right. On the
iOS simulator, the floating device controls occupy that corner and intercept taps. Since ← and
≡ are never shown simultaneously in this app, both live on the left without layout conflict.

**`EvTable` uses `ScrollView+map` not `FlatList`.** FlatList's virtualisation prevents items
from rendering in jest (no layout engine). Since the table has at most 32 rows it doesn't need
virtualisation, so `ScrollView+map` is the right choice for both tests and the app.

**Game config in `constants/gameData.ts`, not ported JSON files.** The original plan called
for porting np2's `GameConstants.tsx` files and `paytable/data/*.json`. Instead, all game
group/variant/paytable data was consolidated into a single typed TypeScript file
(`constants/gameData.ts`) with a `ptFromVariantPaytable()` helper. Simpler to import, fully
type-checked, and covers all 5 game groups with their full paytable lists.

**Build toolchain: EAS Build over Xcode.** The original plan assumed `expo run:ios` /
`expo run:android` for local development, which uses Xcode as the native build tool. This
was replaced with **Expo EAS Build** + `expo-dev-client` for two reasons:

1. Expo managed workflow is architecturally designed around EAS. Running `expo run:ios`
   requires Xcode as a build tool (not just a simulator host), and native package management
   becomes the developer's responsibility. EAS keeps all of that in the cloud.
2. From Phase 7 onward, native modules (`expo-speech-recognition`, `react-native-purchases`)
   are not supported in standard Expo Go. A custom development client is required regardless —
   EAS is the clean path to get one without touching Xcode project files.

The practical trade-off is build queue time (10–20 minutes on the free EAS tier). This is
acceptable because development client rebuilds are rare — only needed when native packages
are added or updated, not on every code change. Daily development is `yarn start` + hot
reload in the installed dev client, which has no queue.

Local EAS builds (`eas build --local`) are available as a middle ground if queue times
become a problem — they run the build on the local machine using installed tools but without
requiring Xcode project management.

The Xcode simulator is still used for device simulation; it is not used as a build tool.

---

## What I deliberately did NOT do

- **Did not port `authApi` wholesale.** It carries PayPal coupon, VPN, and email-validation
  actions irrelevant to the native app's initial scope. Only the ~9 actions the app needs
  were ported.
- **Did not invent state the engine doesn't return.** Store shapes mirror np2 so response
  mappers stay mechanical; resisting redesign avoids translation bugs.
- **Did not port `VoiceStreamInput` line-for-line.** The 2,400-line file is web-audio
  plumbing that has no meaning on a phone. Only the pure logic core was reused.
- **Did not use `FlatList` in `EvTable`.** The virtualisation would block jest rendering.
- **Did not add `axios`.** Native `fetch` throughout, per workspace rules.
