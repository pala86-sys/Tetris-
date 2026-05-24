import { COLS, TOTAL_ROWS, HIDDEN_ROWS } from './constants.js';
import { getShape } from './pieces.js';

export function createBoard() {
  return Array.from({ length: TOTAL_ROWS }, () => Array(COLS).fill(null));
}

export function isValidPosition(board, piece, offsetX = 0, offsetY = 0) {
  const shape = getShape(piece);
  const px = piece.x + offsetX;
  const py = piece.y + offsetY;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const x = px + c;
      const y = py + r;
      if (x < 0 || x >= COLS || y >= TOTAL_ROWS) return false;
      if (y >= 0 && board[y][x]) return false;
    }
  }
  return true;
}

export function lockPiece(board, piece) {
  const shape = getShape(piece);
  const newBoard = board.map((row) => [...row]);

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const x = piece.x + c;
      const y = piece.y + r;
      if (y >= 0 && y < TOTAL_ROWS && x >= 0 && x < COLS) {
        newBoard[y][x] = piece.type;
      }
    }
  }
  return newBoard;
}

export function clearLines(board) {
  const newBoard = [];
  let cleared = 0;

  for (let y = 0; y < TOTAL_ROWS; y++) {
    if (board[y].every((cell) => cell !== null)) {
      cleared++;
    } else {
      newBoard.push([...board[y]]);
    }
  }

  while (newBoard.length < TOTAL_ROWS) {
    newBoard.unshift(Array(COLS).fill(null));
  }

  return { board: newBoard, cleared };
}

export function addGarbage(board, lines, holeCol = null) {
  const newBoard = board.map((row) => [...row]);
  const hole = holeCol ?? Math.floor(Math.random() * COLS);

  for (let i = 0; i < lines; i++) {
    newBoard.shift();
    const row = Array(COLS).fill('G');
    row[hole] = null;
    newBoard.push(row);
  }

  return newBoard;
}

export function getGhostY(board, piece) {
  let ghost = { ...piece };
  while (isValidPosition(board, ghost, 0, 1)) {
    ghost.y++;
  }
  return ghost.y;
}

export function isGameOver(board) {
  for (let c = 0; c < COLS; c++) {
    if (board[HIDDEN_ROWS][c]) return true;
  }
  return false;
}

export function copyBoard(board) {
  return board.map((row) => [...row]);
}
