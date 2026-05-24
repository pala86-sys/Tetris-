import { KEY_MAP } from './constants.js';
import { Game, MODES } from './game.js';
import { sounds } from './sounds.js';
import { LobbyUI } from './lobby.js';
import { OnlineController } from './online.js';
import { setOnlineGameType, onlineGameType } from './online-session.js';
import { Hub } from './hub.js';
import { ChessApp } from './chess/chess-app.js';
import { ChessOnlineController } from './chess/chess-online.js';

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
    document.getElementById('hub-screen')?.classList.add('hidden');
    document.getElementById('menu-screen')?.classList.add('hidden');
    document.getElementById('chess-menu-screen')?.classList.add('hidden');
    document.getElementById('chess-game-screen')?.classList.add('hidden');
    this.elements.lobbyScreen?.classList.add('hidden');
    this.elements.gameScreen.classList.remove('hidden');
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
let hub;
let chessApp;
let chessOnline;

let pendingMode = null;
let aiDifficulty = 'normal';
let pendingChessVariant = null;
let chessAiDifficulty = 'normal';

function activeOnline() {
  return onlineGameType === 'chess' ? chessOnline : online;
}

function resetChessMenuPanels() {
  document.getElementById('chess-variant-panel')?.classList.remove('hidden');
  document.getElementById('chess-mode-panel')?.classList.add('hidden');
  document.getElementById('chess-ai-difficulty')?.classList.add('hidden');
}

function showChessModePanel(variant) {
  pendingChessVariant = variant;
  const title = document.getElementById('chess-variant-title');
  if (title) title.textContent = variant === 'dark' ? '暗棋' : '一般象棋';
  document.getElementById('chess-variant-panel')?.classList.add('hidden');
  document.getElementById('chess-mode-panel')?.classList.remove('hidden');
  document.getElementById('chess-ai-difficulty')?.classList.add('hidden');
}

function startChessLocal(playMode) {
  if (!pendingChessVariant || !chessApp) return;
  chessApp.start({
    variant: pendingChessVariant,
    playMode,
    aiDifficulty: chessAiDifficulty,
  });
  hub?.show('chessGame');
  document.getElementById('chess-ai-difficulty')?.classList.add('hidden');
}

function openTetrisLobby() {
  setOnlineGameType('tetris');
  const label = document.getElementById('lobby-game-label');
  if (label) label.textContent = '俄羅斯方塊 · 建立或加入房間';
}

function showHub() {
  game?.stop();
  chessApp?.stop();
  ui.hideGameOver();
  ui.hidePause();
  hub.show('hub');
}

function showTetrisMenu() {
  game?.stop();
  chessApp?.stop();
  document.getElementById('ai-difficulty')?.classList.add('hidden');
  ui?.hideGameOver();
  ui?.hidePause();
  hub?.show('tetrisMenu');
}

function showChessMenu() {
  game?.stop();
  chessApp?.stop();
  chessOnline?.leave();
  pendingChessVariant = null;
  resetChessMenuPanels();
  hub?.show('chessMenu');
}

function bindClick(id, handler) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[Tetris] Missing element #${id}`);
    return;
  }
  el.addEventListener('click', handler);
}

function initApp() {
  try {
    ui = new UI();
    game = new Game(ui);
    lobby = new LobbyUI(ui.elements.lobbyScreen);
    online = new OnlineController({ game, ui, lobby, onReturnMenu: showTetrisMenu });
    online.init();

    hub = new Hub({
      hub: document.getElementById('hub-screen'),
      tetrisMenu: document.getElementById('menu-screen'),
      chessMenu: document.getElementById('chess-menu-screen'),
      chessGame: document.getElementById('chess-game-screen'),
      game: document.getElementById('game-screen'),
      lobby: document.getElementById('lobby-screen'),
    });

    bindMenuEvents();
    setupHubDelegation();

    try {
      chessApp = new ChessApp({
        board: document.getElementById('chess-board'),
        status: document.getElementById('chess-status'),
        title: document.getElementById('chess-mode-label'),
        hint: document.getElementById('chess-controls-hint'),
      });
      chessOnline = new ChessOnlineController({
        chessApp,
        ui,
        lobby,
        hub,
        onReturnMenu: showChessMenu,
      });
      chessOnline.init();
    } catch (err) {
      console.error('[Game Hall] Chess module failed to load', err);
      chessApp = { stop() {}, start() {}, reset() {} };
      chessOnline = { leave() {}, openLobby() {}, createRoom: async () => {}, joinRoom: async () => {}, ready() {} };
    }

    showHub();
  } catch (err) {
    console.error('[Game Hall] init failed', err);
    setupHubDelegation();
  }
}

