import { RED, BLACK, PIECE, DARK_ROWS, DARK_COLS, DARK_SET, PIECE_LABEL } from './constants.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function inBoard(r, c) {
  return r >= 0 && r < DARK_ROWS && c >= 0 && c < DARK_COLS;
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function createInitialBoard() {
  const b = Array.from({ length: DARK_ROWS }, () => Array(DARK_COLS).fill(null));
  const redPieces = shuffle(DARK_SET.map((t) => ({ type: t, color: RED, revealed: false })));
  const blackPieces = shuffle(DARK_SET.map((t) => ({ type: t, color: BLACK, revealed: false })));
  let ri = 0;
  let bi = 0;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < DARK_COLS; c++) {
      b[r][c] = blackPieces[bi++];
    }
  }
  for (let r = 2; r < 4; r++) {
    for (let c = 0; c < DARK_COLS; c++) {
      b[r][c] = redPieces[ri++];
    }
  }
  return b;
}

function forwardDir(color) {
  return color === RED ? -1 : 1;
}

function isEnemy(cell, color) {
  return cell && cell.revealed && cell.color !== color;
}

function addMove(moves, board, fr, fc, tr, tc, color) {
  if (!inBoard(tr, tc)) return;
  const target = board[tr][tc];
  if (target?.revealed && target.color === color) return;
  if (!target || (target.revealed && target.color !== color)) {
    moves.push({ fr, fc, tr, tc, flip: false });
  }
}

function darkPieceMoves(board, r, c, color) {
  const cell = board[r][c];
  if (!cell?.revealed || cell.color !== color) return [];
  const moves = [];
  const type = cell.type;

  if (type === PIECE.K) {
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      addMove(moves, board, r, c, r + dr, c + dc, color);
    }
  } else if (type === PIECE.A) {
    for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      addMove(moves, board, r, c, r + dr, c + dc, color);
    }
  } else if (type === PIECE.B) {
    for (const [dr, dc] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
      const nr = r + dr;
      const nc = c + dc;
      const mr = r + dr / 2;
      const mc = c + dc / 2;
      if (inBoard(nr, nc) && !board[mr][mc]) addMove(moves, board, r, c, nr, nc, color);
    }
  } else if (type === PIECE.N) {
    const legs = [
      [-1, 0, -2, -1], [-1, 0, -2, 1],
      [1, 0, 2, -1], [1, 0, 2, 1],
      [0, -1, -1, -2], [0, -1, 1, -2],
      [0, 1, -1, 2], [0, 1, 1, 2],
    ];
    for (const [lr, lc, nr, nc] of legs) {
      const legR = r + lr;
      const legC = c + lc;
      if (!inBoard(legR, legC) || board[legR][legC]) continue;
      addMove(moves, board, r, c, r + nr, c + nc, color);
    }
  } else if (type === PIECE.R) {
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      let nr = r + dr;
      let nc = c + dc;
      while (inBoard(nr, nc)) {
        const t = board[nr][nc];
        if (!t) {
          addMove(moves, board, r, c, nr, nc, color);
        } else {
          if (t.revealed && t.color !== color) addMove(moves, board, r, c, nr, nc, color);
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  } else if (type === PIECE.C) {
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      let nr = r + dr;
      let nc = c + dc;
      let jumped = false;
      while (inBoard(nr, nc)) {
        const t = board[nr][nc];
        if (!t) {
          if (!jumped) addMove(moves, board, r, c, nr, nc, color);
        } else {
          if (!jumped) {
            jumped = true;
          } else if (t.revealed && t.color !== color) {
            addMove(moves, board, r, c, nr, nc, color);
            break;
          } else {
            break;
          }
        }
        nr += dr;
        nc += dc;
      }
    }
  } else if (type === PIECE.P) {
    const f = forwardDir(color);
    addMove(moves, board, r, c, r + f, c, color);
  }

  return moves;
}

function flipMoves(board, color) {
  const moves = [];
  for (let r = 0; r < DARK_ROWS; r++) {
    for (let c = 0; c < DARK_COLS; c++) {
      const cell = board[r][c];
      if (cell && !cell.revealed && cell.color === color) {
        moves.push({ fr: r, fc: c, tr: r, tc: c, flip: true });
      }
    }
  }
  return moves;
}

function allMoves(board, color) {
  const moves = [...flipMoves(board, color)];
  for (let r = 0; r < DARK_ROWS; r++) {
    for (let c = 0; c < DARK_COLS; c++) {
      moves.push(...darkPieceMoves(board, r, c, color));
    }
  }
  return moves;
}

function countPieces(board, color) {
  let n = 0;
  for (let r = 0; r < DARK_ROWS; r++) {
    for (let c = 0; c < DARK_COLS; c++) {
      const cell = board[r][c];
      if (cell && cell.color === color) n++;
    }
  }
  return n;
}

function applyMove(board, move) {
  const next = cloneBoard(board);
  const cell = next[move.fr][move.fc];
  if (move.flip) {
    cell.revealed = true;
    return { board: next, captured: null };
  }
  const captured = next[move.tr][move.tc];
  next[move.tr][move.tc] = cell;
  next[move.fr][move.fc] = null;
  if (cell) cell.revealed = true;
  return { board: next, captured };
}

export function createDarkChessGame() {
  return {
    mode: 'dark',
    board: createInitialBoard(),
    turn: RED,
    selected: null,
    legal: [],
    winner: null,
    message: '紅方先行：翻棋或移動',
  };
}

export function selectDark(game, r, c) {
  if (game.winner) return game;
  const cell = game.board[r][c];

  if (game.selected) {
    const move = game.legal.find((m) => m.tr === r && m.tc === c);
    if (move) {
      const mover = game.board[move.fr][move.fc];
      const { board, captured } = applyMove(game.board, move);
      game.board = board;
      game.selected = null;
      game.legal = [];
      if (captured?.type === PIECE.K) {
        game.winner = mover.color;
        game.message = game.winner === RED ? '紅方獲勝！' : '黑方獲勝！';
        return game;
      }
      game.turn = game.turn === RED ? BLACK : RED;
      const enemy = game.turn;
      if (countPieces(game.board, enemy) === 0) {
        game.winner = game.turn === RED ? BLACK : RED;
        game.message = game.winner === RED ? '紅方獲勝！' : '黑方獲勝！';
        return game;
      }
      const moves = allMoves(game.board, game.turn);
      if (moves.length === 0) {
        game.winner = game.turn === RED ? BLACK : RED;
        game.message = game.winner === RED ? '紅方獲勝！' : '黑方獲勝！';
      } else {
        game.message = game.turn === RED ? '輪到紅方' : '輪到黑方';
      }
      return game;
    }
    game.selected = null;
    game.legal = [];
  }

  if (cell && (cell.revealed ? cell.color === game.turn : cell.color === game.turn)) {
    game.selected = { r, c };
    game.legal = allMoves(game.board, game.turn).filter((m) => m.fr === r && m.fc === c);
    if (!cell.revealed) {
      game.message = '按同一格翻開棋子';
    }
    return game;
  }

  return game;
}

export function resetDark(game) {
  Object.assign(game, createDarkChessGame());
  return game;
}

export function getDarkDisplayLabel(cell) {
  if (!cell) return '';
  if (!cell.revealed) return '?';
  return PIECE_LABEL[cell.color][cell.type];
}
