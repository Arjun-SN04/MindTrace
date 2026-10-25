# MINDTRACE: The City That Lies

*Every suspect has a story. Every story hides a truth.*

A third-person 3D detective game for the browser. You play Alex Mercer, a disgraced investigator, searching rain-soaked Greyhaven for a missing researcher who sent you a photo from the case that ended your career.

This repository currently contains the **first playable milestone**: the prologue of Case 01, *The Missing Researcher*.

## Quick start

Requirements: Node.js 20+ (tested on 24) and a browser with WebGL 2. MongoDB is optional.

```bash
npm run install:all          # installs root, frontend and backend dependencies
cp backend/.env.example backend/.env   # optional: edit MONGODB_URI
npm run dev                  # starts API (port 4000) and game (port 5173)
```

Open the URL Vite prints (normally http://localhost:5173). Then choose **New Investigation**.

If MongoDB isn't running or `MONGODB_URI` is empty, the API keeps saves in memory. The game always saves to `localStorage` as well, and it still works with no backend at all.

## Controls

| Action | Key |
| --- | --- |
| Move | W A S D / arrow keys |
| Look | Mouse (click the game to lock the pointer) |
| Sprint / Jump | Shift / Space |
| Interact | E |
| Case file | J |
| Map | M |
| Pause | Esc |

Settings: mouse sensitivity, invert Y, pointer-lock on/off (off means drag to look), volume, and graphics quality.

## What's in this milestone

- **Old Town slice of Greyhaven.** Calloway Street in the rain. It includes the Halvorsen building (lobby, Unit 1C living room and study), Café Noctua, the alley beside it, and a closed route toward the Harbor District.
- **Third-person controller.** Built on Rapier's kinematic character controller, with acceleration, sprint, jump, stair stepping and collision. The camera follows over the shoulder and pulls in when a wall is in the way.
- **8 clues with stable IDs.** Some have small puzzles: a laptop passcode, finding the anomaly in CCTV frames, dusting a glass for prints, and a closer look at a photograph. Ambient objects can be examined but don't produce clues.
- **Case file.** Tabs for evidence (with type, status, reliability, links and people), a merged timeline, detected contradictions, and character dossiers.
- **Objectives** derived from evidence, plus a map with a marker for the current objective and a prologue-complete screen.
- **Saving.** Autosave to `localStorage`, synced to the API. The server **re-validates every save** against the shared case rules: unknown clues, missing prerequisites, impossible flags. It also recomputes completed objectives itself.
- **Audio.** Rain, footsteps, UI sounds and a low drone, all synthesized with Web Audio. There are no licensed audio files. Audio starts on the first click.
- **Realistic character.** A rigged, motion-captured detective (Microsoft Rocketbox, MIT license) with idle, walk, run, look-around and crouch-to-examine animations. Animation speed matches movement speed, footsteps sync to the stride, and the fedora is attached to the head bone.
- **Realistic scenery.** Real PBR materials (colour, normal and roughness maps) for asphalt, brick, concrete, plaster, wood and tile. Organic puddles on the wet streets mirror the lights. A night-street HDRI provides reflections. Buildings have 3D windows with lit rooms. Street props and furniture are real models: covered cars, lamps, hydrants, AC units, a sofa, desk, pendant lamp and more.
- **Atmosphere.** Fog, rain with ground splashes, light cones under the street lamps, neon, ambient occlusion, bloom and filmic (AgX) tone mapping. A low-quality mode is available.
- **Assets.** All are free and properly licensed; see [frontend/public/assets/CREDITS.md](frontend/public/assets/CREDITS.md). They total about 18 MB.

## Project layout

```
shared/src/        Case data and progress rules used by both sides
  case01.ts        Clues, contradictions, objectives, character dossiers
  progress.ts      Objective evaluation, contradiction detection, save validation
frontend/src/
  game/            3D: world/, player/, camera/, interaction/
  systems/         audio/, saves/, evidence/ (non-React game logic)
  state/           Zustand store (progress + UI state)
  components/      HUD, menus, inspect panel, case journal, map (Tailwind)
backend/src/
  config/env.ts    Zod-validated environment
  routes/ controllers/ services/ models/ schemas/ middlewares/
backend/test/      node:test suite (progress rules + save API)
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API + game with hot reload |
| `npm run check` | Type-check and lint the frontend, type-check and test the backend |
| `npm run build` | Production build of the frontend (`frontend/dist`) |
| `npm --prefix backend start` | Run the API without watch mode |

## Environment variables (`backend/.env`)

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `4000` | API port. The Vite dev server proxies `/api` here. |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated list |
| `MONGODB_URI` | *(empty)* | Optional. Empty means in-memory saves. |
| `LLM_PROVIDER` / `LLM_API_KEY` | `none` | Reserved for AI interrogation. Keys stay on the server and never go in `VITE_*` variables. |

## API

- `GET /api/health` returns `{ ok, saves: "mongo" | "memory", ai }`
- `GET /api/saves/:playerId` returns the latest validated save
- `PUT /api/saves/:playerId` saves after validation. It returns 400 for a malformed save and 422 for progress the case rules say is impossible. Rate limited.

## Not built yet (next milestones)

- AI interrogation of Maya Chen, Inspector Rao and Elias Moreau (Phase 4). This includes character knowledge limits, structured JSON responses, memory summaries and fallbacks.
- Evidence board with draggable cards, hypotheses and theory submission, plus the chapter endings (Phase 5).
- Chapter 2 locations, NPC character models, recorded audio, and mobile controls.
- Accounts. Saves are currently keyed by an anonymous player ID stored in the browser.
- Code-splitting. The bundle is about 1.2 MB gzipped, mostly the embedded Rapier physics engine.
