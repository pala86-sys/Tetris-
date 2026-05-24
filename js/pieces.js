import { PIECE_TYPES, SHAPES } from './constants.js';

export function randomBag() {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function createPiece(type, rotation = 0) {
  return {
    type,
    rotation: rotation % 4,
    x: 3,
    y: 0,
  };
}

export function getShape(piece) {
  return SHAPES[piece.type][piece.rotation];
}

export function rotatePiece(piece, dir = 1) {
  return {
    ...piece,
    rotation: (piece.rotation + dir + 4) % 4,
  };
}

export function clonePiece(piece) {
  return { ...piece };
}
