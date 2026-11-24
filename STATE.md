# Project State

Status: active
Tier: Maintained Product
Last verified ref: e20fa4f
Last verified at: 2026-11-24

## Current capability

- The prototype `docs/mockups/nudge-next.html`, approved by Aston on 2026-11-24, is in the app and live: three glass buttons (skip, collection, like), add inside the collection, two-step add, six text templates, six avatars. Ranking comes from `src/domain/rank.js`.
- Text cards use `card.template` (default `plain`). Only people who may delete can change it later, in the detail page. The old free layout editor is gone: image cards saved with `art` keep their layout; text cards show a template.
- Glass needs something to transmit: the page takes a light color from the current card (`src/lib/light.js`), and lists run under the header.
- The 書摘 font (Noto Serif TC, OFL) is self-hosted and loads only when a book card is on screen.
- Detail shows counts as bars, a ring, and a timeline. Every graphic has a text label for screen readers.
- Failed reads, swipe saves, adds, and deletes each show a message.
- Cloudflare backend, chosen by Aston on 2026-11-24 in place of Firebase: `worker/` (API), D1 (cards), KV (images, only with a valid code). KV, not R2, so that no paid service is needed. A code is a person and works on any device. The owner's code is the `OWNER_CODE` secret; the owner adds other codes in the app (collection, avatar). Everyone adds cards; only the owner, and people the owner allows, delete. Cards are shared; counts and ranking are per person.
- Renamed to Nudge, "Swipe what matters" (Aston, 2026-11-24). The folder, the GitHub repo, and the old GitHub Pages address still say mneme.
- The launch cover is in `index.html` (timing from Personal CFO; the slogan in `src/slogan.svg` is single strokes traced from the Sacramento font; `src/wordmark.svg` is Newsreader Bold; both OFL). It stays until the cards are ready, at most 12 s.
- Live at https://nudge.astonlu.com since 2026-11-24. The old GitHub Pages build is a separate site on Firebase and was not changed.

## Verification

- 2026-11-24, local: `./verify` passed (lint, 16 tests, build; sample cards absent from the production bundle).
- Demo mode in the built-in browser, 393 px, scripted pointer events: mouse and touch drags, flick, slow short drag, vertical drag, edge start, cancel, resize during a drag, 10 fast swipes in a row, arrow keys. All as designed.
- Same setup: sort, detail, delete to empty, one card left, unreadable image, image and text move and pinch, bad link, discard, preview, add, long text. Layout seen at 320, 393, and 1440 px. Read error seen against real Firestore (read only).
- `rank.js` simulation, 3 seeds, 40 cards, 60 days: liked cards shown 8 to 10 times as often, every card at least 5 times. The "lost" slot never fired in that setup.
- Local Cloudflare (`wrangler dev`): unknown code, owner and member sign-in, duplicate code, member cannot manage people or delete, delete after permission, same counts on two devices, separate counts per person, removed person signed out, foreign origin, image type. In the browser: owner adds a member, member adds a card and has no delete button. Launch cover frames seen at 560 and 1750 ms.
- Live site: page, sign-in page, wrong code refused, API closed without a code. Signing in, adding, and images were not tried on the live site.
- Not run: a physical iPhone (Safari and Home Screen), the save and delete failure messages, reduced motion, screen reader, the launch cover on a slow network, real speed of the launch animation.

- 2026-11-24, branch `three-buttons`, local: `./verify` passed (20 tests). Demo in the built-in browser at 320, 393, and 1440 px: deck, drag, collection, sort menu, template change, avatar change, member switch and add, add from a Threads link. Local Cloudflare with a throwaway database: migration 0002, avatar of owner and member, template change, refused for a member, a bad value, and without a code.
- Deployed 2026-11-24 from commit e20fa4f (version 27919f7d); migration 0002 is on the live database. Checked: page, script, style, and font files are served; API closed without a code. Not checked live: anything after sign-in.
- Not run: a physical iPhone (glass, keyboard with the add tools), the image picker, reduced motion, screen reader, failure messages.

## Known issues / risks

- A short code can be guessed, and there is no try limit. Accepted by Aston on 2026-11-24.
- Free plan limits (Cloudflare docs, 2026-11-24): 100,000 Worker requests a day, KV 1 GB and 1,000 writes a day, D1 500 MB per database. Over the limit, calls fail; nothing is charged. 10 ms CPU per request was not measured on Cloudflare.
- Old cards: 2 of 4 moved on 2026-11-24 (text, with the owner's counts; read back from D1). The other 2 have images; Firebase Storage returns 402 because the project's billing account is closed. Aston decided on 2026-11-24 not to move them. Backup of all 4 documents: `~/Documents/nudge-backup/` (outside the repo).
- `npm audit --omit=dev`: 0. Development tools: 11 (8 high), not updated.
- Light look only. There is no dark mode.

## Next actions

- Merge `three-buttons` to main (local commits, not pushed).
- Check the app on a physical iPhone.
