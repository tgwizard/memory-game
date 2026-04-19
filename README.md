# Memory Game

A tiny memory game in vanilla HTML, CSS, and JavaScript — no build step, no dependencies.

**Play:** https://tgwizard.github.io/memory-game/

## Modes

- **Classic · Pairs** — 5 difficulties from 4×3 (Easy) to 8×6 (Extreme).
- **Triples · Match 3** — themed maps (Animals, Food, Faces, Nature, Travel) where matches require three of a kind.

Personal bests per mode/difficulty are stored in `localStorage`.

## Running locally

Any static file server will do:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Files

- `index.html` — single page, mounts `#app`
- `styles.css` — all styling
- `game.js` — game state, rendering, matching logic
- `docs/superpowers/specs/` — design notes
