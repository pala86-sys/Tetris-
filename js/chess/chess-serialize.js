export function serializeChessState(game) {
  return {
    mode: game.mode,
    board: game.board,
    turn: game.turn,
    selected: game.selected,
    legal: game.legal,
    winner: game.winner,
    message: game.message,
    seed: game.seed ?? null,
  };
}

export function deserializeChessState(data) {
  return {
    mode: data.mode,
    board: data.board,
    turn: data.turn,
    selected: data.selected,
    legal: data.legal || [],
    winner: data.winner,
    message: data.message,
    seed: data.seed ?? null,
  };
}
