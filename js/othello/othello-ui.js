import { BLACK, WHITE, COLOR_LABEL } from './constants.js';
import { countDiscs } from './othello.js';

export function renderOthelloBoard(container, game) {
  container.innerHTML = '';
  container.className = 'othello-board-wrap';

  const boardEl = document.createElement('div');
  boardEl.className = 'othello-board';
  boardEl.setAttribute('role', 'grid');
  boardEl.setAttribute('aria-label', '黑白棋棋盤');

  const legalSet = new Set(game.legalMoves.map((m) => `${m.r},${m.c}`));

  for (let r = 0; r < game.board.length; r++) {
    for (let c = 0; c < game.board[0].length; c++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'othello-cell';
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);

      const stone = game.board[r][c];
      if (stone) {
        cell.classList.add('has-stone', stone);
        cell.disabled = true;
      } else if (legalSet.has(`${r},${c}`) && !game.winner) {
        cell.classList.add('legal-move');
        cell.setAttribute('aria-label', '可下');
      } else {
        cell.disabled = true;
      }

      if (game.lastMove?.r === r && game.lastMove?.c === c) {
        cell.classList.add('last-move');
      }

      boardEl.appendChild(cell);
    }
  }

  container.appendChild(boardEl);
}

export function bindOthelloBoard(container, onCellClick) {
  container.onclick = (e) => {
    const cell = e.target.closest('.othello-cell');
    if (!cell || cell.disabled) return;
    onCellClick(Number(cell.dataset.r), Number(cell.dataset.c));
  };
}

export function updateOthelloStatus(el, game, opts = {}) {
  if (opts.waiting) return;

  const { black, white } = countDiscs(game.board);
  const scoreText = `黑 ${black} · 白 ${white}`;

  if (game.winner) {
    el.textContent = `${game.message}（${scoreText}）`;
    el.classList.add('winner');
    return;
  }

  let text = game.message || `輪到${COLOR_LABEL[game.turn]}`;
  if (opts.localColor && !game.winner) {
    const yours = game.turn === opts.localColor;
    text = yours ? `輪到你（${COLOR_LABEL[game.turn]}）` : `等待對手（${COLOR_LABEL[game.turn]}）`;
  }
  el.textContent = `${text} · ${scoreText}`;
  el.classList.remove('winner');
}
