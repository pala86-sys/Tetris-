export const DIFFICULTIES = {
  easy: { label: '初級', rows: 9, cols: 9, mines: 10 },
  medium: { label: '中級', rows: 16, cols: 16, mines: 40 },
  hard: { label: '高級', rows: 16, cols: 30, mines: 99 },
};

export const CELL_STATE = {
  HIDDEN: 'hidden',
  REVEALED: 'revealed',
  FLAGGED: 'flagged',
};

export const MINE = -1;