function bindMenuEvents() {
  bindClick('hub-tetris-btn', () => {
    unlockAudio();
    showTetrisMenu();
  });

  bindClick('hub-chess-btn', () => {
    unlockAudio();
    showChessMenu();
  });

  bindClick('tetris-hub-back', () => showHub());
  bindClick('chess-hub-back', () => showHub());

  document.querySelectorAll('[data-chess-variant]').forEach((btn) => {
    btn.addEventListener('click', () => {
      unlockAudio();
      showChessModePanel(btn.dataset.chessVariant);
    });
  });

  bindClick('chess-mode-back', () => resetChessMenuPanels());

  document.querySelectorAll('[data-chess-play]').forEach((btn) => {
    btn.addEventListener('click', () => {
      unlockAudio();
      const play = btn.dataset.chessPlay;
      if (play === 'ai') {
        document.getElementById('chess-ai-difficulty')?.classList.remove('hidden');
        return;
      }
      if (play === 'online') {
        setOnlineGameType('chess');
        chessOnline?.openLobby(pendingChessVariant);
        return;
      }
      startChessLocal('local');
    });
  });

  document.querySelectorAll('.chess-diff-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chess-diff-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      chessAiDifficulty = btn.dataset.chessDiff;
    });
  });

  bindClick('chess-start-ai-btn', () => {
    unlockAudio();
    startChessLocal('ai');
  });

  bindClick('chess-back-btn', () => {
    chessOnline?.leave();
    showChessMenu();
  });
  bindClick('chess-reset-btn', () => chessApp?.reset());

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
    showTetrisMenu();
  });

  bindClick('pause-btn', () => game.pause());
  bindClick('resume-btn', () => game.resume());
  bindClick('quit-btn', () => {
    stopAllRepeaters();
    if (game.isOnline) online.leave();
    game.stop();
    showTetrisMenu();
  });

  bindClick('restart-btn', () => game.restart());
  bindClick('menu-btn', () => {
    stopAllRepeaters();
    if (game.isOnline) online.leave();
    game.stop();
    showTetrisMenu();
  });

  bindClick('online-menu-btn', () => {
    unlockAudio();
    ui.hideGameOver();
    ui.hidePause();
    game.stop();
    chessApp?.stop();
    document.getElementById('ai-difficulty').classList.add('hidden');
    document.getElementById('chess-ai-difficulty')?.classList.add('hidden');
    document.getElementById('hub-screen')?.classList.add('hidden');
    document.getElementById('chess-menu-screen')?.classList.add('hidden');
    document.getElementById('chess-game-screen')?.classList.add('hidden');
    openTetrisLobby();
    ui.elements.lobbyScreen.classList.remove('hidden');
    ui.showScreen(ui.elements.lobbyScreen);
    lobby.show();
    lobby.showCreate();
  });

  bindClick('lobby-back-btn', () => {
    const wasChess = onlineGameType === 'chess';
    activeOnline()?.leave();
    if (wasChess) showChessMenu();
    else showTetrisMenu();
  });

  bindClick('show-join-btn', () => lobby.showJoin());
  bindClick('join-back-btn', () => lobby.showCreate());

  bindClick('create-room-btn', async () => {
    unlockAudio();
    lobby.clearError();
    try {
      await activeOnline().createRoom();
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
      await activeOnline().joinRoom(code);
    } catch (e) {
      lobby.setError(e.message || '連線失敗');
    }
  });

  bindClick('ready-btn', () => {
    unlockAudio();
    activeOnline().ready();
  });

  bindClick('leave-room-btn', () => {
    const wasChess = onlineGameType === 'chess';
    activeOnline()?.leave();
    if (wasChess) showChessMenu();
    else showTetrisMenu();
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

function setupHubDelegation() {
  const app = document.getElementById('app');
  if (!app || app.dataset.hubNav === '1') return;
  app.dataset.hubNav = '1';

  app.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.id === 'hub-tetris-btn') {
      e.preventDefault();
      unlockAudio();
      showTetrisMenu();
      return;
    }
    if (btn.id === 'hub-chess-btn') {
      e.preventDefault();
      unlockAudio();
      showChessMenu();
    }
  });
}

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
