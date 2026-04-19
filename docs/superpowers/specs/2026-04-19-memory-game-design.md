# Memory Game — Design

## Overview

A single-page memory game built with vanilla HTML, CSS, and JavaScript. No build
step, no framework. Deployed to GitHub Pages from a new public repo at
`tgwizard/memory-game`, served at `https://tgwizard.github.io/memory-game/`.

## Goals

- Play a classic memory (pairs) game at five difficulty levels.
- Play a "triples" variant on a set of themed maps where matches require 3
  identical cards.
- Remember personal bests per (mode, difficulty) in `localStorage`.
- Work well on desktop and modern mobile browsers.

## Non-goals

- No sound, accounts, multiplayer, or leaderboards.
- No animations beyond card flip.
- No build system, package manager, or framework.

## File layout

```
index.html   — single page, mounts #app
styles.css   — all styling
game.js      — state, rendering, event handling
README.md    — short overview + link to live site
```

## Screens (SPA state, rendered by swapping DOM under #app)

1. **Start screen** — title, mode toggle (Classic / Triples), difficulty or map
   selector, "Start" button.
2. **Game screen** — move counter, timer, back button, board grid.
3. **Win screen** — final time and moves; indicator if new personal best;
   "Play again" and "Back to start" buttons.

## Modes and sizes

### Classic (match 2)

| Difficulty  | Grid  | Pairs | Cards |
| ----------- | ----- | ----- | ----- |
| Easy        | 4×3   | 6     | 12    |
| Medium      | 4×4   | 8     | 16    |
| Hard        | 6×4   | 12    | 24    |
| Very Hard   | 6×6   | 18    | 36    |
| Extreme     | 8×6   | 24    | 48    |

Emojis chosen at random from a shared catalog.

### Triples (match 3) — themed maps

| Map     | Grid  | Triples | Cards |
| ------- | ----- | ------- | ----- |
| Animals | 4×3   | 4       | 12    |
| Food    | 6×3   | 6       | 18    |
| Faces   | 6×4   | 8       | 24    |
| Nature  | 6×5   | 10      | 30    |
| Travel  | 8×6   | 16      | 48    |

Each map has its own curated emoji list so the board reads as a cohesive theme.

## Game logic

State object:

```js
{
  matchSize: 2 | 3,
  cards: [{ id, emoji, matched }],  // shuffled
  revealed: [cardId],               // currently face-up, not yet resolved
  moves: 0,
  startedAt: timestampMs,
  endedAt: null,
}
```

Click handler on a face-down card:

1. Ignore if already matched, already in `revealed`, or `revealed.length === matchSize`.
2. Push card id onto `revealed`. Re-render.
3. If `revealed.length === matchSize`:
   - Increment `moves`.
   - If all revealed cards share the same emoji: mark them matched, clear `revealed`.
   - Else: after ~900 ms, clear `revealed` (cards flip back).
4. When every card is matched, set `endedAt`, save personal best, render Win screen.

Shuffle uses Fisher–Yates.

## Persistence

`localStorage` key `memory-game:best` stores:

```json
{
  "classic:easy": { "timeMs": 12345, "moves": 20 },
  "triples:animals": { "timeMs": 18000, "moves": 15 },
  ...
}
```

A new best replaces the old one if it has a lower time (moves as tiebreaker).

## UI

- CSS Grid for the board, columns/rows set inline per mode.
- Cards use a 3D flip (`transform: rotateY(180deg)`) with a `.flipped` class.
- Emojis rendered as large text; font size scales with card size.
- Viewport-based sizing so large boards still fit on screen.
- Dark neutral background, high-contrast foreground, single accent color.
- Responsive down to ~360 px wide.

## Testing

Manual, browser-based. Verify:

- Each difficulty/map renders the correct grid and card count.
- Matches clear, non-matches flip back, timer and moves update.
- Win screen appears only when the board is fully matched.
- Personal best updates only when beaten.
- Back button returns to start from game or win screen.
- Layout holds on a narrow (mobile) viewport.

No automated test suite — scope does not justify one.

## Deployment

1. Create public GitHub repo `tgwizard/memory-game` via `gh repo create`.
2. Initial commit with working game on `main`.
3. Enable GitHub Pages from `main` branch root via `gh api`.
4. Verify the site loads at `https://tgwizard.github.io/memory-game/`.
