import { CELL_STATE, MINE } from './constants.js';

export function createMinesweeperGame(rows, cols, mineCount) {
  return {
    rows,
    cols,
    mineCount,
    minesPlaced: false,
    board: Array.from({ length: rows }, () => Array(cols).fill(0)),
    state: Array.from({ length: rows }, () => Array(cols).fill(CELL_STATE.HIDDEN)),
    flags: 0,
    revealedCount: 0,
    status: 'playing',
    message: '點擊格子開始',
  };
}

function inBounds(game, r, c) {
  return r >= 0 && r < game.rows && c >= 0 && c < game.cols;
}

function neighbors(r, c) {
  const list = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      list.push([r + dr, c + dc]);
    }
  }
  return list;
}

function isSafeZone(game, r, c, safeR, safeC) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (r === safeR + dr && c === safeC + dc) return true;
    }
  }
  return false;
}

function placeMines(game, safeR, safeC) {
  const positions = [];
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      if (!isSafeZone(game, r, c, safeR, safeC)) {
        positions.push([r, c]);
      }
    }
  }

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  const minePositions = positions.slice(0, game.mineCount);
  for (const [r, c] of minePositions) {
    game.board[r][c] = MINE;
  }

  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      if (game.board[r][c] === MINE) continue;
      let count = 0;
      for (const [nr, nc] of neighbors(r, c)) {
        if (inBounds(game, nr, nc) && game.board[nr][nc] === MINE) count++;
      }
      game.board[r][c] = count;
    }
  }

  game.minesPlaced = true;
}

function revealCell(game, r, c) {
  if (!inBounds(game, r, c)) return;
  if (game.state[r][c] !== CELL_STATE.HIDDEN) return;

  game.state[r][c] = CELL_STATE.REVEALED;
  game.revealedCount++;

  if (game.board[r][c] === 0) {
    for (const [nr, nc] of neighbors(r, c)) {
      revealCell(game, nr, nc);
    }
  }
}

function revealAllMines(game) {
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      if (game.board[r][c] === MINE) {
        game.state[r][c] = CELL_STATE.REVEALED;
      }
    }
  }
}

function checkWin(game) {
  const totalSafe = game.rows * game.cols - game.mineCount;
  if (game.revealedCount >= totalSafe) {
    game.status = 'won';
    game.message = '恭喜過關！';
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (game.board[r][c] === MINE && game.state[r][c] !== CELL_STATE.FLAGGED) {
          game.state[r][c] = CELL_STATE.FLAGGED;
          game.flags++;
        }
      }
    }
  }
}

export function reveal(game, r, c) {
  if (game.status !== 'playing') return game;
  if (!inBounds(game, r, c)) return game;
  if (game.state[r][c] === CELL_STATE.FLAGGED) return game;
  if (game.state[r][c] === CELL_STATE.REVEALED) return game;

  if (!game.minesPlaced) {
    placeMines(game, r, c);
    game.message = '繼續掃雷';
  }

  if (game.board[r][c] === MINE) {
    game.state[r][c] = CELL_STATE.REVEALED;
    game.status = 'lost';
    game.message = '踩到地雷了！';
    revealAllMines(game);
    return game;
  }

  revealCell(game, r, c);
  checkWin(game);
  return game;
}

export function toggleFlag(game, r, c) {
  if (game.status !== 'playing') return game;
  if (!inBounds(game, r, c)) return game;

  const cellState = game.state[r][c];
  if (cellState === CELL_STATE.REVEALED) return game;

  if (cellState === CELL_STATE.FLAGGED) {
    game.state[r][c] = CELL_STATE.HIDDEN;
    game.flags--;
  } else {
    game.state[r][c] = CELL_STATE.FLAGGED;
    game.flags++;
  }
  return game;
}

export function chord(game, r, c) {
  if (game.status !== 'playing') return game;
  if (!inBounds(game, r, c)) return game;
  if (game.state[r][c] !== CELL_STATE.REVEALED) return game;

  const value = game.board[r][c];
  if (value <= 0) return game;

  let flagCount = 0;
  for (const [nr, nc] of neighbors(r, c)) {
    if (inBounds(game, nr, nc) && game.state[nr][nc] === CELL_STATE.FLAGGED) {
      flagCount++;
    }
  }
  if (flagCount !== value) return game;

  for (const [nr, nc] of neighbors(r, c)) {
    if (game.state[nr][nc] === CELL_STATE.HIDDEN) {
      reveal(game, nr, nc);
      if (game.status !== 'playing') break;
    }
  }
  return game;
}

export function resetMinesweeper(game) {
  game.minesPlaced = false;
  game.board = Array.from({ length: game.rows }, () => Array(game.cols).fill(0));
  game.state = Array.from({ length: game.rows }, () => Array(game.cols).fill(CELL_STATE.HIDDEN));
  game.flags = 0;
  game.revealedCount = 0;
  game.status = 'playing';
  game.message = '點擊格子開始';
  return game;
}

export function minesRemaining(game) {
  return Math.max(0, game.mineCount - game.flags);
}
