export function serializeGomokuState(game) {
  return {
    mode: game.mode,
    board: game.board,
    turn: game.turn,
    winner: game.winner,
    message: game.message,
    lastMove: game.lastMove,
  };
}

export function deserializeGomokuState(data) {
  return {
    mode: data.mode || 'gomoku',
    board: data.board,
    turn: data.turn,
    winner: data.winner,
    message: data.message,
    lastMove: data.lastMove ?? null,
  };
}
