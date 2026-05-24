import { LEVEL_SPEED, GARBAGE_LINES } from './constants.js';
import { Player } from './player.js';
import { TetrisAI } from './ai.js';
import { drawBoard, drawPreview } from './renderer.js';
import { sounds } from './sounds.js';

export const MODES = {
  SOLO: 'solo',
  VERSUS_HUMAN: 'versus-human',
  VERSUS_AI: 'versus-ai',
  VERSUS_ONLINE: 'versus-online',
};

export class Game {
  constructor(ui) {
    this.ui = ui;
    this.mode = null;
    this.players = [];
    this.ai = null;
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.countdown = 0;
    this.aiDifficulty = 'normal';
    this.versusSpeed = 600;
    this.animationId = null;
    this.keyState = new Set();
    this.repeatTimers = {};
    this.localPlayerIndex = 0;
    this.online = null;
    this.gameStartAt = 0;
  }

  get isOnline() {
    return this.mode === MODES.VERSUS_ONLINE;
  }

  get localPlayer() {
    return this.players[this.localPlayerIndex];
  }

  get remotePlayer() {
    return this.players[this.localPlayerIndex === 0 ? 1 : 0];
  }

  start(mode, options = {}) {
    this.mode = mode;
    this.aiDifficulty = options.difficulty || 'normal';
    this.localPlayerIndex = options.localPlayerIndex ?? 0;
    this.online = options.online || null;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.gameStartAt = options.gameStartAt || 0;

    this.players = [new Player(0)];
    this.players[0].isVersus = false;

    if (mode === MODES.SOLO) {
      this.players[0].isVersus = false;
      this.ai = null;
      this.setupSoloUI();
    } else {
      this.players.push(new Player(1));
      this.players.forEach((p, i) => {
        p.isVersus = true;
        p.setSpeed(this.versusSpeed);
        if (mode === MODES.VERSUS_ONLINE) {
          p.isLocal = i === this.localPlayerIndex;
        }
      });
      if (mode === MODES.VERSUS_AI) {
        this.ai = new TetrisAI(this.aiDifficulty);
        this.ai.reset();
      } else {
        this.ai = null;
      }
      this.setupVersusUI();
      if (this.gameStartAt > Date.now()) {
        this.countdown = Math.ceil((this.gameStartAt - Date.now()) / 1000);
      } else {
        this.countdown = 3;
      }
      this.countdownTimer = 0;
      this.ui.elements.versusTimer.textContent = String(this.countdown);
      this.ui.elements.versusTimer.classList.remove('hidden');
    }

    this.bindCanvases();
    this.ui.showGameScreen(mode);
    this.loop();
  }

  setupSoloUI() {
    this.ui.elements.soloLayout.classList.remove('hidden');
    this.ui.elements.versusLayout.classList.add('hidden');
  }

  setupVersusUI() {
    this.ui.elements.soloLayout.classList.add('hidden');
    this.ui.elements.versusLayout.classList.remove('hidden');
    const p2Label = document.getElementById('p2-label');
    if (p2Label) {
      if (this.mode === MODES.VERSUS_ONLINE) {
        p2Label.textContent = '線上對手';
      } else {
        p2Label.textContent = this.mode === MODES.VERSUS_AI ? 'AI 對手' : '玩家 2';
      }
    }
    const headers = document.querySelectorAll('.player-header');
    if (headers[0]) {
      headers[0].textContent = this.isOnline && this.localPlayerIndex === 0 ? '你' : '玩家 1';
    }
    if (headers[1]) {
      headers[1].textContent = this.isOnline && this.localPlayerIndex === 1 ? '你' : (
        this.mode === MODES.VERSUS_ONLINE ? '線上對手' : '玩家 2'
      );
    }
    this.ui.elements.versusTimer.classList.remove('hidden');
  }

  bindCanvases() {
    if (this.mode === MODES.SOLO) {
      this.canvases = [{
        board: this.ui.elements.soloBoard,
        next: this.ui.elements.soloNext,
        hold: this.ui.elements.soloHold,
        cellSize: 30,
      }];
    } else {
      this.canvases = [0, 1].map((i) => ({
        board: document.querySelector(`.board-canvas[data-player="${i}"]`),
        next: document.querySelector(`.next-canvas[data-player="${i}"]`),
        hold: document.querySelector(`.hold-canvas[data-player="${i}"]`),
        cellSize: 24,
      }));
    }
  }

  loop(now = performance.now()) {
    if (!this.running) return;

    const dt = Math.min(now - this.lastTime, 50);
    this.lastTime = now;

    if (!this.paused) {
      if (this.countdown > 0) {
        this.updateCountdown(dt);
      } else {
        this.update(dt);
      }
      this.render();
      this.checkGameOver();
    }

    this.animationId = requestAnimationFrame((t) => this.loop(t));
  }

