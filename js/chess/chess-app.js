import { createXiangqiGame, selectXiangqi, resetXiangqi } from './xiangqi.js';
import { createDarkChessGame, selectDark, resetDark } from './dark-chess.js';
import { renderChessBoard, bindChessBoard, updateChessStatus } from './chess-ui.js';

export class ChessApp {
  constructor(elements) {
    this.el = elements;
    this.game = null;
    this.mode = null;
    bindChessBoard(this.el.board, (r, c) => this.onCell(r, c));
  }

  start(mode) {
    this.mode = mode;
    this.game = mode === 'xiangqi' ? createXiangqiGame() : createDarkChessGame();
    this.el.title.textContent = mode === 'xiangqi' ? '一般象棋' : '暗棋';
    this.render();
  }

  onCell(r, c) {
    if (!this.game) return;
    if (this.mode === 'xiangqi') {
      this.game = selectXiangqi(this.game, r, c);
    } else {
      this.game = selectDark(this.game, r, c);
    }
    this.render();
  }

  reset() {
    if (!this.game) return;
    if (this.mode === 'xiangqi') resetXiangqi(this.game);
    else resetDark(this.game);
    this.render();
  }

  render() {
    renderChessBoard(this.el.board, this.game);
    updateChessStatus(this.el.status, this.game);
  }

  stop() {
    this.game = null;
    this.mode = null;
  }
}
