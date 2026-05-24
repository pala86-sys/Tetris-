export const COLS = 10;
export const ROWS = 20;
export const HIDDEN_ROWS = 2;
export const TOTAL_ROWS = ROWS + HIDDEN_ROWS;

export const BLOCK_SIZE = 30;

export const COLORS = {
  I: '#00e5ff',
  O: '#ffd93d',
  T: '#c56cf0',
  S: '#2ed573',
  Z: '#ff4757',
  J: '#3742fa',
  L: '#ff9f43',
  G: '#5a6268', // garbage
  ghost: 'rgba(255, 255, 255, 0.15)',
};

export const SHAPES = {
  I: [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
    [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
  ],
  O: [
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
  ],
  T: [
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
  ],
  S: [
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
    [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
    [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
    [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
  ],
  J: [
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
    [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
  ],
  L: [
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
    [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
  ],
};

export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export const SCORE_TABLE = [0, 100, 300, 500, 800];

export const GARBAGE_LINES = {
  1: 0,
  2: 1,
  3: 2,
  4: 4,
};

export const LEVEL_SPEED = [
  1000, 900, 800, 700, 600, 500, 450, 400, 350, 300,
  280, 260, 240, 220, 200, 180, 160, 140, 120, 100,
];

/** 按住 ↓ / S 時的軟降間隔（毫秒，越小越快） */
export const SOFT_DROP_INTERVAL = 35;

export const AI_CONFIG = {
  easy: {
    thinkDelay: 500,
    actionDelay: 100,
    mistakeRate: 0.12,
    lookaheadWeight: 0.15,
  },
  normal: {
    thinkDelay: 280,
    actionDelay: 55,
    mistakeRate: 0.04,
    lookaheadWeight: 0.35,
  },
  hard: {
    thinkDelay: 100,
    actionDelay: 35,
    mistakeRate: 0.01,
    lookaheadWeight: 0.55,
  },
};

export const KEY_MAP = {
  p1: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    down: 'ArrowDown',
    rotate: 'ArrowUp',
    rotateCCW: 'KeyZ',
    hardDrop: 'Space',
    hold: 'KeyC',
  },
  p2: {
    left: 'KeyA',
    right: 'KeyD',
    down: 'KeyS',
    rotate: 'KeyW',
    rotateCCW: 'KeyQ',
    hardDrop: 'KeyF',
    hold: 'KeyE',
  },
};
