import { RED, BLACK, PIECE_LABEL } from './constants.js';
import { getDarkDisplayLabel } from './dark-chess.js';

export function renderChessBoard(container, game) {
  container.innerHTML = '';
  container.className = `chess-board ${game.mode}`;
  const rows = game.board.length;
  const cols = game.board[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'chess-cell';
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);

      const isRiver = game.mode === 'xiangqi' && r === 4;
      if (isRiver) cell.classList.add('river-row');

      const isPalace = game.mode === 'xiangqi' && (
        (c >= 3 && c <= 5 && r >= 0 && r <= 2) ||
        (c >= 3 && c <= 5 && r >= 7 && r <= 9)
      );
      if (isPalace) cell.classList.add('palace');

      const raw = game.board[r][c];
      const piece = raw && game.mode === 'dark' && game.viewColor
        && !raw.revealed && raw.color !== game.viewColor
        ? { ...raw, revealed: false }
        : raw;
      if (piece) {
        const label = game.mode === 'dark'
          ? getDarkDisplayLabel(piece)
          : PIECE_LABEL[piece.color][piece.type];
        cell.textContent = label;
        cell.classList.add('has-piece', piece.color);
        if (game.mode === 'dark' && !piece.revealed) {
          cell.classList.add('hidden-piece');
        }
      }

      if (game.selected?.r === r && game.selected?.c === c) {
        cell.classList.add('selected');
      }
      if (game.legal.some((m) => m.tr === r && m.tc === c)) {
        cell.classList.add('legal-target');
      }

      container.appendChild(cell);
    }
  }
}

export function bindChessBoard(container, onCellClick) {
  container.onclick = (e) => {
    const cell = e.target.closest('.chess-cell');
    if (!cell) return;
    onCellClick(Number(cell.dataset.r), Number(cell.dataset.c));
  };
}

export function updateChessStatus(el, game, opts = {}) {
  if (opts.waiting) return;
  const turnText = game.turn === RED ? '紅方' : '黑方';
  let text = game.message || `輪到${turnText}`;
  if (opts.localColor && !game.winner) {
    const yours = game.turn === opts.localColor;
    text = yours ? `輪到你（${turnText}）` : `等待對手（${turnText}）`;
  }
  if (game.winner) {
    el.textContent = game.message;
    el.classList.add('winner');
  } else {
    el.textContent = text;
    el.classList.remove('winner');
  }
}
