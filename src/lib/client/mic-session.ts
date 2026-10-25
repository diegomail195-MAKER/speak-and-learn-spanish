// One microphone session per oral activity.
// - Asks for permission once, keeps the stream open for the whole activity, closes it at the end.
// - The detector is only "armed" while we wait for an answer. While the app speaks it is disarmed,
//   so the app's own voice is never taken as the student's answer (on top of echo cancellation).
// - Detects interruptions (track ended, device unplugged, context suspended) and exposes a
//   simple resume() that must be called from a click, as browsers require.

import { DEFAULT_VAD, Vad, rmsDb } from "./vad";
import { downsample, encodeWav } from "./wav";

export type MicState = "idle" | "requesting" | "ready" | "listening" | "hearing" | "processing" | "paused" | "suspended" | "denied" | "unavailable" | "stopped";

export type Utterance = { wav: ArrayBuffer; samples16k: Float32Array; speechMs: number; peakDb: number };

export type ListenOutcome =
  | { kind: "speech"; utterance: Utterance }
  | { kind: "timeout" }
  | { kind: "too_quiet" }
  | { kind: "cancelled" }
  | { kind: "interrupted" };

const WORKLET = `
class Tap extends AudioWorkletProcessor {
  constructor() { super(); this.buf = []; this.n = 0; this.size = Math.round(sampleRate / 50); }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      this.buf.push(new Float32Array(ch)); this.n += ch.length;
      if (this.n >= this.size) {
        const out = new Float32Array(this.n); let o = 0;
        for (const b of this.buf) { out.set(b, o); o += b.length; }
        this.port.postMessage(out, [out.buffer]); this.buf = []; this.n = 0;
      }
    }
    return true;
  }
}
registerProcessor("sls-tap", Tap);
`;

/** Peak below this (dBFS) means the mic is picking up almost nothing: too far, muted or broken. */
const TOO_QUIET_DB = -42;

export class MicSession {
  state: MicState = "idle";
  level = 0; // 0..1 for the on-screen meter
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private vad = new Vad(DEFAULT_VAD);
  private armed = false;
  private pending: { resolve: (o: ListenOutcome) => void; timer: ReturnType<typeof setTimeout> | null } | null = null;
  private listeners = new Set<() => void>();
  lastError = "";

  onChange(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private set(s: MicState) {
    this.state = s;
    this.listeners.forEach((l) => l());
  }

  static supported() {
    return typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof AudioWorkletNode !== "undefined";
  }

  /** Must be called from a user gesture (the "Start" button) the first time. */
  async start(): Promise<boolean> {
    if (!MicSession.supported()) {
      this.lastError = "This browser can't use the microphone.";
      this.set("unavailable");
      return false;
    }
    this.set("requesting");
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
    } catch (e) {
      const name = (e as DOMException).name;
      this.lastError = name;
      this.set(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
      return false;
    }
    const track = this.stream.getAudioTracks()[0];
    track.addEventListener("ended", () => this.interrupt());
    track.addEventListener("mute", () => this.interrupt());

    this.ctx = new AudioContext();
    this.ctx.addEventListener("statechange", () => {
      if (this.ctx?.state === "suspended" && this.state !== "stopped") this.interrupt();
    });
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    await this.ctx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, "sls-tap");
    this.node.port.onmessage = (ev: MessageEvent<Float32Array>) => this.onFrame(ev.data);
    src.connect(this.node);
    // Keep the graph pulling without making the mic audible.
    const mute = this.ctx.createGain();
    mute.gain.value = 0;
    this.node.connect(mute).connect(this.ctx.destination);
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.set("ready");
    return true;
  }

  private onFrame(frame: Float32Array) {
    const db = rmsDb(frame);
    this.level = Math.max(0, Math.min(1, (db + 60) / 45));
    const ev = this.vad.push(frame, this.armed);
    if (!ev || !this.pending) return;
    if (ev.type === "speech-start") this.set("hearing");
    else if (ev.type === "noise") this.set("listening");
    else if (ev.type === "speech-end") {
      const samples16k = downsample(ev.samples, this.ctx!.sampleRate);
      const quiet = ev.peakDb < TOO_QUIET_DB;
      this.finish(quiet ? { kind: "too_quiet" } : { kind: "speech", utterance: { wav: encodeWav(samples16k), samples16k, speechMs: ev.speechMs, peakDb: ev.peakDb } });
    }
  }

  private finish(o: ListenOutcome) {
    const p = this.pending;
    if (!p) return;
    this.pending = null;
    this.armed = false;
    if (p.timer) clearTimeout(p.timer);
    if (this.state === "listening" || this.state === "hearing") this.set(o.kind === "speech" ? "processing" : "ready");
    p.resolve(o);
  }

  /** Waits for one answer. Resolves on end of speech, silence timeout, or interruption. */
  listen(timeoutMs = 9000): Promise<ListenOutcome> {
    if (this.state === "suspended" || this.state === "stopped" || !this.ctx) return Promise.resolve({ kind: "interrupted" });
    this.finish({ kind: "cancelled" });
    return new Promise((resolve) => {
      this.vad.reset();
      this.pending = {
        resolve,
        timer: setTimeout(() => {
          // Never cut a child off mid-word: if speech is in progress, wait for it to end.
          if (this.state === "hearing") return;
          this.finish({ kind: "timeout" });
        }, timeoutMs),
      };
      this.armed = true;
      this.set("listening");
    });
  }

  /** Disarm while the app is speaking; the stream stays open. */
  hold() {
    this.finish({ kind: "cancelled" });
    this.armed = false;
    if (this.state !== "suspended" && this.state !== "stopped" && this.ctx) this.set(this.state === "paused" ? "paused" : "ready");
  }

  markReady() {
    if (this.state === "processing") this.set("ready");
  }

  pause() {
    this.finish({ kind: "cancelled" });
    this.set("paused");
  }

  private interrupt() {
    if (this.state === "stopped") return;
    this.finish({ kind: "interrupted" });
    this.set("suspended");
  }

  /** Call from a click after an interruption. */
  async resume(): Promise<boolean> {
    const track = this.stream?.getAudioTracks()[0];
    if (!this.ctx || !track || track.readyState === "ended") {
      this.teardown();
      return this.start();
    }
    try {
      await this.ctx.resume();
      this.set("ready");
      return true;
    } catch {
      this.teardown();
      return this.start();
    }
  }

  private teardown() {
    this.node?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close().catch(() => undefined);
    this.node = null;
    this.stream = null;
    this.ctx = null;
  }

  /** Ends the session: the browser's recording indicator turns off. */
  stop() {
    this.finish({ kind: "cancelled" });
    this.teardown();
    this.set("stopped");
  }

  get noiseFloorDb() {
    return this.vad.noiseDb;
  }
}
