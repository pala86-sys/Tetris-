import { BLACK, WHITE, SIZE, COLOR_LABEL } from './constants.js';

const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

export function opponent(color) {
  return color === BLACK ? WHITE : BLACK;
}

function inBoard(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function countDir(board, r, c, dr, dc, color) {
  let n = 0;
  let nr = r + dr;
  let nc = c + dc;
  while (inBoard(nr, nc) && board[nr][nc] === color) {
    n++;
    nr += dr;
    nc += dc;
  }
  return n;
}

export function checkWin(board, r, c, color) {
  for (const [dr, dc] of DIRS) {
    const total = 1
      + countDir(board, r, c, dr, dc, color)
      + countDir(board, r, c, -dr, -dc, color);
    if (total >= 5) return true;
  }
  return false;
}

function isBoardFull(board) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!board[r][c]) return false;
    }
  }
  return true;
}

export function createGomokuGame() {
  return {
    mode: 'gomoku',
    board: Array.from({ length: SIZE }, () => Array(SIZE).fill(null)),
    turn: BLACK,
    winner: null,
    message: '黑方先行',
    lastMove: null,
  };
}

export function placeStone(game, r, c) {
  if (game.winner || !inBoard(r, c) || game.board[r][c]) return game;

  game.board[r][c] = game.turn;
  game.lastMove = { r, c };

  if (checkWin(game.board, r, c, game.turn)) {
    game.winner = game.turn;
    game.message = `${COLOR_LABEL[game.winner]}連五獲勝！`;
    return game;
  }

  if (isBoardFull(game.board)) {
    game.winner = 'draw';
    game.message = '和棋';
    return game;
  }

  game.turn = opponent(game.turn);
  game.message = `輪到${COLOR_LABEL[game.turn]}`;
  return game;
}

export function resetGomoku(game) {
  Object.assign(game, createGomokuGame());
  return game;
}

/** 測試在 (r,c) 落子是否形成五連 */
export function wouldWin(board, r, c, color) {
  if (board[r][c]) return false;
  const next = board.map((row) => [...row]);
  next[r][c] = color;
  return checkWin(next, r, c, color);
}
