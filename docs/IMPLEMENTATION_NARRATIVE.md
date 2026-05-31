# Implementation Planning — Narrative & Reasoning

> Companion to `IMPLEMENTATION_PLAN.md`. The plan says *what to do*; this document records
> *how I arrived at it* — the source investigation, the contract discoveries, and the
> judgement calls. Written during the extended-thinking pass that produced the plan.

---

## Why I read the np2 source instead of trusting the tech spec

The technical spec is a faithful summary, but a summary is lossy. An engine client lives or
dies on exact request/response shapes, and those only exist in one place: the working web
code at `/devspot/np2`. So before planning, I read the real implementations of the four
things the native app must replicate exactly:

- `commonApi.ts` — the dispatch contract
- `keyboard.tsx` + `parseInputHand.tsx` + `cardDeck.ts` — card entry
- `authApi.ts` — the auth/Firestore surface
- `VoiceStreamInput.tsx` + `assemblyClient.ts` — the voice pipeline

That reading changed the plan in four material ways, documented below.

---

## Discovery 1 — The response encoding is per-action, and the scaffold gets it wrong

This is the most important finding. The tech spec (and therefore the scaffolded
`lib/dispatch.ts`) assumes every dispatch response is base64 + pako-compressed JSON. That is
**only true for the `check` action**.

Reading the four call sites in np2:

- `check` (HandInput/results `confirmInputHandler`): base64 → `pako.inflate` →
  `JSON.parse(JSON.parse(x))`. Compressed **and double-parsed**.
- `deal` (WinLine `handleDealButton`): `JSON.parse(actionPayload)`. Plain.
- `draw` (WinLine `handleDrawButton`): `JSON.parse(actionPayload)`. Plain.
- `setup` (sidedrawer `dispatchSetup`): `JSON.parse(actionPayload)`. Plain.

The current `dispatch.ts` always decompresses, so it would work for Live Play (`check`) and
silently fail the moment Training (`deal`/`draw`) or config (`setup`) is wired. That is a
nasty class of bug — it wouldn't surface until Phase 5. So Phase 0 of the plan is "fix the
API layer first": make `dispatch` return the raw `actionPayload`, and split decoding into
`decodeCheck()` (compressed) and `decodePlain()` (single parse), each tested. The success
gate also needed correcting — np2 checks `data.data.status === 200 && data.title ===
'successful'`, a nested status the scaffold ignored.

This single discovery justified reading the source. The spec could not have told me this;
only the call sites could.

## Discovery 2 — Card notation has a deuces-wild dual representation

`noSpacesHand` is a 10-char string, `XXXXXXXXXX` when empty. Straightforward — until Deuces
Wild. In deuces games the `2` is represented as `W` *internally* (in `noSpacesHand`) but
displayed as `2` on the keyboard line, and converted **back** to `2` (`httpHand`) before the
request reaches the engine. So there are three representations of the same card depending on
where you are in the pipeline. `ParseInputHand` encodes this rule, and the card image layer
needs the `2w_of_<suit>` wild PNG variants. Any port that flattens this will produce wrong
hands in exactly one game family — the kind of bug that passes every Jacks-or-Better test and
breaks Deuces. The plan calls it out explicitly and makes it a test case in Phase 1.

## Discovery 3 — The game logic is tangled inside giant components

`WinLine.tsx` is ~1,900 lines; `VoiceStreamInput.tsx` is ~2,400. The actual *decisions* —
how credits move, how a hold outcome is classified, how the previousGames list rotates — are
a few dozen lines buried in DOM/MUI/state-machine noise. The right move for a TDD port is to
**extract those decisions into pure functions** and test them in isolation:

- `applyDrawResult(state, drawResults)` — the credit math (bet deduction on hold-confirm,
  `winSum = paytable[payValue][coinsPlayed] * coinValue`, `creditSum += winSum`,
  `bestCreditSum += bestWin`, `gameNumber++`, low-credit flag).
- `formatHoldMessage()` — CORRECT/SUCCESSFUL/BAD plus the equal-pair and 4-to-a-straight
  special cases.
- `previousGames` rotate-to-front / prepend-truncate-15 logic.
- `intentToPositions(intent, hand)` — the voice hold→card-position mapping.

The RN components then become thin: they call a tested reducer and render its output. This is
what makes "TDD throughout" actually achievable on a port of tangled code — you don't test
the 1,900-line component, you test the 30-line reducer you lifted out of it.

## Discovery 4 — The voice component is a reimplementation, not a port

I expected to port `VoiceStreamInput`. After reading it, that's the wrong call. The file is
overwhelmingly **web-audio survival code**: AudioWorklet PCM conversion, Bluetooth HFP→A2DP
transition handling, iOS `speechSynthesis` gesture quirks, React Strict-Mode phantom-mount
guards, WebSocket reconnection state machines. Almost none of that transfers to React Native,
where the audio stack is entirely different (`expo-audio` / native sessions).

What *does* transfer is the small portable core: `interpretCommand` (intent detection),
`normalizeSpeech` (phonetic correction), `buildHoldPhrase` (TTS text), and the
`intentToPositions` mapping. Those are already ported and tested (or will be extracted in
Phase 7). So the plan treats voice as: **reuse the tested logic core, reimplement the audio
plumbing natively.** Trying to port the 2,400-line component line-for-line would import a
mountain of browser-specific complexity that has no meaning on a phone.

This also aligns with the SPEC: FG voice (hold commands + TTS) is explicitly *device-testing
only, not production*. So LP card-entry voice is the real near-term target, and FG voice sits
behind a flag.

---

## Judgement calls worth recording

**Phase ordering follows the SPEC's priority, not the dependency graph's convenience.** Live
Play is "the priority working feature," so it goes first (Phase 3) even though auth and config
are arguably more foundational. Live Play works for an anonymous user against `Bonus_6_5`
without any auth or config screen — so it *can* go first, and it delivers the headline value
earliest. Auth, Training, config, voice, payments follow.

**Each phase is a shippable vertical.** Rather than "build all stores, then all components,
then all screens," each phase cuts top-to-bottom through one feature and ends at a
device-verifiable state. This keeps the app runnable throughout and makes the TDD red→green
loop tight.

**Payments stay a reader-app link on iOS.** Already decided earlier in the project, but worth
restating in the plan's risk register: no IAP code on iOS avoids both the 30% cut and the most
common App Store rejection reason for subscription apps.

**SDK version drift noted, not chased.** The tech spec said Expo SDK 53; the scaffold landed
on SDK 56 (newer, fine). The plan records the discrepancy and the one concrete consequence:
`expo-av` is deprecated, so voice capture uses `expo-audio`.

---

## What I deliberately did NOT do

- **Did not spawn subagents.** The investigation was a handful of targeted file reads, not a
  broad fan-out; inline reading was the right tool.
- **Did not port `authApi` wholesale.** It carries PayPal, coupon, VPN, and email-validation
  actions irrelevant to the native app's initial scope. The plan ports only the ~9 actions
  the app actually needs.
- **Did not invent state the engine doesn't return.** The store shapes mirror np2 so the
  response mappers stay mechanical; resisting the urge to "redesign" the state model avoids a
  whole category of translation bugs.

---

## The one external dependency to verify before Phase 7

`GET /api/assemblyai-token` on the Django server. The voice pipeline fetches a short-lived
AssemblyAI token from it. If it isn't deployed, voice is blocked until it is. This is the
single thing in the plan that depends on something outside the Expo repo, so it's flagged in
the risk register and should be confirmed early rather than discovered in Phase 7.
