import {
  SCORE_TABLE,
  GARBAGE_LINES,
  LEVEL_SPEED,
  SOFT_DROP_INTERVAL,
} from './constants.js';
import {
  createBoard,
  isValidPosition,
  lockPiece,
  clearLines,
  addGarbage,
  getGhostY,
  isGameOver,
} from './board.js';
import { createPiece, randomBag, rotatePiece } from './pieces.js';

export class Player {
  constructor(id = 0) {
    this.id = id;
    this.isLocal = true;
    this.reset();
  }

  reset() {
    this.board = createBoard();
    this.bag = [];
    this.queue = [];
    this.active = null;
    this.hold = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.alive = true;
    this.dropTimer = 0;
    this.dropInterval = LEVEL_SPEED[0];
    this.softDropping = false;
    this.pendingGarbage = 0;
    this.refillQueue();
    this.spawn();
  }

  refillQueue() {
    while (this.queue.length < 5) {
      if (this.bag.length === 0) this.bag = randomBag();
      this.queue.push(this.bag.shift());
    }
  }

  spawn() {
    if (this.pendingGarbage > 0) {
      const hole = Math.floor(Math.random() * 10);
      this.board = addGarbage(this.board, this.pendingGarbage, hole);
      this.pendingGarbage = 0;
      if (isGameOver(this.board)) {
        this.alive = false;
        return false;
      }
    }

    const type = this.queue.shift();
    this.refillQueue();
    this.active = createPiece(type);
    this.canHold = true;

    if (!isValidPosition(this.board, this.active)) {
      this.alive = false;
      return false;
    }
    return true;
  }

  get ghostY() {
    if (!this.active) return null;
    return getGhostY(this.board, this.active);
  }

  move(dx, dy) {
    if (!this.active || !this.alive) return false;
    if (isValidPosition(this.board, this.active, dx, dy)) {
      this.active.x += dx;
      this.active.y += dy;
      return true;
    }
    return false;
  }

  rotate(dir = 1) {
    if (!this.active || !this.alive) return false;
    const rotated = rotatePiece(this.active, dir);
    const kicks = [
      [0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0],
    ];
    for (const [kx, ky] of kicks) {
      const test = { ...rotated, x: rotated.x + kx, y: rotated.y + ky };
      if (isValidPosition(this.board, test)) {
        this.active = test;
        return true;
      }
    }
    return false;
  }

  setSoftDrop(active) {
    this.softDropping = active;
    if (active) this.dropTimer = this.softDropInterval;
  }

  get softDropInterval() {
    return SOFT_DROP_INTERVAL;
  }

  softDrop() {
    if (!this.active || !this.alive) return null;
    if (this.move(0, 1)) {
      this.score += 1;
      return true;
    }
    return this.lock();
  }

  hardDrop() {
    if (!this.active || !this.alive) return null;
    let dist = 0;
    while (this.move(0, 1)) dist++;
    this.score += dist * 2;
    return this.lock();
  }

  hold() {
    if (!this.active || !this.alive || !this.canHold) return false;
    this.canHold = false;
    const current = this.active.type;
    if (this.hold) {
      this.active = createPiece(this.hold);
      this.hold = current;
    } else {
      this.hold = current;
      this.active = null;
      return this.spawn();
    }
    if (!isValidPosition(this.board, this.active)) {
      this.alive = false;
    }
    return true;
  }

  lock() {
    if (!this.active) return null;

    this.board = lockPiece(this.board, this.active);
    this.active = null;

    const { board, cleared } = clearLines(this.board);
    this.board = board;

    let garbageSent = 0;
    if (cleared > 0) {
      this.lines += cleared;
      this.score += SCORE_TABLE[cleared] * this.level;
      garbageSent = GARBAGE_LINES[cleared] || 0;

      if (!this.isVersus) {
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel !== this.level) {
          this.level = Math.min(newLevel, LEVEL_SPEED.length);
          this.dropInterval = LEVEL_SPEED[this.level - 1];
        }
      }
    }

    const spawned = this.spawn();
    return { cleared, garbageSent, spawned };
  }

  receiveGarbage(lines) {
    this.pendingGarbage += lines;
  }

  update(dt) {
    if (!this.alive || !this.active) return null;
    const interval = this.softDropping ? this.softDropInterval : this.dropInterval;
    this.dropTimer += dt;
    if (this.dropTimer >= interval) {
      this.dropTimer -= interval;
      if (this.softDropping) {
        if (this.move(0, 1)) {
          this.score += 1;
          return null;
        }
        this.softDropping = false;
        return this.lock();
      }
      if (!this.move(0, 1)) {
        return this.lock();
      }
    }
    return null;
  }

  setSpeed(interval) {
    this.dropInterval = interval;
  }

  serializeState() {
    return {
      board: this.board.map((row) => [...row]),
      active: this.active ? { ...this.active } : null,
      hold: this.hold,
      queue: [...this.queue],
      score: this.score,
      lines: this.lines,
      alive: this.alive,
      softDropping: this.softDropping,
    };
  }

  applyNetworkState(data) {
    if (!data) return;
    this.board = data.board.map((row) => [...row]);
    this.active = data.active ? { ...data.active } : null;
    this.hold = data.hold ?? null;
    this.queue = [...(data.queue || [])];
    this.score = data.score ?? 0;
    this.lines = data.lines ?? 0;
    this.alive = data.alive !== false;
    this.softDropping = !!data.softDropping;
  }

  applyRemoteInput(action) {
    if (!this.alive) return null;
    switch (action) {
      case 'left': this.move(-1, 0); break;
      case 'right': this.move(1, 0); break;
      case 'rotate': this.rotate(1); break;
      case 'rotateCCW': this.rotate(-1); break;
      case 'softDrop': return this.softDrop();
      case 'hardDrop': return this.hardDrop();
      case 'hold': this.hold(); break;
      case 'softDropStart': this.setSoftDrop(true); break;
      case 'softDropEnd': this.setSoftDrop(false); break;
      default: break;
    }
    return null;
  }
}
