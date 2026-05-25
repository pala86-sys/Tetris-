import { net } from '../net.js';
import { onlineGameType, setOnlineGameType } from '../online-session.js';
import { BLACK, WHITE } from './constants.js';
import { serializeOthelloState } from './othello-serialize.js';

export class OthelloOnlineController {
  constructor({ othelloApp, ui, lobby, hub, onReturnMenu }) {
    this.othelloApp = othelloApp;
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
        if (onlineGameType !== 'othello') return;
        this.lobby.setStatus('對手已加入！按下「準備」開始');
      }),
      net.on('opponentReady', () => {
        if (onlineGameType !== 'othello') return;
        this.lobby.setStatus('對手已準備，請你也按下準備');
      }),
      net.on('gameStart', (d) => this.onGameStart(d)),
      net.on('game', (d) => this.onGameMessage(d)),
      net.on('opponentLeft', (d) => this.onOpponentLeft(d)),
      net.on('error', (d) => {
        if (onlineGameType !== 'othello') return;
        this.lobby.setError(d.message);
      }),
      net.on('disconnected', () => {
        if (onlineGameType !== 'othello') return;
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
    if (el) el.textContent = '黑白棋 · 建立或加入房間';
  }

  openLobby() {
    setOnlineGameType('othello');
    this.setLobbyLabel();
    this.ui.hideGameOver();
    this.ui.hidePause();
    document.getElementById('ai-difficulty')?.classList.add('hidden');
    document.getElementById('chess-ai-difficulty')?.classList.add('hidden');
    document.getElementById('gomoku-ai-difficulty')?.classList.add('hidden');
    document.getElementById('othello-ai-difficulty')?.classList.add('hidden');
    document.getElementById('hub-screen')?.classList.add('hidden');
    document.getElementById('menu-screen')?.classList.add('hidden');
    document.getElementById('chess-menu-screen')?.classList.add('hidden');
    document.getElementById('chess-game-screen')?.classList.add('hidden');
    document.getElementById('gomoku-menu-screen')?.classList.add('hidden');
    document.getElementById('gomoku-game-screen')?.classList.add('hidden');
    document.getElementById('othello-menu-screen')?.classList.add('hidden');
    document.getElementById('othello-game-screen')?.classList.add('hidden');
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
    this.othelloApp.stop();
    this.lobby.reset();
  }

  onCreated({ roomId, playerIndex }) {
    if (onlineGameType !== 'othello') return;
    net.roomId = roomId;
    net.playerIndex = playerIndex;
    this.lobby.showRoom(roomId, 'host');
    this.lobby.setStatus('房間已建立，把代碼分享給朋友');
  }

  onJoined({ roomId, playerIndex }) {
    if (onlineGameType !== 'othello') return;
    net.roomId = roomId;
    net.playerIndex = playerIndex;
    this.lobby.showRoom(roomId, 'guest');
    this.lobby.setStatus('已加入房間，按下「準備」');
  }

  onGameStart() {
    if (onlineGameType !== 'othello') return;

    this.lobby.hide();
    this.ui.hideGameOver();
    this.hub.show('othelloGame');

    const isHost = net.playerIndex === 0;
    const localColor = isHost ? BLACK : WHITE;

    const onlineApi = {
      sendState: (state) => net.sendGame({ kind: 'othello-state', state }),
      sendGameOver: (reason) => net.sendGameOver(reason),
    };

    if (isHost) {
      this.othelloApp.start({
        playMode: 'online',
        localColor,
        online: onlineApi,
      });
      net.sendGame({ kind: 'othello-state', state: serializeOthelloState(this.othelloApp.game) });
    } else {
      this.othelloApp.waitForOnlineInit(localColor);
    }
  }

  onGameMessage({ payload, from }) {
    if (onlineGameType !== 'othello' || !payload) return;
    if (payload.kind !== 'othello-state' || !payload.state) return;
    if (from === net.playerIndex) return;

    if (this.othelloApp.waitingOnlineInit) {
      this.othelloApp.start({
        playMode: 'online',
        localColor: net.playerIndex === 0 ? BLACK : WHITE,
        online: {
          sendState: (s) => net.sendGame({ kind: 'othello-state', state: s }),
          sendGameOver: (r) => net.sendGameOver(r),
        },
      });
    }
    this.othelloApp.applyRemoteState(payload.state);
  }

  onOpponentLeft({ message }) {
    if (onlineGameType !== 'othello') return;
    this.othelloApp.handleOpponentLeft(message || '對手已離開');
    this.lobby.setError(message || '對手已離開');
    this.lobby.show();
  }
}
