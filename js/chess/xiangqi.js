import { RED, BLACK, PIECE, XIANGQI_ROWS, XIANGQI_COLS } from './constants.js';

function inBoard(r, c) {
  return r >= 0 && r < XIANGQI_ROWS && c >= 0 && c < XIANGQI_COLS;
}

function inPalace(r, c, color) {
  if (c < 3 || c > 5) return false;
  if (color === RED) return r >= 7 && r <= 9;
  return r >= 0 && r <= 2;
}

function createInitialBoard() {
  const b = Array.from({ length: XIANGQI_ROWS }, () => Array(XIANGQI_COLS).fill(null));
  const row0 = [PIECE.R, PIECE.N, PIECE.B, PIECE.A, PIECE.K, PIECE.A, PIECE.B, PIECE.N, PIECE.R];
  const row2 = [null, PIECE.C, null, null, null, null, null, PIECE.C, null];
  const row3 = [PIECE.P, null, PIECE.P, null, PIECE.P, null, PIECE.P, null, PIECE.P];
  for (let c = 0; c < XIANGQI_COLS; c++) {
    b[0][c] = { type: row0[c], color: BLACK };
    b[2][c] = row2[c] ? { type: row2[c], color: BLACK } : null;
    b[3][c] = row3[c] ? { type: row3[c], color: BLACK } : null;
    b[6][c] = row3[c] ? { type: row3[c], color: RED } : null;
    b[7][c] = row2[c] ? { type: row2[c], color: RED } : null;
    b[9][c] = { type: row0[c], color: RED };
  }
  return b;
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function isEnemy(cell, color) {
  return cell && cell.color !== color;
}

function isFriend(cell, color) {
  return cell && cell.color === color;
}

function generalPositions(board, color) {
  for (let r = 0; r < XIANGQI_ROWS; r++) {
    for (let c = 0; c < XIANGQI_COLS; c++) {
      const p = board[r][c];
      if (p && p.type === PIECE.K && p.color === color) return { r, c };
    }
  }
  return null;
}

function flyingGeneral(board) {
  const red = generalPositions(board, RED);
  const black = generalPositions(board, BLACK);
  if (!red || !black || red.c !== black.c) return false;
  const col = red.c;
  const minR = Math.min(red.r, black.r) + 1;
  const maxR = Math.max(red.r, black.r);
  for (let r = minR; r < maxR; r++) {
    if (board[r][col]) return false;
  }
  return true;
}

function addMove(moves, board, fr, fc, tr, tc, color) {
  if (!inBoard(tr, tc)) return;
  const target = board[tr][tc];
  if (target && target.color === color) return;
  moves.push({ fr, fc, tr, tc });
}

function slideMoves(board, r, c, color, moves, captureOnly = false) {
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (const [dr, dc] of dirs) {
    let jumped = false;
    let nr = r + dr;
    let nc = c + dc;
    while (inBoard(nr, nc)) {
      const cell = board[nr][nc];
      if (!cell) {
        if (!captureOnly) addMove(moves, board, r, c, nr, nc, color);
      } else {
        if (!jumped) {
          if (cell.color !== color) {
            if (!captureOnly) addMove(moves, board, r, c, nr, nc, color);
          }
          jumped = true;
        } else if (captureOnly && cell.color !== color) {
          addMove(moves, board, r, c, nr, nc, color);
          break;
        } else {
          break;
        }
        if (!captureOnly) break;
      }
      nr += dr;
      nc += dc;
    }
  }
}

function pieceMoves(board, r, c, color) {
  const piece = board[r][c];
  if (!piece || piece.color !== color) return [];
  const moves = [];
  const type = piece.type;

  if (type === PIECE.R) {
    slideMoves(board, r, c, color, moves);
  } else if (type === PIECE.C) {
    slideMoves(board, r, c, color, moves, false);
    slideMoves(board, r, c, color, moves, true);
  } else if (type === PIECE.K) {
    const steps = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dr, dc] of steps) {
      const nr = r + dr;
      const nc = c + dc;
      if (inPalace(nr, nc, color)) addMove(moves, board, r, c, nr, nc, color);
    }
  } else if (type === PIECE.A) {
    const steps = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (const [dr, dc] of steps) {
      const nr = r + dr;
      const nc = c + dc;
      if (inPalace(nr, nc, color)) addMove(moves, board, r, c, nr, nc, color);
    }
  } else if (type === PIECE.B) {
    const steps = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
    for (const [dr, dc] of steps) {
      const nr = r + dr;
      const nc = c + dc;
      const mr = r + dr / 2;
      const mc = c + dc / 2;
      if (color === RED && nr < 5) continue;
      if (color === BLACK && nr > 4) continue;
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
  } else if (type === PIECE.P) {
    const forward = color === RED ? -1 : 1;
    addMove(moves, board, r, c, r + forward, c, color);
    const crossed = color === RED ? r <= 4 : r >= 5;
    if (crossed) {
      addMove(moves, board, r, c, r, c - 1, color);
      addMove(moves, board, r, c, r, c + 1, color);
    }
  }

  return moves;
}

