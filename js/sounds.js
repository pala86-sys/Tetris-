/**
 * 使用 Web Audio API 產生音效（無需外部音檔）
 */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.unlocked = false;
  }

  unlock() {
    if (this.unlocked) return;
    try {
      const ctx = this.ensureContext();
      if (ctx.state === 'suspended') ctx.resume();
      // 無聲觸發，滿足瀏覽器「需使用者互動才能播音」
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0;
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.01);
      this.unlocked = true;
    } catch {
      // 略過不支援的環境
    }
  }

  ensureContext() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) throw new Error('Web Audio not supported');
      this.ctx = new Ctx();
    }
    return this.ctx;
  }

  /**
   * @param {number} lines 1–4 消除行數
   */
  playLineClear(lines) {
    if (!this.enabled || lines < 1) return;

    try {
      const ctx = this.ensureContext();
      if (ctx.state === 'suspended') ctx.resume();

      const count = Math.min(lines, 4);
      const melodies = {
        1: [{ f: 392, d: 0.1, w: 0.12 }],
        2: [
          { f: 392, d: 0.08, w: 0.1 },
          { f: 523, d: 0.12, w: 0.14 },
        ],
        3: [
          { f: 392, d: 0.07, w: 0.09 },
          { f: 523, d: 0.07, w: 0.1 },
          { f: 659, d: 0.12, w: 0.14 },
        ],
        4: [
          { f: 523, d: 0.06, w: 0.1 },
          { f: 659, d: 0.06, w: 0.1 },
          { f: 784, d: 0.06, w: 0.1 },
          { f: 1047, d: 0.18, w: 0.2 },
        ],
      };

      const notes = melodies[count];
      let t = ctx.currentTime + 0.02;
      const type = count === 4 ? 'square' : 'triangle';

      for (const note of notes) {
        this.playTone(ctx, note.f, note.d, t, note.w, type);
        t += note.d * 0.85;
      }
    } catch {
      // 靜默失敗
    }
  }

  playTone(ctx, freq, duration, startTime, peakGain, type = 'triangle') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  /** 象棋／五子棋／黑白棋：落子 */
  playBoardPlace() {
    if (!this.enabled) return;
    try {
      const ctx = this.ensureContext();
      if (ctx.state === 'suspended') ctx.resume();
      const t = ctx.currentTime + 0.01;
      this.playTone(ctx, 520, 0.05, t, 0.09, 'sine');
      this.playTone(ctx, 780, 0.04, t + 0.03, 0.06, 'triangle');
    } catch {
      // 略過
    }
  }

  /** 吃子、翻棋、黑白棋翻轉等多格變化 */
  playBoardCapture(flips = 1) {
    if (!this.enabled) return;
    try {
      const ctx = this.ensureContext();
      if (ctx.state === 'suspended') ctx.resume();
      const t = ctx.currentTime + 0.01;
      const n = Math.min(Math.max(flips, 1), 8);
      this.playTone(ctx, 220, 0.07, t, 0.11, 'triangle');
      this.playTone(ctx, 165 + n * 12, 0.09, t + 0.05, 0.1, 'sine');
      if (n >= 3) {
        this.playTone(ctx, 330, 0.06, t + 0.1, 0.07, 'triangle');
      }
    } catch {
      // 略過
    }
  }

  /** 暗棋翻開棋子 */
  playBoardFlip() {
    if (!this.enabled) return;
    try {
      const ctx = this.ensureContext();
      if (ctx.state === 'suspended') ctx.resume();
      const t = ctx.currentTime + 0.01;
      this.playTone(ctx, 660, 0.06, t, 0.08, 'sine');
      this.playTone(ctx, 880, 0.04, t + 0.04, 0.05, 'triangle');
    } catch {
      // 略過
    }
  }
}

/** 比對棋盤是否有變化（用於判斷是否成功落子） */
export function boardChanged(before, after) {
  if (!before || !after || before.length !== after.length) return true;
  for (let r = 0; r < before.length; r++) {
    for (let c = 0; c < before[r].length; c++) {
      const a = before[r][c];
      const b = after[r][c];
      if (a === b) continue;
      if (!a || !b) return true;
      if (JSON.stringify(a) !== JSON.stringify(b)) return true;
    }
  }
  return false;
}

export const sounds = new SoundManager();
