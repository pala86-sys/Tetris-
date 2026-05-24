import { COLS, ROWS, COLORS } from './constants.js';
import { getShape } from './pieces.js';

export function drawBoard(ctx, board, activePiece, ghostY, cellSize, options = {}) {
  const { offsetY = 0, showGrid = true } = options;
  const width = COLS * cellSize;
  const height = ROWS * cellSize;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = '#0d1320';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.save();
  ctx.translate(0, offsetY);

  if (showGrid) {
    ctx.strokeStyle = 'rgba(30, 45, 74, 0.5)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, height);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(width, y * cellSize);
      ctx.stroke();
    }
  }

  const startRow = 2;
  for (let y = startRow; y < board.length; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = board[y][x];
      if (cell) {
        drawCell(ctx, x, y - startRow, cell, cellSize);
      }
    }
  }

  if (activePiece && ghostY !== null && ghostY !== undefined) {
    const ghost = { ...activePiece, y: ghostY };
    drawPiece(ctx, ghost, cellSize, startRow, true);
  }

  if (activePiece) {
    drawPiece(ctx, activePiece, cellSize, startRow, false);
  }

  ctx.restore();
}

function drawPiece(ctx, piece, cellSize, startRow, isGhost) {
  const shape = getShape(piece);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const x = piece.x + c;
      const y = piece.y + r - startRow;
      if (y >= 0) {
        drawCell(ctx, x, y, piece.type, cellSize, isGhost);
      }
    }
  }
}

function drawCell(ctx, x, y, type, size, isGhost = false) {
  const px = x * size;
  const py = y * size;
  const color = COLORS[type] || COLORS.G;

  if (isGhost) {
    ctx.strokeStyle = COLORS.ghost;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
    return;
  }

  const grad = ctx.createLinearGradient(px, py, px + size, py + size);
  grad.addColorStop(0, lighten(color, 30));
  grad.addColorStop(1, color);

  ctx.fillStyle = grad;
  ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(px + 2, py + 2, size - 4, 3);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);
}

function lighten(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

export function drawPreview(ctx, pieceType, cellSize = 20) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (!pieceType) return;

  const piece = { type: pieceType, rotation: 0, x: 0, y: 0 };
  const shape = getShape(piece);
  const w = shape[0].length;
  const h = shape.length;
  const offsetX = (ctx.canvas.width / cellSize - w) / 2;
  const offsetY = (ctx.canvas.height / cellSize - h) / 2;

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (shape[r][c]) {
        drawCell(ctx, offsetX + c, offsetY + r, pieceType, cellSize);
      }
    }
  }
}
