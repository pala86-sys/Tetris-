/** Which game owns the shared lobby / WebSocket session. */
export let onlineGameType = 'tetris';

export function setOnlineGameType(type) {
  onlineGameType = type;
}
