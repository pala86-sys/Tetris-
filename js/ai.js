import { AI_CONFIG } from './constants.js';
import { COLS, TOTAL_ROWS } from './constants.js';
import { isValidPosition, lockPiece, clearLines } from './board.js';
import { getShape } from './pieces.js';

export class TetrisAI {
  constructor(difficulty = 'normal') {
    this.config = AI_CONFIG[difficulty] || AI_CONFIG.normal;
    this.thinkTimer = 0;
    this.actionTimer = 0;
    this.plan = null;
    this.stuckSteps = 0;
  }

  setDifficulty(difficulty) {
    this.config = AI_CONFIG[difficulty] || AI_CONFIG.normal;
  }

  update(player, dt) {
    if (!player.alive || !player.active) return null;

    if (!this.plan) {
      this.thinkTimer += dt;
      if (this.thinkTimer < this.config.thinkDelay) return null;

      this.thinkTimer = 0;
      this.stuckSteps = 0;
      this.plan = this.findBestMove(player.board, player.active, player.queue[0]);

      if (Math.random() < this.config.mistakeRate) {
        const bad = this.randomMove(player.board, player.active);
        if (bad) this.plan = bad;
      }
      this.actionTimer = 0;
    }

    this.actionTimer += dt;
    if (this.actionTimer < this.config.actionDelay) return null;
    this.actionTimer = 0;

    return this.executePlan(player);
  }

  executePlan(player) {
    const piece = player.active;
    if (!this.plan || !piece) return null;

    const { rotation: targetRot, x: targetX } = this.plan;
    const before = `${piece.rotation},${piece.x}`;

    if (piece.rotation !== targetRot) {
      const ok = this.rotateToward(player, targetRot);
      if (!ok || `${piece.rotation},${piece.x}` === before) {
        this.stuckSteps++;
        if (this.stuckSteps >= 4) {
          this.plan = null;
          this.stuckSteps = 0;
        }
      } else {
        this.stuckSteps = 0;
      }
      return null;
    }

    this.stuckSteps = 0;

    if (piece.x < targetX) {
      if (!player.move(1, 0)) this.nudgeOrReplan();
      return null;
    }
    if (piece.x > targetX) {
      if (!player.move(-1, 0)) this.nudgeOrReplan();
      return null;
    }

    const result = player.hardDrop();
    this.plan = null;
    this.thinkTimer = 0;
    return result;
  }

  rotateToward(player, targetRot) {
    const piece = player.active;
    if (!piece || piece.rotation === targetRot) return true;

    const cur = piece.rotation;
    const cwSteps = (targetRot - cur + 4) % 4;
    const ccwSteps = (cur - targetRot + 4) % 4;
    const dirs = ccwSteps < cwSteps ? [-1, 1] : [1, -1];

    for (const dir of dirs) {
      if (player.rotate(dir)) return true;
    }

    // 旋轉被擋時先微調位置再試
    if (player.move(-1, 0) || player.move(1, 0)) return true;
    for (const dir of dirs) {
      if (player.rotate(dir)) return true;
    }
    return false;
  }

  nudgeOrReplan() {
    this.stuckSteps++;
    if (this.stuckSteps >= 3) {
      this.plan = null;
      this.stuckSteps = 0;
    }
  }

  /** 枚舉所有合法 (旋轉, 落點 x) */
  getValidPlacements(board, piece) {
    const placements = [];
    const type = piece.type;

    for (let rot = 0; rot < 4; rot++) {
      for (let x = -2; x < COLS; x++) {
        const test = { type, rotation: rot, x, y: 0 };
        if (!isValidPosition(board, test)) continue;

        let sim = { ...test };
        while (isValidPosition(board, sim, 0, 1)) {
          sim.y++;
        }

        placements.push({ rotation: rot, x: sim.x });
      }
    }
    return placements;
  }

  randomMove(board, piece) {
    const valid = this.getValidPlacements(board, piece);
    if (valid.length === 0) return null;
    return valid[Math.floor(Math.random() * valid.length)];
  }

