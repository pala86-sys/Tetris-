export function serializeOthelloState(game) {
  return {
    mode: game.mode,
    board: game.board,
    turn: game.turn,
    winner: game.winner,
    message: game.message,
    lastMove: game.lastMove,
    legalMoves: game.legalMoves,
    score: game.score,
  };
}

export function deserializeOthelloState(data) {
  return {
    mode: data.mode || 'othello',
    board: data.board,
    turn: data.turn,
    winner: data.winner,
    message: data.message,
    lastMove: data.lastMove ?? null,
    legalMoves: data.legalMoves || [],
    score: data.score ?? null,
  };
}
