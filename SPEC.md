# PerfectPLAY Native App — Product Spec

## What It Is

PerfectPLAY is a video poker strategy app for iOS and Android. It serves two kinds of users equally: players who want real-time guidance at a casino machine, and learners who want to practice optimal strategy away from the casino. Both use cases are first-class features.

---

## Users

### Casual Visitors (free)
Unauthenticated users. Limited to one game configuration: **Bonus Poker 6/5 at $1 denomination, 5 coins**. Can use Live Play and Training within that configuration.

### Members
Users with an active paid membership. Access to all supported game variants, paytables, and denominations. Can set and change their game configuration at any time.

---

## Membership

Membership is purchased in-app. Four options:

| Plan | Price | Billing | Processor |
|---|---|---|---|
| Monthly | $12.95/mo | Recurring monthly | PayPal |
| Monthly | $12.95/mo | Recurring monthly | Stripe (credit card, Apple Pay, Google Pay, Cash App) |
| Annual | $99.00/yr | Recurring annually | Stripe only |
| 48-Hour Visitor Pass | $4.99 | One-time | Stripe only |

Monthly and Annual Stripe plans may include a one-time $5.00 setup fee, which can be waived (e.g. via coupon or promotion). The 48-Hour Visitor Pass has no setup fee.

Membership unlocks all 18 supported game variants and paytables. No other feature differences.

An authenticated user without an active membership is treated the same as a casual visitor (Bonus Poker 6/5 $1 5-coin only). Attempting to access member-only game configurations presents the membership purchase screen.

---

## Game Configuration

Before playing, a user has a **game configuration** set: game variant + paytable + denomination + number of coins. This configuration persists across sessions and only changes when the user explicitly updates it.

- **Casual visitors** are locked to: Bonus Poker · 6/5 paytable · $1 · 5 coins.
- **Members** can select from any supported game variant and paytable.

---

## Features

### 1. Live Play

The primary use case. The user is sitting at a video poker machine and wants to know the optimal hold for the hand they've been dealt.

**Flow:**
1. User opens the Live Play screen.
2. User enters the 5 dealt cards — by tapping the card grid (default) or using voice input (secondary option).
3. User hits **DEAL**. App submits the hand to the strategy engine.
4. Result screen displays:
   - The dealt hand with the recommended hold cards highlighted.
   - The strategy line describing the recommended hold.
   - The full EV table — all possible holds ranked by average payout (HOLD / DISCARD / AVG PAYOUT columns). The user can tap any EV row to explore alternative holds.
   - A **Why This Hold?** button that opens a plain-language explanation of why those cards should be held (available for all supported game variants).
   - A toggle to show the game paytable instead of the EV table.
5. User presses **Next Hand** to clear the result and return to card entry. If voice is enabled, saying "next hand" aloud triggers the same action.

**Card input — tap grid:** A visual card picker. User selects rank and suit for each of the 5 cards. Fast and unambiguous.

**Card input — voice:** User speaks the cards aloud (e.g. "Ace of clubs, King of diamonds…"). App transcribes and maps to card notation. Available as a secondary option when tap is inconvenient. Background casino noise may affect voice recognition accuracy; in noisy environments, tap input is more reliable. Voice works best with AirPods or similar, where the result can also be heard.

---

### 2. Training

Practice mode. The app simulates a video poker machine and the user builds strategy knowledge through repetition.

