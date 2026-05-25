import { SIZE, BLACK } from './constants.js';
import { getLegalMoves, placeDisc, opponent, countDiscs } from './othello.js';

/** 經典黑白棋位置權重 */
const POS_WEIGHT = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120],
];

function cloneGame(game) {
  return {
    mode: game.mode,
    board: game.board.map((row) => [...row]),
    turn: game.turn,
    winner: game.winner,
    message: game.message,
    lastMove: game.lastMove,
    legalMoves: game.legalMoves.map((m) => ({
      r: m.r,
      c: m.c,
      flips: m.flips.map((f) => ({ ...f })),
    })),
    score: game.score,
  };
}

function evaluate(game, aiColor) {
  const moves = getLegalMoves(game.board, game.turn);
  let score = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = game.board[r][c];
      if (!cell) continue;
      const w = POS_WEIGHT[r][c];
      score += cell === aiColor ? w : -w;
    }
  }
  const { black, white } = countDiscs(game.board);
  const mine = aiColor === BLACK ? black : white;
  const theirs = aiColor === BLACK ? white : black;
  score += (mine - theirs) * 2;
  if (game.turn === aiColor) score += moves.length * 3;
  else score -= moves.length * 3;
  return score;
}

export function getAiThinkDelay(difficulty) {
  return { easy: 550, normal: 400, hard: 300 }[difficulty] || 400;
}

export function pickAiMove(game, aiColor, difficulty = 'normal') {
  const moves = game.legalMoves;
  if (!moves.length) return null;

  if (difficulty === 'easy') {
    const top = moves.slice(0, Math.min(5, moves.length));
    return top[Math.floor(Math.random() * top.length)];
  }

  const scored = moves.map((m) => {
    const sim = cloneGame(game);
    placeDisc(sim, m.r, m.c);
    let s = evaluate(sim, aiColor);
    if (difficulty === 'hard') {
      const replyMoves = getLegalMoves(sim.board, sim.turn);
      if (replyMoves.length > 0) {
        let worst = Infinity;
        for (const reply of replyMoves.slice(0, 8)) {
          const sim2 = cloneGame(sim);
          placeDisc(sim2, reply.r, reply.c);
          worst = Math.min(worst, evaluate(sim2, aiColor));
        }
        s = s * 0.6 + worst * 0.4;
      }
    }
    return { move: m, s };
  });

  scored.sort((a, b) => b.s - a.s);

  if (difficulty === 'normal' && Math.random() < 0.1) {
    const top = scored.slice(0, Math.min(3, scored.length));
    return top[Math.floor(Math.random() * top.length)].move;
  }

  return scored[0].move;
}
