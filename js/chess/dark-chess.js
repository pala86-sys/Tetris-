import { RED, BLACK, PIECE, DARK_ROWS, DARK_COLS, DARK_SET, PIECE_LABEL } from './constants.js';

/** 棋子大小（暗棋比大小用） */
const RANK = {
  [PIECE.K]: 7,
  [PIECE.A]: 6,
  [PIECE.B]: 5,
  [PIECE.R]: 4,
  [PIECE.N]: 3,
  [PIECE.C]: 2,
  [PIECE.P]: 1,
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = (seed >>> 0) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
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

function createInitialBoard(seed = null) {
  const b = Array.from({ length: DARK_ROWS }, () => Array(DARK_COLS).fill(null));
  const makeSide = (color) => DARK_SET.map((t) => ({ type: t, color, revealed: false }));
  const redPieces = seed != null ? seededShuffle(makeSide(RED), seed) : shuffle(makeSide(RED));
  const blackPieces = seed != null
    ? seededShuffle(makeSide(BLACK), (seed + 7919) >>> 0)
    : shuffle(makeSide(BLACK));
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

/** 攻方能否吃掉守方（已翻開比大小；兵可吃將） */
export function canCapture(attackerType, defenderType) {
  if (attackerType === PIECE.P && defenderType === PIECE.K) return true;
  return RANK[attackerType] >= RANK[defenderType];
}

function addMove(moves, board, fr, fc, tr, tc, color, attackerType) {
  if (!inBoard(tr, tc)) return;
  const target = board[tr][tc];
  if (!target) {
    moves.push({ fr, fc, tr, tc, flip: false });
    return;
  }
  if (target.revealed && target.color === color) return;
  if (!target.revealed) {
    moves.push({ fr, fc, tr, tc, flip: false });
    return;
  }
  if (target.color !== color && canCapture(attackerType, target.type)) {
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
      addMove(moves, board, r, c, r + dr, c + dc, color, type);
    }
  } else if (type === PIECE.A) {
    for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      addMove(moves, board, r, c, r + dr, c + dc, color, type);
    }
  } else if (type === PIECE.B) {
    for (const [dr, dc] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
      const nr = r + dr;
      const nc = c + dc;
      const mr = r + dr / 2;
      const mc = c + dc / 2;
      if (inBoard(nr, nc) && !board[mr][mc]) addMove(moves, board, r, c, nr, nc, color, type);
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
      addMove(moves, board, r, c, r + nr, c + nc, color, type);
    }
  } else if (type === PIECE.R) {
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      let nr = r + dr;
      let nc = c + dc;
      while (inBoard(nr, nc)) {
        const t = board[nr][nc];
        if (!t) {
          addMove(moves, board, r, c, nr, nc, color, type);
        } else {
          addMove(moves, board, r, c, nr, nc, color, type);
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
          if (!jumped) addMove(moves, board, r, c, nr, nc, color, type);
        } else {
          if (!jumped) {
            jumped = true;
          } else {
            addMove(moves, board, r, c, nr, nc, color, type);
            break;
          }
        }
        nr += dr;
        nc += dc;
      }
    }
  } else if (type === PIECE.P) {
    const f = forwardDir(color);
    addMove(moves, board, r, c, r + f, c, color, type);
  }

  return moves;
}

/** 任一面朝下棋子皆可翻開 */
function flipMoves(board) {
  const moves = [];
  for (let r = 0; r < DARK_ROWS; r++) {
    for (let c = 0; c < DARK_COLS; c++) {
      const cell = board[r][c];
      if (cell && !cell.revealed) {
        moves.push({ fr: r, fc: c, tr: r, tc: c, flip: true });
      }
    }
  }
  return moves;
}

export function allMoves(board, color) {
  const moves = [...flipMoves(board)];
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

/**
 * 移動後與目標比大小。回傳 { board, captured, moverRemoved }
 * captured 為被吃掉的棋子（可能為守方或攻方）
 */
function resolveMoveBattle(board, fr, fc, tr, tc) {
  const next = cloneBoard(board);
  const mover = next[fr][fc];
  const target = next[tr][tc];
  if (!mover) return { board: next, captured: null };

  mover.revealed = true;
  next[tr][tc] = mover;
  next[fr][fc] = null;

  if (!target) {
    return { board: next, captured: null };
  }

  target.revealed = true;

  if (target.color === mover.color) {
    return { board: next, captured: null };
  }

  if (canCapture(mover.type, target.type)) {
    return { board: next, captured: target };
  }

  next[tr][tc] = target;
  return { board: next, captured: mover };
}

function applyMove(board, move) {
  const next = cloneBoard(board);
  const cell = next[move.fr][move.fc];
  if (move.flip) {
    cell.revealed = true;
    return { board: next, captured: null };
  }
  return resolveMoveBattle(board, move.fr, move.fc, move.tr, move.tc);
}

function finishDarkTurn(game, moverColor, captured) {
  game.selected = null;
  game.legal = [];
  if (captured?.type === PIECE.K) {
    game.winner = moverColor;
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
    game.message = game.turn === RED ? '輪到紅方（可翻棋或移動）' : '輪到黑方（可翻棋或移動）';
  }
  return game;
}

export function applyDarkMove(game, move) {
  if (game.winner) return game;
  const mover = game.board[move.fr][move.fc];
  if (!mover) return game;
  const moverColor = move.flip ? mover.color : mover.color;
  const { board, captured } = applyMove(game.board, move);
  game.board = board;
  if (captured?.type === PIECE.K) {
    game.winner = captured.color === RED ? BLACK : RED;
    game.message = game.winner === RED ? '紅方獲勝！' : '黑方獲勝！';
    game.selected = null;
    game.legal = [];
    return game;
  }
  return finishDarkTurn(game, moverColor, captured);
}

export function createDarkChessGame(seed = null) {
  return {
    mode: 'dark',
    board: createInitialBoard(seed),
    seed,
    turn: RED,
    selected: null,
    legal: [],
    winner: null,
    message: '紅方先行：可翻任意暗棋或移動',
  };
}

export function selectDark(game, r, c) {
  if (game.winner) return game;
  const cell = game.board[r][c];

  if (game.selected) {
    const move = game.legal.find((m) => m.tr === r && m.tc === c);
    if (move) {
      return applyDarkMove(game, move);
    }
    game.selected = null;
    game.legal = [];
  }

  if (cell && !cell.revealed) {
    game.selected = { r, c };
    game.legal = [{ fr: r, fc: c, tr: r, tc: c, flip: true }];
    game.message = '再按一次翻開棋子';
    return game;
  }

  if (cell?.revealed && cell.color === game.turn) {
    game.selected = { r, c };
    game.legal = allMoves(game.board, game.turn).filter((m) => m.fr === r && m.fc === c);
    if (game.legal.length === 0) {
      game.selected = null;
      game.message = '此棋無法移動';
    }
    return game;
  }

  return game;
}

export function resetDark(game) {
  Object.assign(game, createDarkChessGame(game.seed ?? null));
  return game;
}

export function getDarkDisplayLabel(cell) {
  if (!cell) return '';
  if (!cell.revealed) return '?';
  return PIECE_LABEL[cell.color][cell.type];
}
