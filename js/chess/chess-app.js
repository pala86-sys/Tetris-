import { RED } from './constants.js';
import { createXiangqiGame, selectXiangqi, resetXiangqi, applyXiangqiMove } from './xiangqi.js';
import { createDarkChessGame, selectDark, resetDark, applyDarkMove } from './dark-chess.js';
import { renderChessBoard, bindChessBoard, updateChessStatus } from './chess-ui.js';
import { serializeChessState, deserializeChessState } from './chess-serialize.js';
import { pickAiMove, getAiThinkDelay, opponentColor } from './chess-ai.js';

export class ChessApp {
  constructor(elements) {
    this.el = elements;
    this.game = null;
    this.variant = null;
    this.playMode = null;
    this.humanColor = RED;
    this.localColor = RED;
    this.aiDifficulty = 'normal';
    this.aiTimer = null;
    this.onlineApi = null;
    this.waitingOnlineInit = false;
    bindChessBoard(this.el.board, (r, c) => this.onCell(r, c));
  }

  get isOnline() {
    return this.playMode === 'online';
  }

  get isAi() {
    return this.playMode === 'ai';
  }

  get isLocal() {
    return this.playMode === 'local';
  }

  canInteract() {
    if (!this.game || this.game.winner || this.waitingOnlineInit) return false;
    if (this.isLocal) return true;
    if (this.isAi) return this.game.turn === this.humanColor;
    if (this.isOnline) return this.game.turn === this.localColor;
    return false;
  }

  start(options) {
    this.stopTimers();
    this.variant = options.variant;
    this.playMode = options.playMode;
    this.humanColor = RED;
    this.localColor = options.localColor ?? RED;
    this.aiDifficulty = options.aiDifficulty ?? 'normal';
    this.onlineApi = options.online ?? null;
    this.waitingOnlineInit = false;

    const seed = options.seed ?? null;
    this.game = this.variant === 'xiangqi'
      ? createXiangqiGame()
      : createDarkChessGame(seed);

    this.setViewColor();
    this.updateTitle();
    this.updateHint();
    this.render();

    if (this.isAi && this.game.turn !== this.humanColor) {
      this.scheduleAi();
    }
  }

  beginOnlineAsGuest(init) {
    this.waitingOnlineInit = false;
    this.variant = init.variant;
    this.playMode = 'online';
    this.localColor = init.localColor ?? BLACK;
    this.game = init.variant === 'xiangqi'
      ? createXiangqiGame()
      : createDarkChessGame(init.seed);
    this.setViewColor();
    this.updateTitle();
    this.updateHint();
    this.render();
  }

  waitForOnlineInit(localColor) {
    this.stopTimers();
    this.playMode = 'online';
    this.localColor = localColor;
    this.game = null;
    this.waitingOnlineInit = true;
    this.el.title.textContent = '連線對戰';
    this.el.status.textContent = '等待房主開始…';
    this.el.status.classList.remove('winner');
    this.el.board.innerHTML = '';
    if (this.el.hint) this.el.hint.textContent = '房主按下準備後即將開始';
  }

  setViewColor() {
    if (!this.game) return;
    if (this.isOnline || this.isAi) {
      this.game.viewColor = this.isOnline ? this.localColor : this.humanColor;
    } else {
      this.game.viewColor = null;
    }
  }

  updateTitle() {
    const names = { xiangqi: '一般象棋', dark: '暗棋' };
    const modeNames = { local: '雙人同機', ai: '對戰 AI', online: '線上對戰' };
    const side = this.isOnline
      ? (this.localColor === RED ? '你是紅方' : '你是黑方')
      : (this.isAi ? '你是紅方' : '');
    this.el.title.textContent = `${names[this.variant] || ''} · ${modeNames[this.playMode] || ''}${side ? ` · ${side}` : ''}`;
  }

