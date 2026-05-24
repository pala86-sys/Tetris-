/** 自動判斷 WebSocket 位址（本機 / Render 正式環境） */
export function getWsUrl(override = '') {
  const custom = override?.trim();
  if (custom) return custom;

  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const { hostname, host, port, protocol } = location;

  // Render / HTTPS：網頁與 WebSocket 同一個 host（標準 443，不帶 port）
  if (protocol === 'https:' || !port || port === '80' || port === '443') {
    return `${proto}//${host}`;
  }

  // 本機開發：前端若在 3456 等 port，伺服器預設 3001
  if (port !== '3001') {
    return `${proto}//${hostname}:3001`;
  }

  return `${proto}//${host}`;
}

export class NetClient {
  constructor() {
    this.ws = null;
    this.handlers = new Map();
    this.roomId = null;
    this.playerIndex = null;
  }

  connect(url) {
    const wsUrl = url || getWsUrl();
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => resolve();
      this.ws.onerror = () => reject(new Error('無法連線到伺服器'));
      this.ws.onclose = () => this.emit('disconnected', {});

      this.ws.onmessage = (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        this.emit(msg.type, msg);
      };
    });
  }

  on(type, fn) {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type).push(fn);
    return () => {
      const list = this.handlers.get(type);
      const i = list?.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    };
  }

  emit(type, data) {
    for (const fn of this.handlers.get(type) || []) {
      fn(data);
    }
  }

  send(type, payload = {}) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type, ...payload }));
  }

  createRoom() {
    this.send('create');
  }

  joinRoom(roomId) {
    this.send('join', { roomId });
  }

  setReady() {
    this.send('ready');
  }

  sendGame(payload) {
    this.send('game', { payload });
  }

  sendGameOver(reason = 'dead') {
    this.send('gameOver', { reason });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.roomId = null;
    this.playerIndex = null;
  }
}

export const net = new NetClient();
