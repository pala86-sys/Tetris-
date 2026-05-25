import { sounds, boardChanged } from './sounds.js';

function cellEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * 依棋盤變化判斷音效類型
 * @returns {'place'|'capture'|'flip'|null}
 */
function classifyBoardChange(before, after, mode) {
  const deltas = [];
  for (let r = 0; r < before.length; r++) {
    for (let c = 0; c < before[r].length; c++) {
      if (!cellEqual(before[r][c], after[r][c])) {
        deltas.push({ before: before[r][c], after: after[r][c] });
      }
    }
  }
  if (deltas.length === 0) return null;

  if (mode === 'dark') {
    const flipOnly = deltas.length === 1
      && deltas[0].before
      && deltas[0].after
      && !deltas[0].before.revealed
      && deltas[0].after.revealed;
    if (flipOnly) return 'flip';
  }

  if (mode === 'othello') {
    const changed = deltas.length;
    if (changed > 1) return { type: 'capture', count: changed - 1 };
    return 'place';
  }

  const removedCells = deltas.filter((d) => d.before && !d.after);
  const addedCells = deltas.filter((d) => !d.before && d.after);

  if (removedCells.length === 1 && addedCells.length === 1) {
    const from = removedCells[0].before;
    const to = addedCells[0].after;
    if (from.color === to.color) return 'place';
    return { type: 'capture', count: 1 };
  }

  if (removedCells.length > 0 && addedCells.length > 0) {
    return { type: 'capture', count: removedCells.length };
  }

  if (addedCells.length > 0 || mode === 'gomoku') return 'place';

  return 'place';
}

export function playMoveSoundIfChanged(boardBefore, game) {
  if (!game?.board || !boardBefore) return;
  if (!boardChanged(boardBefore, game.board)) return;

  sounds.unlock();
  const kind = classifyBoardChange(boardBefore, game.board, game.mode);

  if (!kind) return;
  if (kind === 'flip') {
    sounds.playBoardFlip();
    return;
  }
  if (typeof kind === 'object' && kind.type === 'capture') {
    sounds.playBoardCapture(kind.count);
    return;
  }
  sounds.playBoardPlace();
}