  updateHint() {
    if (!this.el.hint) return;
    const darkRules = '可翻任意 ? 棋 · 移動到 ? 格會翻開比大小';
    if (this.variant === 'dark') {
      if (this.isAi) {
        this.el.hint.textContent = `你是紅方 · ${darkRules}`;
      } else if (this.isOnline) {
        this.el.hint.textContent = `${this.localColor === RED ? '你是紅方' : '你是黑方'} · ${darkRules}`;
      } else {
        this.el.hint.textContent = `雙人同機 · ${darkRules}`;
      }
      return;
    }
    if (this.isAi) {
      this.el.hint.textContent = '你是紅方 · 點選棋子再點目標格';
    } else if (this.isOnline) {
      this.el.hint.textContent = this.localColor === RED
        ? '你是紅方（房主）· 輪到你時才能操作'
        : '你是黑方 · 輪到你時才能操作';
    } else {
      this.el.hint.textContent = '雙人同機 · 紅方先行 · 點選棋子再點目標格';
    }
  }

  onCell(r, c) {
    if (!this.canInteract()) return;

    const turnBefore = this.game.turn;
    if (this.variant === 'xiangqi') {
      this.game = selectXiangqi(this.game, r, c);
    } else {
      this.game = selectDark(this.game, r, c);
    }
    this.afterPly(turnBefore);
  }

  afterPly(turnBefore) {
    this.render();

    if (this.isOnline && this.game.turn !== turnBefore && this.onlineApi?.sendState) {
      this.onlineApi.sendState(serializeChessState(this.game));
    }

    if (this.game.winner) {
      if (this.isOnline && this.onlineApi?.sendGameOver) {
        const won = this.game.winner === this.localColor;
        this.onlineApi.sendGameOver(won ? 'win' : 'lose');
      }
      return;
    }

    if (this.isAi && this.game.turn !== this.humanColor) {
      this.scheduleAi();
    }
  }

  applyRemoteState(state) {
    if (!state) return;
    this.game = deserializeChessState(state);
    this.variant = this.game.mode;
    this.setViewColor();
    this.render();
    if (this.game.winner) {
      this.el.status.textContent = this.game.message;
      this.el.status.classList.add('winner');
    }
  }

  applyRemoteClick(r, c) {
    if (!this.game || this.game.winner) return;
    const turnBefore = this.game.turn;
    if (this.variant === 'xiangqi') {
      this.game = selectXiangqi(this.game, r, c);
    } else {
      this.game = selectDark(this.game, r, c);
    }
    if (this.game.turn !== turnBefore || this.game.winner) {
      this.setViewColor();
      this.render();
    }
  }

  scheduleAi() {
    this.stopTimers();
    const aiColor = opponentColor(this.humanColor);
    const delay = getAiThinkDelay(this.aiDifficulty);
    this.aiTimer = setTimeout(() => {
      this.aiTimer = null;
      if (!this.game || this.game.winner || this.game.turn !== aiColor) return;

      const move = pickAiMove(this.game, aiColor, this.aiDifficulty);
      if (!move) return;

      const turnBefore = this.game.turn;
      if (this.variant === 'xiangqi') {
        this.game = applyXiangqiMove(this.game, move);
      } else {
        this.game = applyDarkMove(this.game, move);
      }
      this.afterPly(turnBefore);
    }, delay);
  }

  reset() {
    if (!this.game) return;
    if (this.variant === 'xiangqi') resetXiangqi(this.game);
    else resetDark(this.game);
    this.setViewColor();
    this.render();
    if (this.isAi && this.game.turn !== this.humanColor) {
      this.scheduleAi();
    }
    if (this.isOnline && this.onlineApi?.sendState) {
      this.onlineApi.sendState(serializeChessState(this.game));
    }
  }

  render() {
    if (!this.game) return;
    renderChessBoard(this.el.board, this.game);
    updateChessStatus(this.el.status, this.game, {
      localColor: this.isOnline ? this.localColor : null,
      waiting: this.waitingOnlineInit,
    });
  }

  stopTimers() {
    if (this.aiTimer) {
      clearTimeout(this.aiTimer);
      this.aiTimer = null;
    }
  }

  stop() {
    this.stopTimers();
    this.game = null;
    this.variant = null;
    this.playMode = null;
    this.onlineApi = null;
    this.waitingOnlineInit = false;
  }

  handleOpponentLeft(message) {
    this.stopTimers();
    if (this.el.status) {
      this.el.status.textContent = message || '對手已離開';
      this.el.status.classList.add('winner');
    }
  }
}
