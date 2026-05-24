import { PIECE, RED } from './constants.js';
import { legalMoves, applyXiangqiMove } from './xiangqi.js';
import { allMoves, applyDarkMove } from './dark-chess.js';

const MATERIAL = {
  [PIECE.K]: 10000,
  [PIECE.R]: 90,
  [PIECE.C]: 45,
  [PIECE.N]: 40,
  [PIECE.B]: 20,
  [PIECE.A]: 20,
  [PIECE.P]: 10,
};

const THINK_MS = { easy: 700, normal: 450, hard: 280 };
const MISTAKE = { easy: 0.35, normal: 0.12, hard: 0.03 };

function evaluateBoard(board, aiColor) {
  let score = 0;
  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue;
      const v = MATERIAL[cell.type] || 5;
      score += cell.color === aiColor ? v : -v;
    }
  }
  return score;
}

function pickFromScored(moves, scoreFn, difficulty) {
  if (!moves.length) return null;
  const scored = moves.map((m) => ({ m, s: scoreFn(m) }));
  scored.sort((a, b) => b.s - a.s);
  if (Math.random() < MISTAKE[difficulty]) {
    const idx = Math.floor(Math.random() * Math.min(3, scored.length));
    return scored[idx].m;
  }
  if (difficulty === 'easy') {
    const top = scored.slice(0, Math.min(4, scored.length));
    return top[Math.floor(Math.random() * top.length)].m;
  }
  return scored[0].m;
}

function pickXiangqiMove(game, aiColor, difficulty) {
  const moves = legalMoves(game.board, aiColor);
  if (!moves.length) return null;
  return pickFromScored(moves, (move) => {
    const clone = {
      mode: 'xiangqi',
      board: game.board.map((row) => row.map((c) => (c ? { ...c } : null))),
      turn: aiColor,
      selected: null,
      legal: [],
      winner: null,
      message: '',
    };
    applyXiangqiMove(clone, move);
    let score = evaluateBoard(clone.board, aiColor);
    if (clone.winner === aiColor) score += 5000;
    if (clone.winner && clone.winner !== aiColor) score -= 5000;
    return score;
  }, difficulty);
}

function pickDarkMove(game, aiColor, difficulty) {
  const moves = allMoves(game.board, aiColor);
  if (!moves.length) return null;
  return pickFromScored(moves, (move) => {
    const clone = {
      mode: 'dark',
      board: game.board.map((row) => row.map((c) => (c ? { ...c } : null))),
      turn: aiColor,
      selected: null,
      legal: [],
      winner: null,
      message: '',
      seed: game.seed,
    };
    applyDarkMove(clone, move);
    let score = evaluateBoard(clone.board, aiColor);
    if (move.flip) score += 8;
    if (clone.winner === aiColor) score += 5000;
    return score;
  }, difficulty);
}

export function getAiThinkDelay(difficulty) {
  return THINK_MS[difficulty] || THINK_MS.normal;
}

export function pickAiMove(game, aiColor, difficulty = 'normal') {
  if (game.mode === 'xiangqi') return pickXiangqiMove(game, aiColor, difficulty);
  return pickDarkMove(game, aiColor, difficulty);
}

export function opponentColor(color) {
  return color === RED ? 'black' : 'red';
}