function applyMove(board, move) {
  const next = cloneBoard(board);
  const captured = next[move.tr][move.tc];
  next[move.tr][move.tc] = next[move.fr][move.fc];
  next[move.fr][move.fc] = null;
  return { board: next, captured };
}

function inCheck(board, color) {
  if (flyingGeneral(board)) return true;
  const enemy = color === RED ? BLACK : RED;
  for (let r = 0; r < XIANGQI_ROWS; r++) {
    for (let c = 0; c < XIANGQI_COLS; c++) {
      const p = board[r][c];
      if (p && p.color === enemy) {
        const moves = pieceMoves(board, r, c, enemy);
        for (const m of moves) {
          if (board[m.tr][m.tc]?.type === PIECE.K && board[m.tr][m.tc]?.color === color) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function legalMoves(board, color) {
  const all = [];
  for (let r = 0; r < XIANGQI_ROWS; r++) {
    for (let c = 0; c < XIANGQI_COLS; c++) {
      if (board[r][c]?.color === color) {
        const moves = pieceMoves(board, r, c, color);
        for (const m of moves) {
          const { board: next } = applyMove(board, m);
          if (!inCheck(next, color)) all.push(m);
        }
      }
    }
  }
  return all;
}

export function createXiangqiGame() {
  return {
    mode: 'xiangqi',
    board: createInitialBoard(),
    turn: RED,
    selected: null,
    legal: [],
    winner: null,
    message: '紅方先行',
  };
}

export function selectXiangqi(game, r, c) {
  if (game.winner) return game;
  const cell = game.board[r][c];
  if (cell && cell.color === game.turn) {
    game.selected = { r, c };
    game.legal = legalMoves(game.board, game.turn).filter((m) => m.fr === r && m.fc === c);
    return game;
  }
  if (!game.selected) return game;
  const move = game.legal.find((m) => m.tr === r && m.tc === c);
  if (!move) {
    game.selected = null;
    game.legal = [];
    return selectXiangqi(game, r, c);
  }
  const { board, captured } = applyMove(game.board, move);
  game.board = board;
  game.selected = null;
  game.legal = [];
  if (captured?.type === PIECE.K) {
    game.winner = game.turn;
    game.message = game.turn === RED ? '紅方獲勝！' : '黑方獲勝！';
    return game;
  }
  game.turn = game.turn === RED ? BLACK : RED;
  const moves = legalMoves(game.board, game.turn);
  if (moves.length === 0) {
    game.winner = game.turn === RED ? BLACK : RED;
    game.message = game.winner === RED ? '紅方獲勝！' : '黑方獲勝！';
  } else if (inCheck(game.board, game.turn)) {
    game.message = game.turn === RED ? '紅方被將軍！' : '黑方被將軍！';
  } else {
    game.message = game.turn === RED ? '輪到紅方' : '輪到黑方';
  }
  return game;
}

export function resetXiangqi(game) {
  Object.assign(game, createXiangqiGame());
  return game;
}
