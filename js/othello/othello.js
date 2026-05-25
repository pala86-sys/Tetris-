import { BLACK, WHITE, SIZE, COLOR_LABEL } from './constants.js';

const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

export function opponent(color) {
  return color === BLACK ? WHITE : BLACK;
}

function inBoard(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

export function flipsForMove(board, r, c, color) {
  if (board[r][c]) return [];
  const opp = opponent(color);
  let all = [];
  for (const [dr, dc] of DIRS) {
    const line = [];
    let nr = r + dr;
    let nc = c + dc;
    while (inBoard(nr, nc) && board[nr][nc] === opp) {
      line.push({ r: nr, c: nc });
      nr += dr;
      nc += dc;
    }
    if (inBoard(nr, nc) && board[nr][nc] === color && line.length > 0) {
      all = all.concat(line);
    }
  }
  return all;
}

export function getLegalMoves(board, color) {
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c]) continue;
      const flips = flipsForMove(board, r, c, color);
      if (flips.length > 0) moves.push({ r, c, flips });
    }
  }
  return moves;
}

export function countDiscs(board) {
  let black = 0;
  let white = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === BLACK) black++;
      else if (board[r][c] === WHITE) white++;
    }
  }
  return { black, white };
}

function finishGame(game) {
  const { black, white } = countDiscs(game.board);
  game.score = { black, white };
  if (black > white) {
    game.winner = BLACK;
    game.message = `黑方勝（${black}:${white}）`;
  } else if (white > black) {
    game.winner = WHITE;
    game.message = `白方勝（${black}:${white}）`;
  } else {
    game.winner = 'draw';
    game.message = `和棋（${black}:${white}）`;
  }
  return game;
}

function advanceTurn(game) {
  const next = opponent(game.turn);
  if (getLegalMoves(game.board, next).length > 0) {
    game.turn = next;
    game.message = `輪到${COLOR_LABEL[next]}`;
    return game;
  }
  if (getLegalMoves(game.board, game.turn).length > 0) {
    game.message = `${COLOR_LABEL[next]}無棋可下 · 輪到${COLOR_LABEL[game.turn]}`;
    return game;
  }
  return finishGame(game);
}

function createInitialBoard() {
  const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  b[3][3] = WHITE;
  b[3][4] = BLACK;
  b[4][3] = BLACK;
  b[4][4] = WHITE;
  return b;
}

export function createOthelloGame() {
  return {
    mode: 'othello',
    board: createInitialBoard(),
    turn: BLACK,
    winner: null,
    message: '黑方先行',
    lastMove: null,
    legalMoves: getLegalMoves(createInitialBoard(), BLACK),
    score: null,
  };
}

export function refreshLegalMoves(game) {
  game.legalMoves = getLegalMoves(game.board, game.turn);
  return game;
}

export function placeDisc(game, r, c) {
  if (game.winner) return game;
  const move = game.legalMoves.find((m) => m.r === r && m.c === c);
  if (!move) return game;

  game.board[r][c] = game.turn;
  for (const cell of move.flips) {
    game.board[cell.r][cell.c] = game.turn;
  }
  game.lastMove = { r, c };
  return refreshLegalMoves(advanceTurn(game));
}

export function resetOthello(game) {
  Object.assign(game, createOthelloGame());
  return game;
}
