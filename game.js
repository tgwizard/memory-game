(() => {
  "use strict";

  // ---- Data ----

  const CLASSIC_EMOJIS = [
    "🐶","🐱","🦊","🐻","🐼","🐸","🐵","🦁","🐯","🐨",
    "🐰","🐮","🐷","🐔","🐙","🦋","🐢","🐝","🦄","🐞",
    "🍎","🍌","🍇","🍓","🍒","🍉","🍑","🥝","🥑","🌽",
    "🍕","🍔","🍟","🌮","🍣","🍩","🍪","🍰","🍫","🍿",
    "⚽","🏀","🏈","🎾","🎱","🎲","🎨","🎸","🎺","🎮",
    "🚗","✈️","🚀","🛸","⛵","🚲","🏎️","🚁","🛶","🚂",
  ];

  const DIFFICULTIES = {
    classic: {
      easy:       { name: "Easy",      cols: 4,  rows: 3 },
      medium:     { name: "Medium",    cols: 4,  rows: 4 },
      hard:       { name: "Hard",      cols: 6,  rows: 4 },
      "very-hard":{ name: "Very Hard", cols: 6,  rows: 6 },
      extreme:    { name: "Extreme",   cols: 8,  rows: 6 },
      insane:     { name: "Insane",    cols: 10, rows: 8 },
      nightmare:  { name: "Nightmare", cols: 12, rows: 8 },
    },
    triples: {
      easy:       { name: "Easy",      cols: 4,  rows: 3 },
      medium:     { name: "Medium",    cols: 6,  rows: 3 },
      hard:       { name: "Hard",      cols: 6,  rows: 4 },
      "very-hard":{ name: "Very Hard", cols: 6,  rows: 6 },
      extreme:    { name: "Extreme",   cols: 8,  rows: 6 },
      insane:     { name: "Insane",    cols: 10, rows: 6 },
      nightmare:  { name: "Nightmare", cols: 12, rows: 8 },
    },
  };
  const DIFFICULTY_ORDER = [
    "easy",
    "medium",
    "hard",
    "very-hard",
    "extreme",
    "insane",
    "nightmare",
  ];

  const BEST_KEY = "memory-game:best";

  // ---- Utility ----

  function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function loadBests() {
    try {
      return JSON.parse(localStorage.getItem(BEST_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function saveBest(key, record) {
    const bests = loadBests();
    const prev = bests[key];
    const beats =
      !prev ||
      record.timeMs < prev.timeMs ||
      (record.timeMs === prev.timeMs && record.moves < prev.moves);
    if (beats) {
      bests[key] = record;
      localStorage.setItem(BEST_KEY, JSON.stringify(bests));
      return true;
    }
    return false;
  }

  function bestKey(mode, pick) {
    return `${mode}:${pick}`;
  }

  // ---- State ----

  const app = document.getElementById("app");

  const ui = {
    screen: "start",          // "start" | "game" | "win"
    mode: "classic",          // "classic" | "triples"
    classicPick: "easy",
    triplesPick: "easy",
  };

  const game = {
    matchSize: 2,
    cols: 4,
    rows: 3,
    cards: [],
    revealed: [],             // card ids currently face-up, not yet matched
    moves: 0,
    startedAt: 0,
    endedAt: 0,
    locked: false,            // input lock during flip-back
    timerId: null,
    mode: "classic",
    pick: "easy",
    lastResult: null,         // { timeMs, moves, isBest }
  };

  // ---- Render: Start ----

  function renderStart() {
    const bests = loadBests();

    const root = el("section", { class: "start" });
    root.append(el("h1", {}, "Memory"));
    root.append(
      el(
        "p",
        { class: "subtitle" },
        "Flip cards to find matches. Pick a difficulty, or switch to Triples to hunt three-of-a-kind.",
      ),
    );

    const tabs = el("div", { class: "mode-tabs", role: "tablist" });
    const classicTab = el(
      "button",
      { type: "button", class: ui.mode === "classic" ? "active" : "" },
      "Classic · Pairs",
    );
    const triplesTab = el(
      "button",
      { type: "button", class: ui.mode === "triples" ? "active" : "" },
      "Triples · Match 3",
    );
    classicTab.addEventListener("click", () => {
      ui.mode = "classic";
      render();
    });
    triplesTab.addEventListener("click", () => {
      ui.mode = "triples";
      render();
    });
    tabs.append(classicTab, triplesTab);
    root.append(tabs);

    const options = el("div", { class: "options" });
    options.append(el("h2", {}, "Difficulty"));
    const grid = el("div", { class: "option-grid" });
    const matchSize = ui.mode === "classic" ? 2 : 3;
    const groupLabel = ui.mode === "classic" ? "pairs" : "triples";
    const currentPick = ui.mode === "classic" ? ui.classicPick : ui.triplesPick;
    for (const key of DIFFICULTY_ORDER) {
      const d = DIFFICULTIES[ui.mode][key];
      const cards = d.cols * d.rows;
      const best = bests[bestKey(ui.mode, key)];
      const card = el(
        "button",
        {
          type: "button",
          class: "option-card" + (currentPick === key ? " selected" : ""),
        },
        el("span", { class: "option-name" }, d.name),
        el(
          "span",
          { class: "option-meta" },
          `${d.cols}×${d.rows} · ${cards / matchSize} ${groupLabel}`,
        ),
        best
          ? el(
              "span",
              { class: "option-best" },
              `Best: ${formatTime(best.timeMs)} · ${best.moves} moves`,
            )
          : null,
      );
      card.addEventListener("click", () => {
        if (ui.mode === "classic") ui.classicPick = key;
        else ui.triplesPick = key;
        render();
      });
      grid.append(card);
    }
    options.append(grid);

    const actions = el("div", { class: "start-actions" });
    if (Object.keys(bests).length > 0) {
      const clearBtn = el(
        "button",
        { type: "button", class: "ghost" },
        "Clear scores",
      );
      clearBtn.addEventListener("click", () => {
        if (confirm("Clear all saved personal bests?")) {
          localStorage.removeItem(BEST_KEY);
          render();
        }
      });
      actions.append(clearBtn);
    }
    const startBtn = el("button", { type: "button", class: "primary" }, "Start game");
    startBtn.addEventListener("click", startGame);
    actions.append(startBtn);
    options.append(actions);

    root.append(options);

    app.replaceChildren(root);
  }

  // ---- Render: Game ----

  function renderGame() {
    const root = el("section", { class: "game" });

    const hud = el("div", { class: "hud" });
    const backBtn = el("button", { type: "button", class: "ghost" }, "← Back");
    backBtn.addEventListener("click", goToStart);
    hud.append(backBtn);
    hud.append(el("div", { class: "spacer" }));
    hud.append(
      el(
        "div",
        { class: "stat" },
        el("span", { class: "stat-label" }, "Time"),
        el("span", { class: "stat-value", id: "stat-time" }, "0:00"),
      ),
    );
    hud.append(
      el(
        "div",
        { class: "stat" },
        el("span", { class: "stat-label" }, "Moves"),
        el("span", { class: "stat-value", id: "stat-moves" }, "0"),
      ),
    );
    hud.append(
      el(
        "div",
        { class: "stat" },
        el("span", { class: "stat-label" }, "Matched"),
        el(
          "span",
          { class: "stat-value", id: "stat-matched" },
          `0/${game.cards.length / game.matchSize}`,
        ),
      ),
    );
    root.append(hud);

    const board = el("div", { class: "board", id: "board" });
    board.style.setProperty("--cols", String(game.cols));
    board.style.setProperty("--rows", String(game.rows));
    for (const card of game.cards) {
      board.append(renderCard(card));
    }
    root.append(board);

    app.replaceChildren(root);

    updateStats();
  }

  function renderCard(card) {
    const btn = el("button", {
      type: "button",
      class: "card",
      "data-id": String(card.id),
      "aria-label": "Hidden card",
    });
    btn.append(
      el(
        "div",
        { class: "card-inner" },
        el("div", { class: "card-face card-back" }, "?"),
        el("div", { class: "card-face card-front" }, card.emoji),
      ),
    );
    btn.addEventListener("click", () => onCardClick(card.id));
    updateCardEl(btn, card);
    return btn;
  }

  function updateCardEl(btn, card) {
    const isRevealed = game.revealed.includes(card.id);
    const flipped = card.matched || isRevealed;
    btn.classList.toggle("flipped", isRevealed && !card.matched);
    btn.classList.toggle("matched", card.matched);
    btn.disabled = card.matched || isRevealed;
    btn.setAttribute(
      "aria-label",
      flipped ? `Card showing ${card.emoji}` : "Hidden card",
    );
  }

  function updateStats() {
    const time = document.getElementById("stat-time");
    const moves = document.getElementById("stat-moves");
    const matched = document.getElementById("stat-matched");
    if (!time) return;
    const now = game.endedAt || Date.now();
    time.textContent = formatTime(now - game.startedAt);
    moves.textContent = String(game.moves);
    const matchedCount =
      game.cards.filter((c) => c.matched).length / game.matchSize;
    matched.textContent = `${matchedCount}/${game.cards.length / game.matchSize}`;
  }

  // ---- Render: Win ----

  function renderWin() {
    const root = el("section", { class: "win" });
    root.append(el("h1", {}, "🎉 You did it"));
    const pickName = DIFFICULTIES[game.mode][game.pick].name;
    root.append(
      el(
        "p",
        {},
        `${game.mode === "classic" ? "Classic" : "Triples"} · ${pickName}`,
      ),
    );

    const stats = el("div", { class: "win-stats" });
    stats.append(
      el(
        "div",
        { class: "stat" },
        el("span", { class: "stat-label" }, "Time"),
        el("span", { class: "stat-value" }, formatTime(game.lastResult.timeMs)),
      ),
    );
    stats.append(
      el(
        "div",
        { class: "stat" },
        el("span", { class: "stat-label" }, "Moves"),
        el("span", { class: "stat-value" }, String(game.lastResult.moves)),
      ),
    );
    root.append(stats);

    if (game.lastResult.isBest) {
      root.append(el("div", { class: "win-badge" }, "★ New personal best"));
    }

    const actions = el("div", { class: "win-actions" });
    const again = el("button", { type: "button", class: "primary" }, "Play again");
    again.addEventListener("click", () => startGame());
    const back = el("button", { type: "button", class: "ghost" }, "Back to start");
    back.addEventListener("click", goToStart);
    actions.append(again, back);
    root.append(actions);

    app.replaceChildren(root);
  }

  // ---- Game flow ----

  function startGame() {
    stopTimer();

    const mode = ui.mode;
    const pick = mode === "classic" ? ui.classicPick : ui.triplesPick;
    const matchSize = mode === "classic" ? 2 : 3;
    const d = DIFFICULTIES[mode][pick];
    const cols = d.cols;
    const rows = d.rows;
    const groups = (cols * rows) / matchSize;
    const emojis = shuffle(CLASSIC_EMOJIS).slice(0, groups);

    const cards = [];
    let id = 0;
    for (const emoji of emojis) {
      for (let k = 0; k < matchSize; k++) {
        cards.push({ id: id++, emoji, matched: false });
      }
    }

    game.mode = mode;
    game.pick = pick;
    game.matchSize = matchSize;
    game.cols = cols;
    game.rows = rows;
    game.cards = shuffle(cards);
    game.revealed = [];
    game.moves = 0;
    game.startedAt = Date.now();
    game.endedAt = 0;
    game.locked = false;
    game.lastResult = null;

    ui.screen = "game";
    render();
    startTimer();
  }

  function onCardClick(cardId) {
    if (game.locked) return;
    const card = game.cards.find((c) => c.id === cardId);
    if (!card || card.matched) return;
    if (game.revealed.includes(cardId)) return;
    if (game.revealed.length >= game.matchSize) return;

    game.revealed.push(cardId);
    syncBoard();

    if (game.revealed.length === game.matchSize) {
      game.moves += 1;
      updateStats();

      const revealedCards = game.revealed.map((id) =>
        game.cards.find((c) => c.id === id),
      );
      const allMatch = revealedCards.every(
        (c) => c.emoji === revealedCards[0].emoji,
      );

      if (allMatch) {
        for (const c of revealedCards) c.matched = true;
        game.revealed = [];
        syncBoard();
        if (game.cards.every((c) => c.matched)) {
          finishGame();
        }
      } else {
        game.locked = true;
        setTimeout(() => {
          game.revealed = [];
          game.locked = false;
          syncBoard();
        }, 900);
      }
    }
  }

  function syncBoard() {
    const board = document.getElementById("board");
    if (!board) return;
    const buttons = board.querySelectorAll(".card");
    for (const btn of buttons) {
      const id = Number(btn.getAttribute("data-id"));
      const card = game.cards.find((c) => c.id === id);
      if (card) updateCardEl(btn, card);
    }
  }

  function startTimer() {
    stopTimer();
    game.timerId = setInterval(updateStats, 250);
  }

  function stopTimer() {
    if (game.timerId) {
      clearInterval(game.timerId);
      game.timerId = null;
    }
  }

  function finishGame() {
    stopTimer();
    game.endedAt = Date.now();
    const timeMs = game.endedAt - game.startedAt;
    const isBest = saveBest(bestKey(game.mode, game.pick), {
      timeMs,
      moves: game.moves,
    });
    game.lastResult = { timeMs, moves: game.moves, isBest };
    ui.screen = "win";
    render();
  }

  function goToStart() {
    stopTimer();
    ui.screen = "start";
    render();
  }

  // ---- DOM helper ----

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === "class") node.className = v;
        else node.setAttribute(k, v);
      }
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      node.append(child instanceof Node ? child : document.createTextNode(child));
    }
    return node;
  }

  function render() {
    if (ui.screen === "start") renderStart();
    else if (ui.screen === "game") renderGame();
    else if (ui.screen === "win") renderWin();
  }

  render();
})();
