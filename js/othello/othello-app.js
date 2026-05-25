import { BLACK } from './constants.js';
import { createOthelloGame, placeDisc, resetOthello, opponent } from './othello.js';
import { renderOthelloBoard, bindOthelloBoard, updateOthelloStatus } from './othello-ui.js';
import { serializeOthelloState, deserializeOthelloState } from './othello-serialize.js';
import { pickAiMove, getAiThinkDelay } from './othello-ai.js';

export class OthelloApp {
  constructor(elements) {
    this.el = elements;
    this.game = null;
    this.playMode = null;
    this.humanColor = BLACK;
    this.localColor = BLACK;
    this.aiDifficulty = 'normal';
    this.aiTimer = null;
    this.onlineApi = null;
    this.waitingOnlineInit = false;
    bindOthelloBoard(this.el.board, (r, c) => this.onCell(r, c));
  }

  get isOnline() {
    return this.playMode === 'online';
  }

  get isAi() {
    return this.playMode === 'ai';
  }

  canInteract() {
    if (!this.game || this.game.winner || this.waitingOnlineInit) return false;
    if (this.playMode === 'local') return this.game.legalMoves.length > 0;
    if (this.isAi) return this.game.turn === this.humanColor && this.game.legalMoves.length > 0;
    if (this.isOnline) return this.game.turn === this.localColor && this.game.legalMoves.length > 0;
    return false;
  }

  start(options) {
    this.stopTimers();
    this.playMode = options.playMode;
    this.humanColor = BLACK;
    this.localColor = options.localColor ?? BLACK;
    this.aiDifficulty = options.aiDifficulty ?? 'normal';
    this.onlineApi = options.online ?? null;
    this.waitingOnlineInit = false;
    this.game = createOthelloGame();
    this.updateTitle();
    this.updateHint();
    this.render();
    if (this.isAi && this.game.turn !== this.humanColor) {
      this.scheduleAi();
    }
  }

  waitForOnlineInit(localColor) {
    this.stopTimers();
    this.playMode = 'online';
    this.localColor = localColor;
    this.game = null;
    this.waitingOnlineInit = true;
    this.el.title.textContent = '黑白棋 · 線上對戰';
    this.el.status.textContent = '等待房主開始…';
    this.el.status.classList.remove('winner');
    this.el.board.innerHTML = '';
    if (this.el.hint) this.el.hint.textContent = '房主按下準備後即將開始';
  }

  updateTitle() {
    const modes = { local: '雙人同機', ai: '對戰 AI', online: '線上對戰' };
    const side = this.isOnline
      ? (this.localColor === BLACK ? '你是黑方' : '你是白方')
      : (this.isAi ? '你是黑方' : '');
    this.el.title.textContent = `黑白棋 · ${modes[this.playMode] || ''}${side ? ` · ${side}` : ''}`;
  }

  updateHint() {
    if (!this.el.hint) return;
    if (this.isAi) {
      this.el.hint.textContent = '你是黑方（先手）· 點擊綠點處落子並翻轉對手棋子';
    } else if (this.isOnline) {
      this.el.hint.textContent = `${this.localColor === BLACK ? '你是黑方（先手）' : '你是白方'} · 輪到你時點綠點落子`;
    } else {
      this.el.hint.textContent = '雙人同機 · 黑方先行 · 點擊綠點處落子';
    }
  }

  onCell(r, c) {
    if (!this.canInteract()) return;
    const turnBefore = this.game.turn;
    this.game = placeDisc(this.game, r, c);
    this.afterPly(turnBefore);
  }

  afterPly(turnBefore) {
    this.render();
    if (this.isOnline && (this.game.turn !== turnBefore || this.game.winner) && this.onlineApi?.sendState) {
      this.onlineApi.sendState(serializeOthelloState(this.game));
    }
    if (this.game.winner) {
      if (this.isOnline && this.onlineApi?.sendGameOver) {
        const won = this.game.winner !== 'draw' && this.game.winner === this.localColor;
        this.onlineApi.sendGameOver(won ? 'win' : 'draw');
      }
      return;
    }
    if (this.isAi && this.game.turn !== this.humanColor) {
      this.scheduleAi();
    }
  }

  applyRemoteState(state) {
    if (!state) return;
    this.game = deserializeOthelloState(state);
    this.render();
    if (this.game.winner) {
      this.el.status.classList.add('winner');
    }
  }

  scheduleAi() {
    this.stopTimers();
    const aiColor = opponent(this.humanColor);
    const delay = getAiThinkDelay(this.aiDifficulty);
    this.aiTimer = setTimeout(() => {
      this.aiTimer = null;
      if (!this.game || this.game.winner || this.game.turn !== aiColor) return;
      const move = pickAiMove(this.game, aiColor, this.aiDifficulty);
      if (!move) return;
      const turnBefore = this.game.turn;
      this.game = placeDisc(this.game, move.r, move.c);
      this.afterPly(turnBefore);
    }, delay);
  }

  reset() {
    if (!this.game) return;
    resetOthello(this.game);
    this.render();
    if (this.isAi && this.game.turn !== this.humanColor) {
      this.scheduleAi();
    }
    if (this.isOnline && this.onlineApi?.sendState) {
      this.onlineApi.sendState(serializeOthelloState(this.game));
    }
  }

  render() {
    if (!this.game) return;
    renderOthelloBoard(this.el.board, this.game);
    updateOthelloStatus(this.el.status, this.game, {
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
