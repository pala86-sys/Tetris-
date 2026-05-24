export const RED = 'red';
export const BLACK = 'black';

export const PIECE = {
  K: 'K', // 帥/將
  A: 'A', // 仕/士
  B: 'B', // 相/象
  N: 'N', // 馬
  R: 'R', // 車
  C: 'C', // 炮/砲
  P: 'P', // 兵/卒
};

export const PIECE_LABEL = {
  red: { K: '帥', A: '仕', B: '相', N: '馬', R: '車', C: '炮', P: '兵' },
  black: { K: '將', A: '士', B: '象', N: '馬', R: '車', C: '砲', P: '卒' },
};

export const XIANGQI_ROWS = 10;
export const XIANGQI_COLS = 9;

export const DARK_ROWS = 4;
export const DARK_COLS = 8;

/** 暗棋每方 16 枚 */
export const DARK_SET = [
  PIECE.K, PIECE.A, PIECE.A,
  PIECE.B, PIECE.B,
  PIECE.N, PIECE.N,
  PIECE.R, PIECE.R,
  PIECE.C, PIECE.C,
  PIECE.P, PIECE.P, PIECE.P, PIECE.P, PIECE.P,
];
