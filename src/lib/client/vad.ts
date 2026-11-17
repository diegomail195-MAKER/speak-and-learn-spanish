// Energy-based voice activity detector with an adaptive noise floor.
// Works on 20 ms frames. Tuned for children in a classroom: quick onset, generous hangover
// (kids pause mid-answer), and a minimum speech length so a cough or desk bump is ignored.
// The noise floor is a low percentile of the last few seconds, so the app's own voice (heard
// through the speakers while the question is read) can't raise it: before, the floor learned
// that voice and students had to shout right after each question.

export interface VadConfig {
  frameMs: number;
  onsetFrames: number; // consecutive loud frames to start
  hangoverMs: number; // silence that ends an utterance
  minSpeechMs: number; // shorter bursts are discarded as noise
  maxUtteranceMs: number;
  preRollMs: number; // audio kept from before onset so the first syllable isn't cut
  marginDb: number; // how far above the noise floor counts as speech
  absoluteMinDb: number; // never treat anything quieter than this as speech
}

export const DEFAULT_VAD: VadConfig = {
  frameMs: 20,
  onsetFrames: 2,
  hangoverMs: 900,
  minSpeechMs: 160,
  maxUtteranceMs: 8000,
  preRollMs: 500,
  marginDb: 9,
  absoluteMinDb: -56,
};

/** Frames of history for the noise floor (4 s) and the percentile used. */
const FLOOR_FRAMES = 200;
const FLOOR_PERCENTILE = 0.15;

export type VadEvent =
  | { type: "speech-start" }
  | { type: "speech-end"; samples: Float32Array; speechMs: number; peakDb: number }
  | { type: "noise" };

export const rmsDb = (f: Float32Array) => {
  let s = 0;
  for (let i = 0; i < f.length; i++) s += f[i] * f[i];
  return 10 * Math.log10(s / f.length + 1e-12);
};

export class Vad {
  noiseDb = -60;
  private speaking = false;
  private loudRun = 0;
  private silentMs = 0;
  private speechMs = 0;
  private peakDb = -100;
  private pre: Float32Array[] = [];
  private cur: Float32Array[] = [];
  private history: number[] = [];

  constructor(private cfg: VadConfig = DEFAULT_VAD) {}

  get threshold() {
    return Math.max(this.noiseDb + this.cfg.marginDb, this.cfg.absoluteMinDb);
  }

  reset() {
    this.speaking = false;
    this.loudRun = 0;
    this.silentMs = 0;
    this.speechMs = 0;
    this.peakDb = -100;
    this.pre = [];
    this.cur = [];
  }

  /** Feed one frame. Only returns events while `armed`; otherwise just learns the noise floor. */
  push(frame: Float32Array, armed: boolean): VadEvent | null {
    const db = rmsDb(frame);
    const loud = db > this.threshold;
    this.history.push(db);
    if (this.history.length > FLOOR_FRAMES) this.history.shift();
    if (this.history.length >= 10) {
      // A low percentile follows the quiet moments between words: steady room noise is learned in
      // a few seconds, while speech (the student's or the app's) barely moves it.
      const sorted = [...this.history].sort((a, b) => a - b);
      this.noiseDb = Math.min(-25, sorted[Math.floor(sorted.length * FLOOR_PERCENTILE)]);
    }
    if (!armed) {
      this.reset();
      return null;
    }
    const f = this.cfg.frameMs;
    if (!this.speaking) {
      this.pre.push(frame);
      const maxPre = Math.ceil(this.cfg.preRollMs / f);
      if (this.pre.length > maxPre) this.pre.shift();
      this.loudRun = loud ? this.loudRun + 1 : 0;
      if (this.loudRun >= this.cfg.onsetFrames) {
        this.speaking = true;
        this.cur = [...this.pre];
        this.pre = [];
        this.speechMs = this.loudRun * f;
        this.silentMs = 0;
        this.peakDb = db;
        return { type: "speech-start" };
      }
      return null;
    }
    this.cur.push(frame);
    this.peakDb = Math.max(this.peakDb, db);
    if (loud) {
      this.speechMs += f;
      this.silentMs = 0;
    } else this.silentMs += f;
    const total = this.cur.length * f;
    if (this.silentMs >= this.cfg.hangoverMs || total >= this.cfg.maxUtteranceMs) {
      const speechMs = this.speechMs;
      const peakDb = this.peakDb;
      const frames = this.cur;
      this.reset();
      if (speechMs < this.cfg.minSpeechMs) return { type: "noise" };
      const len = frames.reduce((n, x) => n + x.length, 0);
      const samples = new Float32Array(len);
      let o = 0;
      for (const x of frames) {
        samples.set(x, o);
        o += x.length;
      }
      return { type: "speech-end", samples, speechMs, peakDb };
    }
    return null;
  }
}
