import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3001;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

/** @type {Map<string, { id: string, host: import('ws').WebSocket, guest: import('ws').WebSocket | null }>} */
const rooms = new Map();

/** @type {WeakMap<import('ws').WebSocket, { roomId: string, playerIndex: number }>} */
const socketMeta = new WeakMap();

function createRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(id) ? createRoomId() : id;
}

function send(ws, type, payload = {}) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type, ...payload }));
  }
}

function broadcastRoom(room, type, payload, except = null) {
  for (const peer of [room.host, room.guest]) {
    if (peer && peer !== except && peer.readyState === peer.OPEN) {
      send(peer, type, payload);
    }
  }
}

function getRoom(ws) {
  const meta = socketMeta.get(ws);
  if (!meta) return null;
  return rooms.get(meta.roomId) || null;
}

function cleanupSocket(ws) {
  const meta = socketMeta.get(ws);
  if (!meta) return;
  const room = rooms.get(meta.roomId);
  if (!room) return;

  const other = ws === room.host ? room.guest : room.host;
  if (other && other.readyState === other.OPEN) {
    send(other, 'opponentLeft', { message: '對手已離開對戰' });
  }

  rooms.delete(meta.roomId);
  socketMeta.delete(ws);
}

const httpServer = createServer(async (req, res) => {
  try {
    let urlPath = req.url?.split('?')[0] || '/';
    if (urlPath === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = join(ROOT, urlPath);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    const data = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, 'error', { message: '無效的訊息格式' });
      return;
    }

    switch (msg.type) {
      case 'create': {
        const roomId = createRoomId();
        rooms.set(roomId, { id: roomId, host: ws, guest: null });
        socketMeta.set(ws, { roomId, playerIndex: 0 });
        send(ws, 'created', { roomId, playerIndex: 0 });
        break;
      }

      case 'join': {
        const roomId = String(msg.roomId || '').toUpperCase().trim();
        const room = rooms.get(roomId);
        if (!room) {
          send(ws, 'error', { message: '找不到房間，請確認房間代碼' });
          return;
        }
        if (room.guest) {
          send(ws, 'error', { message: '房間已滿' });
          return;
        }
        room.guest = ws;
        socketMeta.set(ws, { roomId, playerIndex: 1 });
        send(ws, 'joined', { roomId, playerIndex: 1 });
        send(room.host, 'opponentJoined', { message: '對手已加入！' });
        break;
      }

      case 'ready': {
        const room = getRoom(ws);
        if (!room || !room.guest) {
          send(ws, 'error', { message: '尚無對手加入' });
          return;
        }
        room.ready = room.ready || new Set();
        room.ready.add(ws);
        if (room.ready.size >= 2) {
          const startAt = Date.now() + 3500;
          broadcastRoom(room, 'gameStart', { startAt });
          room.ready.clear();
        } else {
          broadcastRoom(room, 'opponentReady', {}, ws);
        }
        break;
      }

      case 'game': {
        const room = getRoom(ws);
        const meta = socketMeta.get(ws);
        if (!room || !meta) return;
        const target = ws === room.host ? room.guest : room.host;
        if (target?.readyState === target.OPEN) {
          send(target, 'game', { from: meta.playerIndex, payload: msg.payload });
        }
        break;
      }

      case 'gameOver': {
        const room = getRoom(ws);
        const meta = socketMeta.get(ws);
        if (!room || !meta) return;
        const target = ws === room.host ? room.guest : room.host;
        if (target?.readyState === target.OPEN) {
          send(target, 'gameOver', { from: meta.playerIndex, reason: msg.reason });
        }
        break;
      }

      default:
        send(ws, 'error', { message: '未知的訊息類型' });
    }
  });

  ws.on('close', () => cleanupSocket(ws));
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Tetris server listening on port ${PORT}`);
});
