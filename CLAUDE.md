# CLAUDE.md — /devspot/expo

This is the **PerfectPLAY native app** project — a React Native / Expo implementation of PerfectPLAY.vegas targeting the Google Play Store and Apple App Store.

It is a **standalone project**, not a monorepo. It is separate from the web codebase at `/devspot/np2`.

---

## Project Decisions (established before scaffold)

| Concern | Decision |
|---|---|
| Framework | Expo (managed workflow) with Expo Router |
| Language | TypeScript throughout |
| Styling | NativeWind v4 (Tailwind class names in JSX) |
| State | Zustand (same as web app) |
| Auth | Firebase Auth (same Firebase project as web app) |
| Payments | Stripe React Native SDK + PayPal (TBD native support) |
| Platforms | iOS + Android from day one |
| App bundle ID | `com.perfectplay.vegas` |
| Package manager | yarn (classic 1.x — do not use npm or pnpm) |
| HTTP | Native `fetch` — do not add axios |
| Backend API | `https://vegaslearning.com/api/` (vpengine Django REST API) |

---

## Initial Feature Scope

Full scaffold with placeholder screens for all feature areas:

- **Auth** — Login, Signup, Membership
- **Live Play** — Hand Input → call vpengine API → Results + Why This Hold?
- **Training** — placeholder
- **Voice** — placeholder (voice input for card entry)
- **Members** — placeholder

Live play is the priority working feature. Auth, training, voice, and members are scaffolded but can be stubs initially.

---

## Relationship to np2 (Web App)

The native app **shares the backend** (`vegaslearning.com/api/`) but does **not share code** with np2. Key shared concepts:

- Card notation: single-letter suit suffix — `Ac`, `Kd`, `Th`, `2h`, `As`
- Wild cards: `W` internally for Deuces Wild games
- `noSpacesHand` — 10-char string (5 cards × 2 chars); `XXXXXXXXXX` = empty
- API endpoint: `POST /api/common/dispatch` — returns base64 + pako-compressed JSON
- Firebase Auth: same project, same credentials

## Environment / Secrets

Secrets live in `../perfectplay.env/.env` (same shared env store as np2).
Never commit `.env.local` or any file with real credentials.

---

## Commands (once scaffolded)

```bash
yarn start          # Expo dev server
yarn ios            # iOS simulator
yarn android        # Android emulator
yarn lint
yarn test
```

---

## What Not To Do

- Do not use npm or pnpm — yarn only
- Do not add axios — use native fetch
- Do not commit credentials or `.env.local`
- Do not create a monorepo structure
- Do not import from `/devspot/np2` — this is a standalone project
- Do not use the Pages Router pattern — use Expo Router file-based routing

---

## Developer Context

Solo developer. GitHub: `billybeetroot`. Production web app lives at `perfectplay.vegas` (np2). This native app is a new product track alongside it.

For workspace-wide conventions (git workflow, feature branches, production caution), see `/devspot/CLAUDE.md`.
