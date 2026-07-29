import { DIFFICULTIES } from './constants.js';
import {
  createMinesweeperGame,
  reveal,
  toggleFlag,
  chord,
  resetMinesweeper,
} from './minesweeper.js';
import {
  renderMinesweeperBoard,
  bindMinesweeperBoard,
  updateMinesweeperStatus,
  updateFlagModeButton,
} from './minesweeper-ui.js';

export class MinesweeperApp {
  constructor(elements) {
    this.el = elements;
    this.game = null;
    this.difficulty = 'easy';
    this.flagMode = false;
    this.timerId = null;
    this.elapsed = 0;

    bindMinesweeperBoard(this.el.board, {
      onReveal: (r, c) => this.onReveal(r, c),
      onFlag: (r, c) => this.onFlag(r, c),
      onChord: (r, c) => this.onChord(r, c),
    });

    this.el.flagModeBtn?.addEventListener('click', () => {
      this.flagMode = !this.flagMode;
      updateFlagModeButton(this.el.flagModeBtn, this.flagMode);
      this.render();
    });
  }

  start(difficulty) {
    this.stopTimer();
    this.difficulty = difficulty || 'easy';
    this.flagMode = false;
    this.elapsed = 0;
    updateFlagModeButton(this.el.flagModeBtn, this.flagMode);

    const cfg = DIFFICULTIES[this.difficulty] || DIFFICULTIES.easy;
    this.game = createMinesweeperGame(cfg.rows, cfg.cols, cfg.mines);

    if (this.el.title) {
      this.el.title.textContent = `踩地雷 · ${cfg.label}（${cfg.rows}×${cfg.cols} · ${cfg.mines} 雷）`;
    }
    this.updateHint();
    this.render();
  }

  updateHint() {
    if (!this.el.hint) return;
    this.el.hint.textContent =
      '點擊揭開 · 插旗模式或右鍵插旗 · 點數字可快速揭開（旗子數需正確）';
  }

  onReveal(r, c) {
    if (!this.game || this.game.status !== 'playing') return;
    if (this.flagMode) {
      this.game = toggleFlag(this.game, r, c);
    } else {
      const wasHidden = !this.game.minesPlaced;
      this.game = reveal(this.game, r, c);
      if (wasHidden && this.game.minesPlaced && this.game.status === 'playing') {
        this.startTimer();
      }
    }
    this.afterAction();
  }

  onFlag(r, c) {
    if (!this.game || this.game.status !== 'playing') return;
    this.game = toggleFlag(this.game, r, c);
    this.afterAction();
  }

  onChord(r, c) {
    if (!this.game || this.game.status !== 'playing') return;
    this.game = chord(this.game, r, c);
    this.afterAction();
  }

  afterAction() {
    if (this.game.status !== 'playing') {
      this.stopTimer();
    }
    this.render();
  }

  reset() {
    if (!this.game) return;
    this.stopTimer();
    this.elapsed = 0;
    this.flagMode = false;
    updateFlagModeButton(this.el.flagModeBtn, this.flagMode);
    resetMinesweeper(this.game);
    this.render();
  }

  render() {
    if (!this.game) return;
    renderMinesweeperBoard(this.el.board, this.game, { flagMode: this.flagMode });
    updateMinesweeperStatus(this.el.status, this.el.minesLeft, this.game);
    if (this.el.timer) {
      this.el.timer.textContent = `⏱ ${this.elapsed}s`;
    }
  }

  startTimer() {
    this.stopTimer();
    this.timerId = setInterval(() => {
      this.elapsed++;
      if (this.el.timer) {
        this.el.timer.textContent = `⏱ ${this.elapsed}s`;
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  stop() {
    this.stopTimer();
    this.game = null;
    this.flagMode = false;
  }
}
