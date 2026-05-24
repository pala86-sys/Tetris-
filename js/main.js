import { KEY_MAP } from './constants.js';
import { Game, MODES } from './game.js';
import { sounds } from './sounds.js';
import { LobbyUI } from './lobby.js';
import { OnlineController } from './online.js';

class UI {
  constructor() {
    this.elements = {
      menuScreen: document.getElementById('menu-screen'),
      gameScreen: document.getElementById('game-screen'),
      soloLayout: document.getElementById('solo-layout'),
      versusLayout: document.getElementById('versus-layout'),
      soloBoard: document.getElementById('solo-board'),
      soloNext: document.getElementById('solo-next'),
      soloHold: document.getElementById('solo-hold'),
      soloScore: document.getElementById('solo-score'),
      soloLevel: document.getElementById('solo-level'),
      soloLines: document.getElementById('solo-lines'),
      modeLabel: document.getElementById('mode-label'),
      versusTimer: document.getElementById('versus-timer'),
      pauseOverlay: document.getElementById('pause-overlay'),
      gameoverOverlay: document.getElementById('gameover-overlay'),
      gameoverTitle: document.getElementById('gameover-title'),
      gameoverMsg: document.getElementById('gameover-msg'),
      gameoverStats: document.getElementById('gameover-stats'),
      aiDifficulty: document.getElementById('ai-difficulty'),
      lobbyScreen: document.getElementById('lobby-screen'),
    };
  }

  showScreen(screen) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    screen.classList.add('active');
  }

  showMenu() {
    this.showScreen(this.elements.menuScreen);
    this.elements.lobbyScreen?.classList.add('hidden');
    this.elements.lobbyScreen?.classList.remove('active');
    this.hidePause();
    this.hideGameOver();
  }

  showGameScreen(mode) {
    this.showScreen(this.elements.gameScreen);
    const labels = {
      [MODES.SOLO]: '單人模式',
      [MODES.VERSUS_HUMAN]: '雙人 PK',
      [MODES.VERSUS_AI]: '對戰 AI',
      [MODES.VERSUS_ONLINE]: '線上對戰',
    };
    this.elements.modeLabel.textContent = labels[mode] || '';
  }

  showPause() {
    this.elements.pauseOverlay.classList.remove('hidden');
  }

  hidePause() {
    this.elements.pauseOverlay.classList.add('hidden');
  }

  showGameOver(title, msg, stats) {
    this.elements.gameoverTitle.textContent = title;
    this.elements.gameoverMsg.textContent = msg;
    this.elements.gameoverStats.innerHTML = stats;
    this.elements.gameoverOverlay.classList.remove('hidden');
  }

  hideGameOver() {
    this.elements.gameoverOverlay.classList.add('hidden');
  }
}

let ui;
let game;
let lobby;
let online;

let pendingMode = null;
let aiDifficulty = 'normal';

function bindClick(id, handler) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[Tetris] Missing element #${id}`);
    return;
  }
  el.addEventListener('click', handler);
}

function initApp() {
  ui = new UI();
  game = new Game(ui);
  lobby = new LobbyUI(ui.elements.lobbyScreen);
  online = new OnlineController({ game, ui, lobby });
  online.init();
  bindMenuEvents();
}