**Flow:**
1. The app deals a random 5-card hand (using the user's current game configuration), or the user manually enters a hand via the card input keyboard.
2. The app submits the hand to the strategy engine and receives the full EV analysis for all possible holds.
3. The user selects which cards to hold — either by tapping cards individually on the displayed hand, or (if **Hand Assist** is on) by tapping one of the EV rows displayed below the hand. Each EV row shows a possible hold, the cards that would be discarded, and the average payout. Tapping a row automatically marks those cards as HELD on the displayed hand.
4. User hits **DRAW** to confirm their hold selection.
5. App evaluates the hold and displays one of three outcomes:
   - **CORRECT HOLD** — the user held the optimal cards, or held an equal-EV alternative (both holds equally valid). If the hand won: **CORRECT HOLD - WIN!**
   - **SUCCESSFUL HOLD** — the user made a suboptimal hold but won anyway due to the draw.
   - **BAD HOLD** — suboptimal hold and no win; shows what should have been held instead.
6. New draw cards are revealed. The running credit totals update:
   - **CREDIT** — the user's actual running total (simulated money).
   - **PerfectPLAY** — what perfect play would have earned over the same hands.
   - **WIN** — this hand's payout.
7. A **"What would it have been?"** button appears after the draw, showing the EV outcome for every hold option against the actual draw cards.
8. The button resets to **DEAL** and a new hand is ready. The session continues until the user exits.

**Hand Assist** is a toggleable setting. When on, the EV table is shown after every deal, making it easier to learn by seeing the consequences of each possible hold. When off, the user must select holds without EV guidance — closer to playing at a real machine.

Training uses the same strategy engine as Live Play. The distinction is that in Training the cards are generated by the app and the user is being evaluated, whereas in Live Play the user provides cards from a real machine and the app is being consulted.

---

### 3. Authentication

- **Sign up** — email + password (Firebase Auth).
- **Log in** — email + password.
- **Logged-out state** — user can access Live Play and Training as a casual visitor (Bonus Poker 6/5 $1 5-coin only). No account required for casual use.
- **Account screen** — shows membership status, active plan, and options to purchase or manage membership.

---

### 4. Voice Input

Voice is a secondary input method available in both Live Play and Training. It is not a separate top-level feature — the user switches between tap/keyboard and voice from within the relevant screen. Voice capabilities differ between the two modes.

**Live Play (LP):** Voice is used for card entry only. The user speaks the dealt cards aloud; the app transcribes and maps them to card notation, then submits the hand on confirmation. On the Results screen, the user can say "next hand" to advance.

**Training (FG):** Voice extends beyond card entry to full hold control. After a hand is dealt, the user can speak natural-language hold commands rather than tapping cards:
- `hold all` / `hold everything` — hold all five cards
- `hold nothing` / `discard all` — hold nothing
- `hold the pair` / `two pairs` / `trips` — hold by hand type
- `hold the spades` / `hold hearts` — hold all cards of a suit
- `hold kings` / `hold two aces` / `hold the jack` — hold by rank and count
- `hold queen and jack` — hold multiple named ranks
- `hold straight flush` / `hold flush` / `hold full house` / `hold quads` — hold all five (made hand)
- `hold 2 3 4` — hold by card position (1-based)
- `draw` / `deal` / `go` — confirm the hold (equivalent to pressing DRAW)

**TTS (Text-to-Speech):** In Training, the app speaks the recommended hold aloud using the device's speech synthesis — e.g. "Hold the ace of hearts and the king of clubs." Provides audio confirmation of what the app recognised from the spoken command.

*Note: Training voice features (hold commands and TTS) are currently in device testing and not yet in production.*

---

## Game Configuration Screen

The game configuration screen is the equivalent of the web app's side drawer. It is accessible from within Live Play and Training. Contents:

- **Recent Games** — up to 5 previously played game/paytable combinations, stored per user in Firestore. Selectable as a quick-switch. Each entry shows the game name, paytable, and a link to paytable stats.
- **Select a New Game** — game type, variant, and paytable dropdowns (members only; casual visitors see a locked/disabled state with a membership CTA).
- **Bet** — number of coins (1–5).
- **Denomination** — coin value (25¢, 50¢, $1, $2, $5, etc.).
- **Confirm / Return to game** — applies the selected configuration and returns to the active screen (Live Play or Training).

Casual visitors (unauthenticated) see the game selection controls disabled and locked to Bonus Poker 6/5 $1 5-coin. Recent Games are not available to casual visitors.

---

## Screens (Top-Level Navigation)

| Screen | Accessible to | Notes |
|---|---|---|
| Live Play | All users | Core feature |
| Training | All users | Core feature |
| Account / Membership | All users | Shows plan; purchase CTA for non-members |
| Game Configuration | All users | Members can configure; visitors see locked state |

---

## Out of Scope (Initial Release)

- Social features, leaderboards, history tracking
- Push notifications
- Offline / cached strategy (app requires network for engine calls)
- Apple Pay / Google Pay (Stripe and PayPal only)
- Tablet-optimised layouts (phone only for v1)
- Android-specific voice engine differences (handled at implementation)