  updateCountdown(dt) {
    this.countdownTimer = (this.countdownTimer || 0) + dt;
    if (this.countdownTimer >= 1000) {
      this.countdownTimer = 0;
      this.countdown--;
      this.ui.elements.versusTimer.textContent = this.countdown > 0 ? this.countdown : 'GO!';
      if (this.countdown <= 0) {
        setTimeout(() => {
          this.ui.elements.versusTimer.classList.add('hidden');
        }, 500);
      }
    }
  }

  update(dt) {
    if (this.mode === MODES.SOLO) {
      const result = this.players[0].update(dt);
      if (result) this.onLockResult(this.players[0], result);
    } else if (this.isOnline) {
      const result = this.localPlayer.update(dt);
      if (result) this.onLockResult(this.localPlayer, result);
    } else {
      this.players.forEach((p) => {
        const result = p.update(dt);
        if (result) this.onLockResult(p, result);
      });
      if (this.ai) {
        const aiResult = this.ai.update(this.players[1], dt);
        if (aiResult) this.onLockResult(this.players[1], aiResult);
      }
    }
  }

  handleInput(code, playerIndex, action) {
    if (this.paused || this.countdown > 0) return;
    if (this.isOnline && playerIndex !== this.localPlayerIndex) return;

    const player = this.players[playerIndex];
    if (!player || !player.alive || !player.isLocal) return;
    if (playerIndex === 1 && this.ai) return;

    switch (action) {
      case 'left': player.move(-1, 0); break;
      case 'right': player.move(1, 0); break;
      case 'down': player.softDrop(); break;
      case 'rotate': player.rotate(1); break;
      case 'rotateCCW': player.rotate(-1); break;
      case 'hardDrop': this.processLock(player); break;
      case 'hold': player.hold(); break;
    }

    if (this.isOnline) {
      this.online.sendAction(action);
      if (action !== 'down' && action !== 'hardDrop') {
        this.online.sendState(player);
      }
    }
  }

  setSoftDropHeld(playerIndex, held) {
    const player = this.players[playerIndex];
    if (!player?.isLocal) return;
    player.setSoftDrop(held);
    if (this.isOnline) {
      this.online.sendAction(held ? 'softDropStart' : 'softDropEnd');
    }
  }

  processLock(player) {
    const result = player.hardDrop();
    if (result) this.onLockResult(player, result);
  }

  onLock(player) {
    const result = player.lock();
    if (result) this.onLockResult(player, result);
  }

  onLockResult(player, result) {
    if (!result) return;
    if (player.isLocal && result.cleared > 0) {
      sounds.playLineClear(result.cleared);
    }

    if (this.isOnline) {
      if (player.isLocal) {
        this.online.sendLock(player, result);
      }
      return;
    }

    if (this.mode !== MODES.SOLO) {
      const opponent = this.players[player.id === 0 ? 1 : 0];
      if (result.garbageSent > 0 && opponent.alive) {
        opponent.receiveGarbage(result.garbageSent);
      }
    }
  }

  applyRemoteAction(action) {
    if (this.countdown > 0) return;
    const remote = this.remotePlayer;
    if (action === 'softDrop') {
      const r = remote.applyRemoteInput(action);
      if (r && r !== true) this.applyRemoteLock(r);
      return;
    }
    remote.applyRemoteInput(action);
  }

  applyRemoteLock(payload) {
    const remote = this.remotePlayer;
    if (payload.state) remote.applyNetworkState(payload.state);
    if (payload.cleared > 0) sounds.playLineClear(payload.cleared);

    const local = this.localPlayer;
    if (payload.garbageSent > 0 && local.alive) {
      local.receiveGarbage(payload.garbageSent);
    }
  }

  applyRemoteState(state) {
    this.remotePlayer.applyNetworkState(state);
  }

  handleOpponentGameOver(fromIndex) {
    if (!this.running || this.countdown > 0) return;
    const youWin = fromIndex !== this.localPlayerIndex;
    const msg = youWin ? '對手敗北，你獲勝！' : '你敗北了！';
    this.endGame('對戰結束', msg);
  }

