import { SIZE, BLACK } from './constants.js';
import { wouldWin, opponent } from './gomoku.js';

const CENTER = Math.floor(SIZE / 2);

function lineScore(count, openEnds) {
  if (count >= 5) return 100000;
  if (count === 4 && openEnds === 2) return 12000;
  if (count === 4 && openEnds === 1) return 2500;
  if (count === 3 && openEnds === 2) return 800;
  if (count === 3 && openEnds === 1) return 120;
  if (count === 2 && openEnds === 2) return 60;
  if (count === 2 && openEnds === 1) return 10;
  return count;
}

function analyzeLine(board, r, c, dr, dc, color) {
  let count = 1;
  let openEnds = 0;

  let nr = r + dr;
  let nc = c + dc;
  while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
    if (board[nr][nc] === color) count++;
    else {
      if (board[nr][nc] === null) openEnds++;
      break;
    }
    nr += dr;
    nc += dc;
  }

  nr = r - dr;
  nc = c - dc;
  while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
    if (board[nr][nc] === color) count++;
    else {
      if (board[nr][nc] === null) openEnds++;
      break;
    }
    nr -= dr;
    nc -= dc;
  }

  return lineScore(count, openEnds);
}

function cellScore(board, r, c, color) {
  if (board[r][c]) return 0;
  let score = 0;
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    score += analyzeLine(board, r, c, dr, dc, color);
    score += analyzeLine(board, r, c, dr, dc, opponent(color)) * 0.92;
  }
  const dist = Math.abs(r - CENTER) + Math.abs(c - CENTER);
  score += Math.max(0, 14 - dist);
  return score;
}

function hasStone(board) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c]) return true;
    }
  }
  return false;
}

export function getCandidateMoves(board) {
  const moves = [];
  const seen = new Set();
  const radius = 2;

  if (!hasStone(board)) {
    return [{ r: CENTER, c: CENTER }];
  }

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!board[r][c]) continue;
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          const key = `${nr},${nc}`;
          if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || board[nr][nc] || seen.has(key)) continue;
          seen.add(key);
          moves.push({ r: nr, c: nc });
        }
      }
    }
  }

  return moves.length ? moves : [{ r: CENTER, c: CENTER }];
}

function findImmediateWin(board, color) {
  for (const { r, c } of getCandidateMoves(board)) {
    if (wouldWin(board, r, c, color)) return { r, c };
  }
  return null;
}

export function getAiThinkDelay(difficulty) {
  return { easy: 500, normal: 380, hard: 280 }[difficulty] || 380;
}

export function pickAiMove(game, aiColor, difficulty = 'normal') {
  const { board } = game;
  const human = opponent(aiColor);

  const win = findImmediateWin(board, aiColor);
  if (win) return win;

  const block = findImmediateWin(board, human);
  if (block) return block;

  const candidates = getCandidateMoves(board);
  const scored = candidates.map(({ r, c }) => ({
    r,
    c,
    s: cellScore(board, r, c, aiColor),
  }));
  scored.sort((a, b) => b.s - a.s);

  if (!scored.length) return { r: CENTER, c: CENTER };

  if (difficulty === 'easy') {
    const top = scored.slice(0, Math.min(6, scored.length));
    return top[Math.floor(Math.random() * top.length)];
  }

  if (difficulty === 'hard' && scored.length >= 2) {
    let best = scored[0];
    let bestMin = -Infinity;
    for (const cand of scored.slice(0, 10)) {
      const next = board.map((row) => [...row]);
      next[cand.r][cand.c] = aiColor;
      const reply = findImmediateWin(next, human);
      let minReply = reply ? -50000 : cellScore(next, cand.r, cand.c, human);
      if (!reply) {
        for (const { r, c } of getCandidateMoves(next).slice(0, 8)) {
          if (wouldWin(next, r, c, human)) {
            minReply = -80000;
            break;
          }
        }
      }
      const total = cand.s + minReply * 0.15;
      if (total > bestMin) {
        bestMin = total;
        best = cand;
      }
    }
    return { r: best.r, c: best.c };
  }

  if (Math.random() < (difficulty === 'normal' ? 0.08 : 0)) {
    const top = scored.slice(0, Math.min(4, scored.length));
    return top[Math.floor(Math.random() * top.length)];
  }

  return { r: scored[0].r, c: scored[0].c };
}
