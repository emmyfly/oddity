# Oddity

Oddity is a daily puzzle game for Reddit. Every day, all players worldwide see
the exact same 5×5 grid of shapes — every tile is identical except one "odd"
tile that differs in color, shape, or rotation. Find it and tap it as fast as
you can. Wrong taps add a small time penalty instead of failing you outright.

Oddity is for anyone who enjoys quick daily puzzles in the style of Wordle —
no account setup, no tutorial, just open the post and play. Solving builds a
daily streak (tracked per-Reddit-account) and a personal best time, and you
can copy a spoiler-free result ("Oddity #12 — 2.4s ⏱️ Streak: 6 🔥") to share
in comments. Each puzzle can only be played once per day per account; if you
reopen the post after solving, you'll see your existing result instead of a
fresh grid.

**Critical operational notes:**

- Puzzles are generated deterministically from the current UTC date — no
  server-side puzzle authoring is needed, and there is nothing to moderate
  about puzzle content itself.
- Per-user progress (streak, best time, last-played date) is stored in Redis,
  keyed to the player's Reddit username, and expires automatically after 30
  days of inactivity per Reddit's data retention guidance.
- The game requires the player to be logged in to Reddit to save progress;
  logged-out visitors can still play but their result won't persist.

## How to play

1. Open an Oddity post and tap **Play**.
2. Find the one tile that looks different from all the others and tap it.
3. Wrong taps add a 0.5s penalty — the timer keeps running.
4. On solving, you'll see your time, current streak, and (if applicable) a
   new personal best, plus a button to copy a shareable result.
5. Come back the next day (UTC) for a new puzzle and to keep your streak.

## For moderators: creating a post

Use the subreddit's three-dot menu → **Create a new Oddity post** to publish
a new game post to the community. This is the only moderator-facing action
the app exposes.

## Configure & deploy (for developers)

Requires Node ≥22.2.0.

1. `npm install`
2. `npm run login` — authenticates the Devvit CLI with your Reddit account
   (opens a browser window).
3. `npm run dev` — runs `devvit playtest`: builds the app, installs it to a
   small test subreddit, and live-reloads on every save.
4. `npm run type-check` / `npm run lint` / `npm test` — verify changes before
   publishing.
5. `npm run deploy` — type-checks, lints, and uploads a new app version.
6. `npm run launch` — deploys and submits the app for Reddit's app review.

## Tech stack

- [Devvit Web](https://developers.reddit.com/): Reddit's developer platform
  (Redis storage, Reddit API access, app hosting)
- [Phaser](https://phaser.io/): 2D rendering and input for the puzzle grid
- [Hono](https://hono.dev/): server-side routing
- [Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/):
  build tooling and type safety