function bindMenuEvents() {

function localPlayerIndex() {
  return game.isOnline ? game.localPlayerIndex : 0;
}

// Delayed Auto Shift (DAS) / Auto Repeat Rate (ARR)
const INPUT_REPEAT = {
  dasMs: 140,
  arrMs: 45,
};

// key: `${playerIndex}:${action}` -> { timeoutId, intervalId }
const repeaters = new Map();

function getAction(keys, code) {
  for (const [action, key] of Object.entries(keys)) {
    if (key === code) return action;
  }
  return null;
}

function stopRepeater(playerIndex, action) {
  const key = `${playerIndex}:${action}`;
  const r = repeaters.get(key);
  if (!r) return;
  if (r.timeoutId) clearTimeout(r.timeoutId);
  if (r.intervalId) clearInterval(r.intervalId);
  repeaters.delete(key);
}

function applySoftDrop(playerIndex) {
  const p = game.players[playerIndex];
  if (!p || (game.isOnline && !p.isLocal)) return;
  const result = p.softDrop();
  if (result && result !== true) {
    game.onLockResult(p, result);
  } else if (game.isOnline) {
    game.online?.sendAction('softDrop');
    game.online?.sendState(p);
  }
}

function setSoftDropHeld(playerIndex, held) {
  const p = game.players[playerIndex];
  if (!p || (game.isOnline && !p.isLocal)) return;
  if (game.isOnline) {
    game.setSoftDropHeld(playerIndex, held);
    if (held) applySoftDrop(playerIndex);
    return;
  }
  p.setSoftDrop(held);
  if (held) applySoftDrop(playerIndex);
}

function startRepeater(playerIndex, action, fire) {
  const key = `${playerIndex}:${action}`;
  if (repeaters.has(key)) return;

  // First move happens immediately (already fired by caller).
  const timeoutId = setTimeout(() => {
    // If still held, start ARR.
    const intervalId = setInterval(() => fire(), INPUT_REPEAT.arrMs);
    const r = repeaters.get(key);
    if (r) r.intervalId = intervalId;
  }, INPUT_REPEAT.dasMs);

  repeaters.set(key, { timeoutId, intervalId: null });
}

function handleKeyDown(e) {
  if (!game) return;
  // We implement our own repeat for left/right (DAS/ARR). Ignore native repeats.
  if (e.repeat) return;

  if (e.code === 'Escape' || e.code === 'KeyP') {
    const gameOverVisible = !ui.elements.gameoverOverlay.classList.contains('hidden');
    if (game.running && !gameOverVisible) {
      if (game.paused) game.resume();
      else game.pause();
    }
    return;
  }

  if (!game.running || game.paused) return;

  const localIdx = localPlayerIndex();
  const p1Action = getAction(KEY_MAP.p1, e.code);
  if (p1Action) {
    e.preventDefault();
    if (p1Action === 'down') {
      setSoftDropHeld(localIdx, true);
    } else if (p1Action === 'hardDrop') {
      game.processLock(game.players[localIdx]);
    } else if (p1Action === 'left' || p1Action === 'right') {
      game.handleInput(e.code, localIdx, p1Action);
      startRepeater(localIdx, p1Action, () => game.handleInput(e.code, localIdx, p1Action));
    } else {
      game.handleInput(e.code, localIdx, p1Action);
    }
  }

  if (game.mode !== MODES.SOLO && !game.isOnline) {
    const p2Action = getAction(KEY_MAP.p2, e.code);
    if (p2Action) {
      e.preventDefault();
      if (p2Action === 'down') {
        setSoftDropHeld(1, true);
      } else if (p2Action === 'hardDrop') {
        game.processLock(game.players[1]);
      } else if (p2Action === 'left' || p2Action === 'right') {
        game.handleInput(e.code, 1, p2Action);
        startRepeater(1, p2Action, () => game.handleInput(e.code, 1, p2Action));
      } else {
        game.handleInput(e.code, 1, p2Action);
      }
    }
  }
}

function handleKeyUp(e) {
  if (!game) return;
  const p1Action = getAction(KEY_MAP.p1, e.code);
  const localIdx = localPlayerIndex();
  if (p1Action === 'left' || p1Action === 'right') {
    stopRepeater(localIdx, p1Action);
  }
  if (p1Action === 'down') {
    setSoftDropHeld(localIdx, false);
  }

  if (game.mode !== MODES.SOLO && !game.isOnline) {
    const p2Action = getAction(KEY_MAP.p2, e.code);
    if (p2Action === 'left' || p2Action === 'right') {
      stopRepeater(1, p2Action);
    }
    if (p2Action === 'down') {
      const p = game.players[1];
      if (p) p.setSoftDrop(false);
    }
  }
}

function stopAllRepeaters() {
  if (!game) return;
  for (const key of repeaters.keys()) {
    const [p, action] = key.split(':');
    stopRepeater(Number(p), action);
  }
  game.players?.forEach((p) => p.setSoftDrop(false));
}

function unlockAudio() {
  sounds.unlock();
}

  document.querySelectorAll('.menu-btn[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      unlockAudio();
      ui.hideGameOver();
      ui.hidePause();
      game.stop();
      const mode = btn.dataset.mode;
      if (mode === 'versus-ai') {
        document.getElementById('ai-difficulty').classList.remove('hidden');
        pendingMode = MODES.VERSUS_AI;
      } else {
        document.getElementById('ai-difficulty').classList.add('hidden');
        game.start(mode === 'solo' ? MODES.SOLO : MODES.VERSUS_HUMAN);
      }
    });
  });

  document.querySelectorAll('.diff-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      aiDifficulty = btn.dataset.diff;
    });
  });

  bindClick('start-ai-btn', () => {
    unlockAudio();
    ui.hideGameOver();
    game.start(MODES.VERSUS_AI, { difficulty: aiDifficulty });
  });

  bindClick('back-btn', () => {
    stopAllRepeaters();
    if (game.isOnline) online.leave();
    game.stop();
    ui.showMenu();
  });

  bindClick('pause-btn', () => game.pause());
  bindClick('resume-btn', () => game.resume());
  bindClick('quit-btn', () => {
    stopAllRepeaters();
    if (game.isOnline) online.leave();
    game.stop();
    ui.showMenu();
  });

  bindClick('restart-btn', () => game.restart());
  bindClick('menu-btn', () => {
    stopAllRepeaters();
    if (game.isOnline) online.leave();
    game.stop();
    ui.showMenu();
  });

  bindClick('online-menu-btn', () => {
    unlockAudio();
    ui.hideGameOver();
    ui.hidePause();
    game.stop();
    document.getElementById('ai-difficulty').classList.add('hidden');
    ui.showScreen(ui.elements.lobbyScreen);
    lobby.show();
    lobby.showCreate();
  });

  bindClick('lobby-back-btn', () => {
    online.leave();
    ui.showMenu();
  });

  bindClick('show-join-btn', () => lobby.showJoin());
  bindClick('join-back-btn', () => lobby.showCreate());

  bindClick('create-room-btn', async () => {
    unlockAudio();
    lobby.clearError();
    try {
      await online.createRoom();
    } catch (e) {
      lobby.setError(e.message || '連線失敗');
    }
  });

  bindClick('join-room-btn', async () => {
    unlockAudio();
    const code = lobby.getJoinCode();
    if (code.length < 4) {
      lobby.setError('請輸入房間代碼');
      return;
    }
    lobby.clearError();
    try {
      await online.joinRoom(code);
    } catch (e) {
      lobby.setError(e.message || '連線失敗');
    }
  });

  bindClick('ready-btn', () => {
    unlockAudio();
    online.ready();
  });

  bindClick('leave-room-btn', () => {
    online.leave();
    ui.showMenu();
  });

  bindClick('copy-code-btn', async () => {
    const code = document.getElementById('room-code')?.textContent;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      lobby.setStatus('已複製房間代碼');
    } catch {
      lobby.setStatus(`房間代碼：${code}`);
    }
  });
}

function setupGlobalListeners() {
  document.addEventListener('keydown', unlockAudio, { once: true });
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupGlobalListeners();
  });
} else {
  initApp();
  setupGlobalListeners();
}

// Prevent arrow keys from scrolling page
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
});
