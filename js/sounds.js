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
}

export const sounds = new SoundManager();