  findBestMove(board, piece, nextType) {
    const placements = this.getValidPlacements(board, piece);
    if (placements.length === 0) {
      return { rotation: piece.rotation, x: piece.x };
    }

    let best = placements[0];
    let bestScore = -Infinity;

    for (const placement of placements) {
      const sim = {
        type: piece.type,
        rotation: placement.rotation,
        x: placement.x,
        y: 0,
      };
      let dropped = { ...sim };
      while (isValidPosition(board, dropped, 0, 1)) {
        dropped.y++;
      }

      const score = this.evaluatePlacement(
        board,
        dropped,
        nextType,
        this.config.lookaheadWeight,
      );
      if (score > bestScore) {
        bestScore = score;
        best = placement;
      }
    }

    return best;
  }

  evaluatePlacement(board, piece, nextType, lookaheadWeight = 0.35) {
    let simBoard = lockPiece(board, piece);
    const { board: clearedBoard, cleared } = clearLines(simBoard);
    simBoard = clearedBoard;

    const heights = this.getColumnHeights(simBoard);
    const aggregateHeight = heights.reduce((a, b) => a + b, 0);
    const maxHeight = Math.max(...heights);
    const holes = this.countHoles(simBoard);
    const bumpiness = this.getBumpiness(heights);
    const rowTransitions = this.getRowTransitions(simBoard);
    const colTransitions = this.getColTransitions(simBoard);

    // Dellacherie 風格啟發式（權重加大，避免堆太高、留洞）
    let score =
      cleared * 5000 -
      aggregateHeight * 0.65 -
      maxHeight * 1.2 -
      holes * 38 -
      bumpiness * 0.2 -
      rowTransitions * 0.1 -
      colTransitions * 0.1;

    if (cleared === 0 && maxHeight > 14) score -= 500;
    if (holes > 4) score -= holes * 20;

    if (nextType && lookaheadWeight > 0) {
      score += this.lookaheadBonus(simBoard, nextType) * lookaheadWeight;
    }

    return score;
  }

  lookaheadBonus(board, nextType) {
    const piece = { type: nextType, rotation: 0, x: 3, y: 0 };
    const placements = this.getValidPlacements(board, piece);
    if (placements.length === 0) return -200;

    let best = -Infinity;
    for (const { rotation, x } of placements) {
      const dropped = { type: nextType, rotation, x, y: 0 };
      let sim = { ...dropped };
      while (isValidPosition(board, sim, 0, 1)) sim.y++;
      const s = this.evaluatePlacement(board, sim, null, 0);
      if (s > best) best = s;
    }
    return best;
  }

  getRowTransitions(board) {
    let transitions = 0;
    for (let y = 0; y < TOTAL_ROWS; y++) {
      let prev = 1;
      for (let x = 0; x < COLS; x++) {
        const cur = board[y][x] ? 1 : 0;
        if (cur !== prev) transitions++;
        prev = cur;
      }
      if (prev === 0) transitions++;
    }
    return transitions;
  }

  getColTransitions(board) {
    let transitions = 0;
    for (let x = 0; x < COLS; x++) {
      let prev = 1;
      for (let y = 0; y < TOTAL_ROWS; y++) {
        const cur = board[y][x] ? 1 : 0;
        if (cur !== prev) transitions++;
        prev = cur;
      }
      if (prev === 0) transitions++;
    }
    return transitions;
  }

  getColumnHeights(board) {
    const heights = Array(COLS).fill(0);
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < TOTAL_ROWS; y++) {
        if (board[y][x]) {
          heights[x] = TOTAL_ROWS - y;
          break;
        }
      }
    }
    return heights;
  }

  countHoles(board) {
    let holes = 0;
    for (let x = 0; x < COLS; x++) {
      let blockFound = false;
      for (let y = 0; y < TOTAL_ROWS; y++) {
        if (board[y][x]) blockFound = true;
        else if (blockFound) holes++;
      }
    }
    return holes;
  }

  getBumpiness(heights) {
    let bump = 0;
    for (let i = 0; i < heights.length - 1; i++) {
      bump += Math.abs(heights[i] - heights[i + 1]);
    }
    return bump;
  }

  reset() {
    this.plan = null;
    this.thinkTimer = 0;
    this.actionTimer = 0;
    this.stuckSteps = 0;
  }
}
