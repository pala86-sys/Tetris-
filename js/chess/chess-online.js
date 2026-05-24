import { net } from '../net.js';
import { onlineGameType, setOnlineGameType } from '../online-session.js';
import { RED, BLACK } from './constants.js';
import { serializeChessState } from './chess-serialize.js';

export class ChessOnlineController {
  constructor({ chessApp, ui, lobby, hub, onReturnMenu }) {
    this.chessApp = chessApp;
    this.ui = ui;
    this.lobby = lobby;
    this.hub = hub;
    this.onReturnMenu = onReturnMenu;
    this.pendingVariant = 'xiangqi';
    this.unsubs = [];
  }

  init() {
    this.unsubs.push(
      net.on('created', (d) => this.onCreated(d)),
      net.on('joined', (d) => this.onJoined(d)),
      net.on('opponentJoined', () => {
        if (onlineGameType !== 'chess') return;
        this.lobby.setStatus('對手已加入！按下「準備」開始');
      }),
      net.on('opponentReady', () => {
        if (onlineGameType !== 'chess') return;
        this.lobby.setStatus('對手已準備，請你也按下準備');
      }),
      net.on('gameStart', (d) => this.onGameStart(d)),
      net.on('game', (d) => this.onGameMessage(d)),
      net.on('opponentLeft', (d) => this.onOpponentLeft(d)),
      net.on('error', (d) => {
        if (onlineGameType !== 'chess') return;
        this.lobby.setError(d.message);
      }),
      net.on('disconnected', () => {
        if (onlineGameType !== 'chess') return;
        this.lobby.setError('與伺服器斷線');
      }),
    );
  }

  destroy() {
    this.unsubs.forEach((fn) => fn());
    this.unsubs = [];
  }

  setLobbyLabel(variant) {
    const el = document.getElementById('lobby-game-label');
    if (!el) return;
    const name = variant === 'dark' ? '暗棋' : '一般象棋';
    el.textContent = `象棋 · ${name}`;
  }

  openLobby(variant) {
    setOnlineGameType('chess');
    this.pendingVariant = variant;
    this.setLobbyLabel(variant);
    this.ui.hideGameOver();
    this.ui.hidePause();
    document.getElementById('ai-difficulty')?.classList.add('hidden');
    document.getElementById('chess-ai-difficulty')?.classList.add('hidden');
    document.getElementById('hub-screen')?.classList.add('hidden');
    document.getElementById('menu-screen')?.classList.add('hidden');
    document.getElementById('chess-menu-screen')?.classList.add('hidden');
    document.getElementById('chess-game-screen')?.classList.add('hidden');
    this.ui.elements.lobbyScreen.classList.remove('hidden');
    this.ui.showScreen(this.ui.elements.lobbyScreen);
    this.lobby.show();
    this.lobby.showCreate();
  }

  async connect() {
    const url = this.lobby.getServerUrl();
    await net.connect(url);
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
    this.chessApp.stop();
    this.lobby.reset();
    this.setLobbyLabel(this.pendingVariant);
  }

  onCreated({ roomId, playerIndex }) {
    if (onlineGameType !== 'chess') return;
    net.roomId = roomId;
    net.playerIndex = playerIndex;
    this.lobby.showRoom(roomId, 'host');
    this.lobby.setStatus('房間已建立，把代碼分享給朋友');
  }

  onJoined({ roomId, playerIndex }) {
    if (onlineGameType !== 'chess') return;
    net.roomId = roomId;
    net.playerIndex = playerIndex;
    this.lobby.showRoom(roomId, 'guest');
    this.lobby.setStatus('已加入房間，按下「準備」');
  }

  onGameStart() {
    if (onlineGameType !== 'chess') return;

    this.lobby.hide();
    this.ui.hideGameOver();
    this.hub.show('chessGame');

    const isHost = net.playerIndex === 0;
    const localColor = isHost ? RED : BLACK;
    const variant = this.pendingVariant;
    const seed = variant === 'dark' ? (Date.now() & 0xffffffff) : null;

    const onlineApi = {
      sendState: (state) => net.sendGame({ kind: 'chess-state', state }),
      sendGameOver: (reason) => net.sendGameOver(reason),
      sendInit: (payload) => net.sendGame({ kind: 'chess-init', ...payload }),
    };

    if (isHost) {
      this.chessApp.start({
        variant,
        playMode: 'online',
        localColor,
        seed,
        online: onlineApi,
      });
      onlineApi.sendInit({ variant, seed: variant === 'dark' ? seed : null });
    } else {
      this.chessApp.waitForOnlineInit(localColor);
    }
  }

  onGameMessage({ payload, from }) {
    if (onlineGameType !== 'chess' || !payload) return;

    if (payload.kind === 'chess-init') {
      this.chessApp.beginOnlineAsGuest({
        variant: payload.variant,
        seed: payload.seed,
        localColor: net.playerIndex === 0 ? RED : BLACK,
      });
      return;
    }

    if (payload.kind === 'chess-state') {
      if (from === net.playerIndex) return;
      this.chessApp.applyRemoteState(payload.state);
      return;
    }

    if (payload.kind === 'chess-click') {
      if (from === net.playerIndex) return;
      this.chessApp.applyRemoteClick(payload.r, payload.c);
    }
  }

  onOpponentLeft({ message }) {
    if (onlineGameType !== 'chess') return;
    this.chessApp.handleOpponentLeft(message || '對手已離開');
    this.lobby.setError(message || '對手已離開');
    this.lobby.show();
  }
}
