"use client";

import { useEffect, useRef, useState } from "react";
import { MicSession } from "@/lib/client/mic-session";
import { ServerEngine, WebSpeechEngine, webSpeechAvailable, type SpeechEngine } from "@/lib/client/speech-engine";
import type { ContentFor, SpeakingResult } from "@/lib/library/types";
import { evaluateAnswer } from "@/lib/speech/evaluate";
import { Picture, speak, type Done } from "./Players";

// Speaking library resource: the student hears each phrase, then says it. The recognizer checks
// it (two tries). When it can't decide, or the student types because there is no microphone,
// the answer is kept as "unsure" and goes to the teacher's Review queue.

type Status = { tone: "good" | "retry" | "unsure" | "info"; text: string } | null;
const MAX_TRIES = 2;

export function SpeakingPlayer({ content, onDone }: { content: ContentFor<"SPEAKING">; onDone?: Done }) {
  const prompts = content.prompts;
  const [i, setI] = useState(0);
  const [tries, setTries] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [finished, setFinished] = useState(false);
  const results = useRef<SpeakingResult[]>([]);
  const mic = useRef<MicSession | null>(null);
  const engine = useRef<SpeechEngine | null>(null);
  const p = prompts[i];

  useEffect(() => () => { engine.current?.cancel(); mic.current?.stop(); }, []);
  useEffect(() => { if (p) speak(p.say); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const record = (r: SpeakingResult) => {
    results.current[i] = r;
  };
  const advance = () => {
    setStatus(null); setTries(0); setTyped("");
    if (i + 1 < prompts.length) { setI(i + 1); return; }
    setFinished(true);
    const rs = results.current.filter(Boolean);
    onDone?.(rs.filter((r) => r.outcome === "CORRECT").length, prompts.length, rs);
  };

  const listen = async () => {
    if (!p || busy) return;
    setBusy(true);
    setStatus({ tone: "info", text: "Te escucho… · Listening…" });
    try {
      if (!mic.current) {
        const m = new MicSession();
        if (!(await m.start())) { setTyping(true); setStatus({ tone: "info", text: "No microphone here. Type what you would say. · Escribe la frase." }); return; }
        mic.current = m;
        engine.current = webSpeechAvailable() ? new WebSpeechEngine() : new ServerEngine();
      }
      const res = await engine.current!.listen(mic.current, { language: "es-419", locale: "es-MX", mode: "PHRASE", reference: p.say, hints: [p.say, ...p.accepted] });
      if (res.kind !== "result") {
        setStatus({ tone: "retry", text: res.kind === "error" ? `${res.message}. Try again or type it.` : "I didn't hear you. Tap the microphone and speak. · No te escuché." });
        return;
      }
      const ev = evaluateAnswer(res.alternatives, { expected: p.say, accepted: p.accepted, language: "es-419" });
      const n = tries + 1;
      setTries(n);
      if (ev.outcome === "CORRECT") {
        record({ say: p.say, transcript: ev.transcript, outcome: "CORRECT", tries: n });
        setStatus({ tone: "good", text: "¡Muy bien! · Great job!" });
      } else if (ev.outcome === "UNCERTAIN") {
        record({ say: p.say, transcript: ev.transcript, outcome: "UNCERTAIN", tries: n });
        setStatus({ tone: "unsure", text: "Your teacher will check this one. · Tu maestra lo revisará." });
      } else if (n < MAX_TRIES) {
        setStatus({ tone: "retry", text: `I heard “${ev.transcript || "…"}”. Listen and try again. · Inténtalo otra vez.` });
        speak(p.say);
      } else {
        record({ say: p.say, transcript: ev.transcript, outcome: "INCORRECT", tries: n });
        setStatus({ tone: "info", text: `It's “${p.say}”. Let's keep going. · Sigamos.` });
      }
    } finally {
      setBusy(false);
    }
  };

  const submitTyped = () => {
    if (!p || !typed.trim()) return;
    // A typed answer isn't speech: the teacher decides in Review.
    record({ say: p.say, transcript: `Typed: ${typed.trim()}`.slice(0, 300), outcome: "UNCERTAIN", tries: 1 });
    setStatus({ tone: "unsure", text: "Saved. Your teacher will check it. · Guardado." });
  };

  if (!prompts.length) return <p className="text-center text-muted">This activity has no phrases yet.</p>;
  if (finished) {
    const rs = results.current.filter(Boolean);
    const good = rs.filter((r) => r.outcome === "CORRECT").length;
    const unsure = rs.filter((r) => r.outcome === "UNCERTAIN").length;
    return (
      <div className="mx-auto max-w-xl rounded-3xl bg-card p-6 text-center" data-testid="speaking-done">
        <p className="font-display text-3xl font-extrabold">¡Terminaste! · You finished!</p>
        <p className="mt-2 text-lg text-ink-2">{good} of {prompts.length} said right{unsure ? ` · ${unsure} for your teacher to check` : ""}.</p>
      </div>
    );
  }
  const answered = !!results.current[i];
  const toneCls = status?.tone === "good" ? "bg-[#E8F7EE] text-[#146C2E]" : status?.tone === "retry" ? "bg-[#FFF4E5] text-[#8A4B00]" : status?.tone === "unsure" ? "bg-[#F3E8FF] text-[#6B21A8]" : "bg-paper text-ink-2";

  return (
    <div className="mx-auto max-w-xl" data-testid="speaking-player">
      {content.instructions && <p className="mb-3 text-center font-bold text-ink-2">{content.instructions}</p>}
      <p className="mb-2 text-center text-sm font-bold text-muted">{i + 1} / {prompts.length}</p>
      <div className="rounded-3xl bg-card p-5 text-center shadow-sm">
        {(p.image.art || p.image.fileId) && <div className="mx-auto mb-4 h-40 w-40"><Picture image={p.image} label={p.meaning || p.say} /></div>}
        <p className="font-display text-3xl font-extrabold [overflow-wrap:anywhere]" data-testid="speaking-phrase">{p.say}</p>
        {p.meaning && <p className="mt-1 text-lg text-ink-2">{p.meaning}</p>}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => speak(p.say)} className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-line bg-white px-5 font-bold">🔊 Escuchar · Listen</button>
          {!answered && (
            <button type="button" onClick={listen} disabled={busy} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#2563EB] px-6 font-bold text-white disabled:opacity-60" data-testid="speaking-mic">
              🎤 {busy ? "Listening…" : "Hablar · Speak"}
            </button>
          )}
        </div>
        {status && <p role="status" className={`mt-4 rounded-2xl px-4 py-3 font-bold ${toneCls}`}>{status.text}</p>}
        {!answered && (typing ? (
          <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); submitTyped(); }}>
            <label className="sr-only" htmlFor={`typed-${i}`}>Type the phrase</label>
            <input id={`typed-${i}`} value={typed} onChange={(e) => setTyped(e.target.value)} maxLength={200} className="min-h-12 min-w-0 flex-1 rounded-xl border border-line px-3" data-testid="speaking-typed" />
            <button className="min-h-12 rounded-full bg-ink px-5 font-bold text-white">Save</button>
          </form>
        ) : (
          <button type="button" onClick={() => setTyping(true)} className="mt-3 min-h-11 text-sm font-bold text-muted underline">Can&apos;t use the microphone? Type it</button>
        ))}
        {answered && (
          <button type="button" onClick={advance} className="mt-5 inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-bold text-white" data-testid="speaking-next">
            {i + 1 < prompts.length ? "Siguiente · Next" : "Terminar · Finish"}
          </button>
        )}
      </div>
    </div>
  );
}
