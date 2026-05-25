import { net } from '../net.js';
import { onlineGameType, setOnlineGameType } from '../online-session.js';
import { BLACK, WHITE } from './constants.js';
import { serializeGomokuState } from './gomoku-serialize.js';

export class GomokuOnlineController {
  constructor({ gomokuApp, ui, lobby, hub, onReturnMenu }) {
    this.gomokuApp = gomokuApp;
    this.ui = ui;
    this.lobby = lobby;
    this.hub = hub;
    this.onReturnMenu = onReturnMenu;
    this.unsubs = [];
  }

  init() {
    this.unsubs.push(
      net.on('created', (d) => this.onCreated(d)),
      net.on('joined', (d) => this.onJoined(d)),
      net.on('opponentJoined', () => {
        if (onlineGameType !== 'gomoku') return;
        this.lobby.setStatus('對手已加入！按下「準備」開始');
      }),
      net.on('opponentReady', () => {
        if (onlineGameType !== 'gomoku') return;
        this.lobby.setStatus('對手已準備，請你也按下準備');
      }),
      net.on('gameStart', (d) => this.onGameStart(d)),
      net.on('game', (d) => this.onGameMessage(d)),
      net.on('opponentLeft', (d) => this.onOpponentLeft(d)),
      net.on('error', (d) => {
        if (onlineGameType !== 'gomoku') return;
        this.lobby.setError(d.message);
      }),
      net.on('disconnected', () => {
        if (onlineGameType !== 'gomoku') return;
        this.lobby.setError('與伺服器斷線');
      }),
    );
  }

  destroy() {
    this.unsubs.forEach((fn) => fn());
    this.unsubs = [];
  }

  setLobbyLabel() {
    const el = document.getElementById('lobby-game-label');
    if (el) el.textContent = '五子棋 · 建立或加入房間';
  }

  openLobby() {
    setOnlineGameType('gomoku');
    this.setLobbyLabel();
    this.ui.hideGameOver();
    this.ui.hidePause();
    document.getElementById('ai-difficulty')?.classList.add('hidden');
    document.getElementById('chess-ai-difficulty')?.classList.add('hidden');
    document.getElementById('gomoku-ai-difficulty')?.classList.add('hidden');
    document.getElementById('hub-screen')?.classList.add('hidden');
    document.getElementById('menu-screen')?.classList.add('hidden');
    document.getElementById('chess-menu-screen')?.classList.add('hidden');
    document.getElementById('chess-game-screen')?.classList.add('hidden');
    document.getElementById('gomoku-menu-screen')?.classList.add('hidden');
    document.getElementById('gomoku-game-screen')?.classList.add('hidden');
    this.ui.elements.lobbyScreen.classList.remove('hidden');
    this.ui.showScreen(this.ui.elements.lobbyScreen);
    this.lobby.show();
    this.lobby.showCreate();
  }

  async connect() {
    await net.connect(this.lobby.getServerUrl());
  }

  async createRoom() {
    await this.connect();
    net.createRoom();
  }

  async joinRoom(roomId) {
    await this.connect();
    net.joinRoom(roomId);
  }

  ready() {
    net.setReady();
    this.lobby.setStatus('已準備，等待對手…');
  }

  leave() {
    net.disconnect();
    this.gomokuApp.stop();
    this.lobby.reset();
  }

  onCreated({ roomId, playerIndex }) {
    if (onlineGameType !== 'gomoku') return;
    net.roomId = roomId;
    net.playerIndex = playerIndex;
    this.lobby.showRoom(roomId, 'host');
    this.lobby.setStatus('房間已建立，把代碼分享給朋友');
  }

  onJoined({ roomId, playerIndex }) {
    if (onlineGameType !== 'gomoku') return;
    net.roomId = roomId;
    net.playerIndex = playerIndex;
    this.lobby.showRoom(roomId, 'guest');
    this.lobby.setStatus('已加入房間，按下「準備」');
  }

  onGameStart() {
    if (onlineGameType !== 'gomoku') return;

    this.lobby.hide();
    this.ui.hideGameOver();
    this.hub.show('gomokuGame');

    const isHost = net.playerIndex === 0;
    const localColor = isHost ? BLACK : WHITE;

    const onlineApi = {
      sendState: (state) => net.sendGame({ kind: 'gomoku-state', state }),
      sendGameOver: (reason) => net.sendGameOver(reason),
    };

    if (isHost) {
      this.gomokuApp.start({
        playMode: 'online',
        localColor,
        online: onlineApi,
      });
      net.sendGame({ kind: 'gomoku-state', state: serializeGomokuState(this.gomokuApp.game) });
    } else {
      this.gomokuApp.waitForOnlineInit(localColor);
    }
  }

  onGameMessage({ payload, from }) {
    if (onlineGameType !== 'gomoku' || !payload) return;
    if (payload.kind !== 'gomoku-state' || !payload.state) return;
    if (from === net.playerIndex) return;

    if (this.gomokuApp.waitingOnlineInit) {
      this.gomokuApp.start({
        playMode: 'online',
        localColor: net.playerIndex === 0 ? BLACK : WHITE,
        online: {
          sendState: (s) => net.sendGame({ kind: 'gomoku-state', state: s }),
          sendGameOver: (r) => net.sendGameOver(r),
        },
      });
    }
    this.gomokuApp.applyRemoteState(payload.state);
  }

  onOpponentLeft({ message }) {
    if (onlineGameType !== 'gomoku') return;
    this.gomokuApp.handleOpponentLeft(message || '對手已離開');
    this.lobby.setError(message || '對手已離開');
    this.lobby.show();
  }
}
