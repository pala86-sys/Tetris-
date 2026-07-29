import { CELL_STATE, MINE } from './constants.js';
import { minesRemaining } from './minesweeper.js';

const NUMBER_COLORS = [
  '',
  '#3040ff',
  '#008000',
  '#ff0000',
  '#000080',
  '#800000',
  '#008080',
  '#000000',
  '#808080',
];

export function renderMinesweeperBoard(container, game, { flagMode = false } = {}) {
  container.innerHTML = '';
  container.className = 'minesweeper-board-wrap';

  const boardEl = document.createElement('div');
  boardEl.className = 'minesweeper-board';
  boardEl.style.gridTemplateColumns = `repeat(${game.cols}, minmax(0, 1fr))`;
  boardEl.setAttribute('role', 'grid');
  boardEl.setAttribute('aria-label', '踩地雷棋盤');

  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'minesweeper-cell';
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);
      cell.setAttribute('aria-label', `第 ${r + 1} 行第 ${c + 1} 列`);

      const cellState = game.state[r][c];
      const value = game.board[r][c];

      if (cellState === CELL_STATE.FLAGGED) {
        cell.classList.add('flagged');
        cell.textContent = '🚩';
        cell.disabled = game.status !== 'playing';
      } else if (cellState === CELL_STATE.REVEALED) {
        cell.classList.add('revealed');
        cell.disabled = true;
        if (value === MINE) {
          cell.classList.add('mine');
          cell.textContent = '💣';
        } else if (value > 0) {
          cell.classList.add(`n${value}`);
          cell.textContent = String(value);
          cell.style.color = NUMBER_COLORS[value] || '#000';
          if (game.status === 'playing') {
            cell.disabled = false;
            cell.classList.add('chordable');
          }
        }
      } else {
        cell.classList.add('covered');
        if (flagMode) cell.classList.add('flag-mode');
        cell.disabled = game.status !== 'playing';
      }

      boardEl.appendChild(cell);
    }
  }

  container.appendChild(boardEl);
}

export function bindMinesweeperBoard(container, handlers) {
  container.onclick = (e) => {
    const cell = e.target.closest('.minesweeper-cell');
    if (!cell || cell.disabled) return;
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    if (cell.classList.contains('chordable')) {
      handlers.onChord?.(r, c);
    } else {
      handlers.onReveal?.(r, c);
    }
  };

  container.oncontextmenu = (e) => {
    const cell = e.target.closest('.minesweeper-cell');
    if (!cell) return;
    e.preventDefault();
    if (cell.disabled && !cell.classList.contains('covered')) return;
    handlers.onFlag?.(Number(cell.dataset.r), Number(cell.dataset.c));
  };
}

export function updateMinesweeperStatus(statusEl, timerEl, game) {
  if (!statusEl) return;

  if (game.status === 'won') {
    statusEl.textContent = game.message;
    statusEl.classList.add('winner');
  } else if (game.status === 'lost') {
    statusEl.textContent = game.message;
    statusEl.classList.add('loser');
  } else {
    statusEl.textContent = game.message || '進行中';
    statusEl.classList.remove('winner', 'loser');
  }

  if (timerEl) {
    timerEl.textContent = `💣 ${minesRemaining(game)}`;
  }
}

export function updateFlagModeButton(btn, flagMode) {
  if (!btn) return;
  btn.classList.toggle('active', flagMode);
  btn.textContent = flagMode ? '🚩 插旗模式（開）' : '🚩 插旗模式';
}