  checkGameOver() {
    const alive = this.players.filter((p) => p.alive);
    if (this.mode === MODES.SOLO) {
      if (!this.players[0].alive) {
        this.endGame('遊戲結束', `最終分數：${this.players[0].score}`);
      }
    } else if (alive.length <= 1 && this.countdown <= 0) {
      if (this.isOnline) {
        if (!this.localPlayer.alive) {
          this.online?.sendGameOver('dead');
          this.endGame('對戰結束', '你敗北了！');
        } else if (!this.remotePlayer.alive) {
          this.endGame('對戰結束', '對手敗北，你獲勝！');
        }
        return;
      }
      const winner = alive[0];
      let msg;
      if (winner) {
        if (this.mode === MODES.VERSUS_AI) {
          msg = winner.id === 0 ? '你獲勝！' : 'AI 獲勝！';
        } else {
          const name = winner.id === 0 ? '玩家 1' : '玩家 2';
          msg = `${name} 獲勝！`;
        }
      } else {
        msg = '平手！';
      }
      this.endGame('對戰結束', msg, winner);
    }
  }

  endGame(title, msg, winner = null) {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    if (this.isOnline && !this.localPlayer.alive) {
      this.online?.sendGameOver('dead');
    }

    let stats = '';
    if (this.mode === MODES.SOLO) {
      const p = this.players[0];
      stats = `分數：${p.score}<br>等級：${p.level}<br>消除行：${p.lines}`;
    } else {
      stats = this.buildVersusStats(winner);
    }

    this.ui.showGameOver(title, msg, stats);
  }

  buildVersusStats(winner) {
    const p0 = this.players[0];
    const p1 = this.players[1];
    const w = winner ?? (p0.alive ? p0 : (p1.alive ? p1 : null));
    const tag = (p) => {
      if (!w) return '';
      return p.id === w.id ? '（獲勝）' : '（敗北）';
    };

    if (this.mode === MODES.VERSUS_AI) {
      return (
        `你${tag(p0)}：${p0.score} 分 · ${p0.lines} 行<br>` +
        `AI${tag(p1)}：${p1.score} 分 · ${p1.lines} 行` +
        `<p class="stats-hint">對戰以「對手堆到頂」定勝負，分數高不代表獲勝。</p>`
      );
    }

    if (this.isOnline) {
      const you = this.localPlayer;
      const opp = this.remotePlayer;
      const youLabel = you.id === 0 ? '你' : '你';
      const oppLabel = '線上對手';
      return (
        `${youLabel}${tag(you)}：${you.score} 分 · ${you.lines} 行<br>` +
        `${oppLabel}${tag(opp)}：${opp.score} 分 · ${opp.lines} 行` +
        `<p class="stats-hint">對戰以「對手堆到頂」定勝負，分數高不代表獲勝。</p>`
      );
    }

    return (
      `玩家 1${tag(p0)}：${p0.score} 分 · ${p0.lines} 行<br>` +
      `玩家 2${tag(p1)}：${p1.score} 分 · ${p1.lines} 行` +
      `<p class="stats-hint">對戰以「對手堆到頂」定勝負，分數高不代表獲勝。</p>`
    );
  }

  render() {
    if (this.mode === MODES.SOLO) {
      const p = this.players[0];
      const ctx = this.canvases[0].board.getContext('2d');
      drawBoard(ctx, p.board, p.active, p.ghostY, this.canvases[0].cellSize);

      drawPreview(this.ui.elements.soloNext.getContext('2d'), p.queue[0], 20);
      drawPreview(this.ui.elements.soloHold.getContext('2d'), p.hold, 20);

      this.ui.elements.soloScore.textContent = p.score;
      this.ui.elements.soloLevel.textContent = p.level;
      this.ui.elements.soloLines.textContent = p.lines;
    } else {
      this.players.forEach((p, i) => {
        const c = this.canvases[i];
        const ctx = c.board.getContext('2d');
        drawBoard(ctx, p.board, p.active, p.ghostY, c.cellSize);

        drawPreview(c.next.getContext('2d'), p.queue[0], 14);
        drawPreview(c.hold.getContext('2d'), p.hold, 14);
      });

      document.getElementById('p1-score').textContent = this.players[0].score;
      document.getElementById('p1-lines').textContent = this.players[0].lines;
      document.getElementById('p2-score').textContent = this.players[1].score;
      document.getElementById('p2-lines').textContent = this.players[1].lines;
    }
  }

  pause() {
    if (this.isOnline) return;
    this.paused = true;
    this.players.forEach((p) => p.setSoftDrop(false));
    this.ui.showPause();
  }

  resume() {
    this.paused = false;
    this.lastTime = performance.now();
    this.ui.hidePause();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    this.online = null;
  }

  restart() {
    this.ui.hideGameOver();
    if (this.isOnline) {
      this.online?.onRematch?.();
      return;
    }
    this.start(this.mode, { difficulty: this.aiDifficulty });
  }
}
