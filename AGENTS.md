# Nudge

## What this is

A personal, mobile-first app for swiping through saved images and short texts as reminders. Right = see more often, left = see less often. Design: CraftOS Direction B.

## Start here

Read [STATE.md](STATE.md) first. If later changes affect other files, treat it as potentially stale.

## Structure

- `src/domain/`: pure deck rules. No React. The worker also uses them. Tested in `tests/`.
- `src/data/`: `store.js` chooses the data source. 
- `worker/`, `migrations/`, `wrangler.jsonc`: Cloudflare API, database, settings.
- `src/demo/`: sample cards, loaded only by `--mode demo`.
- `src/pages/`, `src/components/`: UI. Receive data through props.
- `docs/mockups/`: throwaway prototypes. Never import them from `src/`. Edit `iphone/`, then run `node docs/mockups/build.mjs`; `iphone15.html` is generated.
- `src/domain/rank.js`: card ranking and collection sort. `session.js` holds the top and next card.

## Rules

- Test swipes with `npm run demo`. `npm run dev` runs the Cloudflare backend locally with a local database; set `OWNER_CODE` in `.dev.vars` (not committed).
- This is a web app, not an iOS app. Design for Safari and Home Screen mode: ignore drags that start within 24 px of the screen edge, do not rely on haptics, and keep controls above the Safari bar.
- Never crop a card image: text inside it must stay readable.
- CraftOS exception (Aston, 2026-11-24): gradients and glow are allowed here. Light comes only from the current card's colors or the swipe direction. Text on it keeps 4.5:1 contrast.
- The repo and the site are public. Do not commit personal cards or the code.

## Verify

Run `./verify`.
