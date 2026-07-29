import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PIECE_TYPES } from './constants.js';
import { randomBag, createPiece, rotatePiece, clonePiece } from './pieces.js';

test('randomBag contains each piece type exactly once', () => {
  const bag = randomBag();
  assert.equal(bag.length, PIECE_TYPES.length);
  assert.deepEqual([...bag].sort(), [...PIECE_TYPES].sort());
});

test('createPiece defaults to spawn position and rotation 0', () => {
  const piece = createPiece('T');
  assert.equal(piece.type, 'T');
  assert.equal(piece.rotation, 0);
  assert.equal(piece.x, 3);
  assert.equal(piece.y, 0);
});

test('createPiece normalizes an out-of-range rotation', () => {
  const piece = createPiece('T', 5);
  assert.equal(piece.rotation, 1);
});

test('rotatePiece wraps forward past rotation 3 back to 0', () => {
  const piece = createPiece('L', 3);
  const rotated = rotatePiece(piece, 1);
  assert.equal(rotated.rotation, 0);
});

test('rotatePiece wraps backward past rotation 0 to 3', () => {
  const piece = createPiece('L', 0);
  const rotated = rotatePiece(piece, -1);
  assert.equal(rotated.rotation, 3);
});

test('clonePiece returns an equal but distinct object', () => {
  const piece = createPiece('S', 2);
  const clone = clonePiece(piece);
  assert.deepEqual(clone, piece);
  assert.notEqual(clone, piece);
});
