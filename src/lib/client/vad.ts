// Energy-based voice activity detector with an adaptive noise floor.
// Works on 20 ms frames. Tuned for children in a classroom: quick onset, generous hangover
// (kids pause mid-answer), and a minimum speech length so a cough or desk bump is ignored.

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
  onsetFrames: 3,
  hangoverMs: 850,
  minSpeechMs: 220,
  maxUtteranceMs: 8000,
  preRollMs: 350,
  marginDb: 11,
  absoluteMinDb: -52,
};

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
    if (!this.speaking) {
      // Disarmed frames (app audio playing / calibration) adapt fast. While armed the floor falls
      // quickly but rises very slowly, so steady classroom noise is absorbed over a few seconds
      // while a child's 1–2 s answer barely moves it.
      const a = !armed ? 0.15 : db < this.noiseDb ? 0.2 : loud ? 0.004 : 0.03;
      this.noiseDb = Math.min(-25, this.noiseDb + a * (db - this.noiseDb));
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
