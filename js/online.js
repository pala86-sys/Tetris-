import { net } from './net.js';
import { MODES } from './game.js';

export class OnlineController {
  constructor({ game, ui, lobby, onReturnMenu }) {
    this.game = game;
    this.ui = ui;
    this.lobby = lobby;
    this.onReturnMenu = onReturnMenu;
    this.unsubs = [];
  }

  init() {
    this.unsubs.push(
      net.on('created', (d) => this.onCreated(d)),
      net.on('joined', (d) => this.onJoined(d)),
      net.on('opponentJoined', () => this.lobby.setStatus('對手已加入！按下「準備」開始')),
      net.on('opponentReady', () => this.lobby.setStatus('對手已準備，請你也按下準備')),
      net.on('gameStart', (d) => this.onGameStart(d)),
      net.on('game', (d) => this.onGameMessage(d)),
      net.on('gameOver', (d) => this.game.handleOpponentGameOver(d.from)),
      net.on('opponentLeft', (d) => this.onOpponentLeft(d)),
      net.on('error', (d) => this.lobby.setError(d.message)),
      net.on('disconnected', () => this.lobby.setError('與伺服器斷線')),
    );
  }

  destroy() {
    this.unsubs.forEach((fn) => fn());
    this.unsubs = [];
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

  onCreated({ roomId, playerIndex }) {
    net.roomId = roomId;
    net.playerIndex = playerIndex;
    this.lobby.showRoom(roomId, 'host');
    this.lobby.setStatus('房間已建立，把代碼分享給朋友');
  }

  onJoined({ roomId, playerIndex }) {
    net.roomId = roomId;
    net.playerIndex = playerIndex;
    this.lobby.showRoom(roomId, 'guest');
    this.lobby.setStatus('已加入房間，按下「準備」');
  }

  onGameStart({ startAt }) {
    this.lobby.hide();
    this.ui.hideGameOver();

    const onlineApi = {
      sendAction: (action) => net.sendGame({ kind: 'action', action }),
      sendState: (player) => net.sendGame({ kind: 'state', state: player.serializeState() }),
      sendLock: (player, result) => {
        net.sendGame({
          kind: 'lock',
          cleared: result.cleared,
          garbageSent: result.garbageSent,
          state: player.serializeState(),
        });
      },
      sendGameOver: (reason) => net.sendGameOver(reason),
      onRematch: () => {
        document.getElementById('ai-difficulty')?.classList.add('hidden');
        if (this.onReturnMenu) this.onReturnMenu();
        else this.ui.showMenu();
        this.lobby.show();
        this.lobby.reset();
      },
    };

    this.game.start(MODES.VERSUS_ONLINE, {
      localPlayerIndex: net.playerIndex,
      online: onlineApi,
      gameStartAt: startAt,
    });
  }

  onGameMessage({ payload }) {
    if (!this.game.running || !payload) return;

    if (payload.kind === 'action') {
      this.game.applyRemoteAction(payload.action);
    } else if (payload.kind === 'state') {
      this.game.applyRemoteState(payload.state);
    } else if (payload.kind === 'lock') {
      this.game.applyRemoteLock(payload);
    }
  }

  onOpponentLeft({ message }) {
    if (this.game.running) {
      this.game.endGame('對戰結束', message || '對手已離開');
    }
    this.lobby.setError(message || '對手已離開');
    this.lobby.show();
  }

  leave() {
    net.disconnect();
    this.game.stop();
    this.lobby.reset();
  }
}
