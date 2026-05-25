import { SIZE, BLACK, COLOR_LABEL } from './constants.js';

export function renderGomokuBoard(container, game) {
  container.innerHTML = '';
  container.className = 'gomoku-board-wrap';

  const boardEl = document.createElement('div');
  boardEl.className = 'gomoku-board';
  boardEl.setAttribute('role', 'grid');
  boardEl.setAttribute('aria-label', '五子棋棋盤');

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'gomoku-cell';
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);
      cell.setAttribute('aria-label', `第 ${r + 1} 行第 ${c + 1} 列`);

      const stone = game.board[r][c];
      if (stone) {
        cell.classList.add('has-stone', stone);
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

export function bindGomokuBoard(container, onCellClick) {
  container.onclick = (e) => {
    const cell = e.target.closest('.gomoku-cell');
    if (!cell || cell.disabled) return;
    onCellClick(Number(cell.dataset.r), Number(cell.dataset.c));
  };
}

export function updateGomokuStatus(el, game, opts = {}) {
  if (opts.waiting) return;
  if (game.winner) {
    el.textContent = game.message;
    el.classList.add('winner');
    return;
  }
  let text = game.message || `輪到${COLOR_LABEL[game.turn]}`;
  if (opts.localColor && !game.winner) {
    const yours = game.turn === opts.localColor;
    text = yours ? `輪到你（${COLOR_LABEL[game.turn]}）` : `等待對手（${COLOR_LABEL[game.turn]}）`;
  }
  el.textContent = text;
  el.classList.remove('winner');
}
