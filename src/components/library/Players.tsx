"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Art, Icon, Pinita } from "@/components/ui/Art";
import { GAME_TYPE_LABEL, libraryFileUrl, type AnyContent, type ContentFor, type ImageRef, type Kind, type Pair } from "@/lib/library/types";

// Players for LaxtroSpeak library activities: flashcards, games (Memory, Picture Match,
// Listen & Find, Quiz), songs, videos and printables. The same components run in the
// admin preview, the teacher's "Preview Task" and the student's task.

export type Done = (score: number, total: number) => void;

// ---------- speech (device voice, Latin American Spanish first) ----------
let cachedVoice: SpeechSynthesisVoice | null | undefined;
function spanishVoice() {
  if (cachedVoice !== undefined || typeof speechSynthesis === "undefined") return cachedVoice ?? null;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  cachedVoice = ["es-MX", "es-US", "es-419", "es-CO", "es-AR", "es-ES"].map((l) => voices.find((v) => v.lang.replace("_", "-") === l)).find(Boolean) ?? voices.find((v) => v.lang.startsWith("es")) ?? null;
  return cachedVoice;
}

export function speak(text: string, lang = "es-MX", onEnd?: () => void) {
  if (typeof speechSynthesis === "undefined" || !text) return onEnd?.();
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  if (lang.startsWith("es")) {
    const v = spanishVoice();
    if (v) u.voice = v;
  }
  u.rate = 0.9;
  if (onEnd) u.onend = () => onEnd();
  speechSynthesis.speak(u);
}

function playFile(fileId: string) {
  const a = new Audio(libraryFileUrl(fileId));
  void a.play().catch(() => undefined);
}

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Picture({ image, label, className = "h-full w-full" }: { image: ImageRef | undefined; label?: string; className?: string }) {
  if (image?.fileId) return <img src={libraryFileUrl(image.fileId)} alt={label ?? ""} className={`${className} object-contain`} />;
  if (image?.art) return <Art k={image.art} className={className} label={label} />;
  return null;
}

function SpeakButton({ text, fileId, label = "Listen" }: { text: string; fileId?: string | null; label?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (fileId) playFile(fileId);
        else speak(text);
      }}
      className="grid h-14 w-14 place-items-center rounded-full bg-ink text-white shadow-[0_4px_0_rgba(0,0,0,.25)] active:translate-y-0.5"
      aria-label={`${label}: ${text}`}
    >
      <Icon name="speaker" className="h-6 w-6" />
    </button>
  );
}

function Celebrate({ score, total, onAgain }: { score: number; total: number; onAgain: () => void }) {
  const stars = total ? Math.max(1, Math.round((score / total) * 3)) : 3;
  return (
    <div role="status" className="flex flex-col items-center gap-3 rounded-[28px] bg-card p-8 text-center shadow-pop">
      <Pinita mood="cheer" className="h-32 w-32 animate-wiggle" />
      <p className="font-display text-3xl font-extrabold">¡Muy bien!</p>
      <p className="text-lg font-bold text-ink-2">
        {score} / {total}
      </p>
      <p className="flex gap-1 text-sun" aria-label={`${stars} of 3 stars`}>
        {[0, 1, 2].map((i) => <Icon key={i} name="star" className={`h-9 w-9 ${i < stars ? "" : "opacity-25"}`} />)}
      </p>
      <button type="button" onClick={onAgain} className="mt-2 rounded-full bg-ink px-6 py-3 font-bold text-white">Play again</button>
    </div>
  );
}

function Instructions({ text, es }: { text: string; es?: string }) {
  if (!text && !es) return null;
  return (
    <div className="mb-5 flex items-center gap-3 rounded-[22px] bg-card p-3 pr-5 shadow-pop">
      <Pinita mood="happy" className="h-14 w-14 shrink-0" />
      <p className="font-bold">
        {text}
        {es && <span className="block text-sm font-semibold text-ink-2">{es}</span>}
      </p>
    </div>
  );
}

// ---------- Flashcards ----------
export function FlashcardsPlayer({ content, onDone }: { content: ContentFor<"FLASHCARDS">; onDone?: Done }) {
  const [order, setOrder] = useState(() => content.cards.map((_, i) => i));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const seen = useRef(new Set<number>());
  const touch = useRef<number | null>(null);
  const card = content.cards[order[i]];
  useEffect(() => {
    seen.current.add(order[i]);
    if (seen.current.size === content.cards.length) onDone?.(content.cards.length, content.cards.length);
  }, [i, order, content.cards.length, onDone]);
  if (!card) return <p className="text-muted">No cards yet.</p>;
  const go = (d: number) => { setFlipped(false); setI((x) => (x + d + order.length) % order.length); };
  return (
    <div className="mx-auto max-w-xl">
      <Instructions text={content.instructions} />
      <div
        className={`flip-card aspect-[4/3] w-full cursor-pointer select-none ${flipped ? "is-flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
        role="button"
        tabIndex={0}
        aria-label={flipped ? `Back: ${card.back}. Tap to flip.` : `Front: ${card.front}. Tap to flip.`}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setFlipped((f) => !f))}
        data-testid="flashcard"
      >
        <div className="flip-inner">
          <div className="flip-face flex flex-col items-center justify-center gap-3 rounded-[28px] border-[3px] border-line bg-card p-6 shadow-pop">
            <div className="h-1/2 w-1/2"><Picture image={card.image} label={card.front} /></div>
            <p className="font-display text-4xl font-extrabold">{card.front}</p>
          </div>
          <div className="flip-face flip-back flex flex-col items-center justify-center gap-2 rounded-[28px] bg-mint p-6 shadow-pop">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-ink/70">English</p>
            <p className="font-display text-4xl font-extrabold text-ink">{card.back}</p>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-center gap-3">
        <button type="button" onClick={() => go(-1)} className="grid h-14 w-14 place-items-center rounded-full bg-card shadow-pop" aria-label="Previous card"><Icon name="back" className="h-6 w-6" /></button>
        <SpeakButton text={card.front} fileId={card.audio?.fileId} />
        <button type="button" onClick={() => setFlipped((f) => !f)} className="grid h-14 w-14 place-items-center rounded-full bg-card shadow-pop" aria-label="Flip card"><Icon name="flip" className="h-6 w-6" /></button>
        <button type="button" onClick={() => { setOrder(shuffle(order)); setI(0); setFlipped(false); }} className="grid h-14 w-14 place-items-center rounded-full bg-card shadow-pop" aria-label="Shuffle"><Icon name="shuffle" className="h-6 w-6" /></button>
        <button type="button" onClick={() => go(1)} className="grid h-14 w-14 place-items-center rounded-full bg-card shadow-pop" aria-label="Next card"><Icon name="next" className="h-6 w-6" /></button>
      </div>
      <p className="mt-3 text-center font-bold text-muted">{i + 1} / {order.length}</p>
    </div>
  );
}

// ---------- Games ----------
type Tile = { key: string; pair: number; face: "pic" | "word" };

function MemoryGame({ pairs, onDone }: { pairs: Pair[]; onDone: Done }) {
  const make = () => shuffle(pairs.flatMap((_, i) => [{ key: `p${i}`, pair: i, face: "pic" as const }, { key: `w${i}`, pair: i, face: "word" as const }]));
  const [tiles, setTiles] = useState<Tile[]>(make);
  const [open, setOpen] = useState<string[]>([]);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [tries, setTries] = useState(0);
  const done = found.size === pairs.length;
  useEffect(() => {
    if (done) onDone(pairs.length, Math.max(pairs.length, tries));
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  // Taps can arrive faster than React re-renders: read the open cards from a ref, not the closure.
  const openRef = useRef<string[]>([]);
  const setOpenBoth = (v: string[]) => { openRef.current = v; setOpen(v); };
  if (done) return <Celebrate score={pairs.length} total={Math.max(pairs.length, tries)} onAgain={() => { setTiles(make()); setFound(new Set()); setOpenBoth([]); setTries(0); }} />;
  const flip = (t: Tile) => {
    const cur = openRef.current;
    if (cur.length === 2 || cur.includes(t.key) || found.has(t.pair)) return;
    const next = [...cur, t.key];
    setOpenBoth(next);
    if (next.length === 2) {
      setTries((n) => n + 1);
      const [a, b] = next.map((k) => tiles.find((x) => x.key === k)!);
      if (a.pair === b.pair) {
        speak(pairs[a.pair].es);
        setTimeout(() => { setFound((f) => new Set(f).add(a.pair)); setOpenBoth([]); }, 500);
      } else setTimeout(() => setOpenBoth([]), 900);
    }
  };
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {tiles.map((t) => {
        const shown = open.includes(t.key) || found.has(t.pair);
        const p = pairs[t.pair];
        return (
          <button key={t.key} type="button" data-testid="memory-tile" data-pair={t.pair} onClick={() => flip(t)} aria-label={shown ? (t.face === "pic" ? `Picture: ${p.en || p.es}` : p.es) : "Hidden card"}
            className={`grid aspect-square place-items-center rounded-[20px] border-[3px] p-2 text-center font-display text-xl font-extrabold shadow-pop transition ${found.has(t.pair) ? "border-mint bg-leaf-soft" : shown ? "border-sky bg-card" : "border-transparent bg-berry text-white"}`}>
            {shown ? (t.face === "pic" ? (p.image.art || p.image.fileId ? <Picture image={p.image} label={p.en} /> : <span>{p.en}</span>) : <span>{p.es}</span>) : <Icon name="star" className="h-10 w-10" />}
          </button>
        );
      })}
    </div>
  );
}

function MatchGame({ pairs, onDone }: { pairs: Pair[]; onDone: Done }) {
  const [round, setRound] = useState(0);
  const rounds = useMemo(() => { const s = shuffle(pairs.map((_, i) => i)); const out: number[][] = []; for (let i = 0; i < s.length; i += 4) out.push(s.slice(i, i + 4)); return out; }, [pairs]);
  const [words, setWords] = useState<number[]>(() => shuffle(rounds[0] ?? []));
  const [pick, setPick] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [miss, setMiss] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const finished = round >= rounds.length;
  useEffect(() => { if (finished) onDone(pairs.length, pairs.length + miss); }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps
  if (finished) return <Celebrate score={pairs.length} total={pairs.length + miss} onAgain={() => { setRound(0); setWords(shuffle(rounds[0])); setMatched(new Set()); setMiss(0); }} />;
  const cur = rounds[round];
  const choose = (w: number) => {
    if (pick === null) return;
    if (w === pick) {
      speak(pairs[w].es);
      const m = new Set(matched).add(w);
      setMatched(m);
      setPick(null);
      if (cur.every((x) => m.has(x))) setTimeout(() => { const r = round + 1; setRound(r); if (rounds[r]) setWords(shuffle(rounds[r])); }, 700);
    } else {
      setMiss((n) => n + 1);
      setWrong(w);
      setTimeout(() => setWrong(null), 600);
    }
  };
  return (
    <div>
      <p className="mb-3 text-center font-bold text-muted">Round {round + 1} of {rounds.length}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cur.map((i) => (
          <button key={i} type="button" data-testid="match-picture" data-pair={i} disabled={matched.has(i)} onClick={() => setPick(i)} aria-pressed={pick === i}
            className={`grid aspect-square place-items-center rounded-[20px] border-[3px] bg-card p-3 shadow-pop ${matched.has(i) ? "border-mint opacity-60" : pick === i ? "border-sky ring-4 ring-sky/30" : "border-line"}`}
            aria-label={`Picture ${pairs[i].en || ""}`}>
            {pairs[i].image.art || pairs[i].image.fileId ? <Picture image={pairs[i].image} label={pairs[i].en} /> : <span className="font-display text-xl font-bold">{pairs[i].en}</span>}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {words.map((w) => (
          <button key={w} type="button" data-testid="match-word" data-pair={w} disabled={matched.has(w)} onClick={() => choose(w)}
            className={`min-h-14 rounded-full px-4 py-3 font-display text-xl font-extrabold shadow-pop ${matched.has(w) ? "bg-leaf-soft text-leaf" : wrong === w ? "animate-wiggle bg-coral-soft text-coral-dark" : "bg-ink text-white"}`}>
            {pairs[w].es}
          </button>
        ))}
      </div>
    </div>
  );
}

function ListenGame({ pairs, onDone }: { pairs: Pair[]; onDone: Done }) {
  const order = useMemo(() => shuffle(pairs.map((_, i) => i)), [pairs]);
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);
  const [firstTry, setFirstTry] = useState(true);
  const options = useMemo(() => {
    const target = order[q];
    if (target === undefined) return [];
    return shuffle([target, ...shuffle(pairs.map((_, i) => i).filter((i) => i !== target)).slice(0, Math.min(3, pairs.length - 1))]);
  }, [q, order, pairs]);
  const finished = q >= order.length;
  useEffect(() => { if (!finished) setTimeout(() => speak(pairs[order[q]].es), 300); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (finished) onDone(score, order.length); }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps
  if (finished) return <Celebrate score={score} total={order.length} onAgain={() => { setQ(0); setScore(0); }} />;
  const target = order[q];
  const answer = (i: number) => {
    if (feedback === "ok") return;
    if (i === target) {
      setFeedback("ok");
      if (firstTry) setScore((s) => s + 1);
      setTimeout(() => { setFeedback(null); setFirstTry(true); setQ((x) => x + 1); }, 800);
    } else {
      setFeedback("no");
      setFirstTry(false);
      setTimeout(() => setFeedback(null), 700);
    }
  };
  return (
    <div className="text-center">
      <p className="mb-2 font-bold text-muted">{q + 1} / {order.length}</p>
      <button type="button" data-testid="listen-again" data-answer={target} onClick={() => speak(pairs[target].es)} className="mx-auto mb-5 flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-white shadow-pop">
        <Icon name="speaker" className="h-6 w-6" /> Listen again
      </button>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {options.map((i) => (
          <button key={i} type="button" data-testid="listen-option" data-pair={i} onClick={() => answer(i)} aria-label={pairs[i].en || `Option ${i + 1}`}
            className={`grid aspect-square place-items-center rounded-[20px] border-[3px] bg-card p-3 shadow-pop ${feedback === "ok" && i === target ? "border-mint bg-leaf-soft" : "border-line"}`}>
            <Picture image={pairs[i].image} label={pairs[i].en} />
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-4 min-h-8 font-display text-2xl font-extrabold">{feedback === "ok" ? "¡Muy bien!" : feedback === "no" ? "¡Inténtalo otra vez!" : ""}</p>
    </div>
  );
}

function QuizGame({ questions, onDone }: { questions: ContentFor<"GAME">["questions"]; onDone: Done }) {
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const finished = q >= questions.length;
  useEffect(() => { if (finished) onDone(score, questions.length); }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps
  if (finished) return <Celebrate score={score} total={questions.length} onAgain={() => { setQ(0); setScore(0); setChosen(null); }} />;
  const cur = questions[q];
  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="mb-2 font-bold text-muted">{q + 1} / {questions.length}</p>
      {(cur.image.art || cur.image.fileId) && <div className="mx-auto mb-3 h-40 w-40"><Picture image={cur.image} /></div>}
      <p className="font-display text-3xl font-extrabold">{cur.prompt}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {cur.choices.map((c, i) => c && (
          <button key={i} type="button" data-testid="quiz-choice" data-correct={i === cur.answer} disabled={chosen !== null} onClick={() => {
            setChosen(i);
            if (i === cur.answer) setScore((s) => s + 1);
            setTimeout(() => { setChosen(null); setQ((x) => x + 1); }, 900);
          }}
            className={`min-h-14 rounded-full px-5 py-3 font-display text-xl font-extrabold shadow-pop ${chosen === null ? "bg-ink text-white" : i === cur.answer ? "bg-leaf-soft text-leaf" : chosen === i ? "bg-coral-soft text-coral-dark" : "bg-card text-muted"}`}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GamePlayer({ content, onDone }: { content: ContentFor<"GAME">; onDone?: Done }) {
  const done: Done = (s, t) => onDone?.(s, t);
  const label = GAME_TYPE_LABEL[content.gameType];
  return (
    <div className="mx-auto max-w-3xl">
      <Instructions text={content.instructions || label.help} es={label.es} />
      {content.gameType === "MEMORY" && <MemoryGame pairs={content.pairs} onDone={done} />}
      {content.gameType === "MATCH" && <MatchGame pairs={content.pairs} onDone={done} />}
      {content.gameType === "LISTEN" && <ListenGame pairs={content.pairs} onDone={done} />}
      {content.gameType === "QUIZ" && <QuizGame questions={content.questions} onDone={done} />}
    </div>
  );
}

// ---------- Song ----------
export function SongPlayer({ content, onDone }: { content: ContentFor<"SONG">; onDone?: Done }) {
  const [line, setLine] = useState(-1);
  const playing = useRef(false);
  const sing = (i: number) => {
    if (i >= content.lyrics.length) { playing.current = false; setLine(-1); onDone?.(1, 1); return; }
    setLine(i);
    speak(content.lyrics[i].es, "es-MX", () => playing.current && setTimeout(() => sing(i + 1), 350));
  };
  useEffect(() => () => { playing.current = false; if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel(); }, []);
  return (
    <div className="mx-auto max-w-2xl">
      {content.file && (
        <audio controls src={libraryFileUrl(content.file.fileId)} onEnded={() => onDone?.(1, 1)} className="mb-5 w-full" data-testid="song-audio">
          Your browser can’t play this song.
        </audio>
      )}
      {content.lyrics.length > 0 && (
        <>
          {!content.file && (
            <button type="button" data-testid="sing" onClick={() => { playing.current = true; sing(0); }} className="mb-5 flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-white shadow-pop">
              <Icon name="play" className="h-5 w-5" /> Sing along
            </button>
          )}
          <ol className="space-y-3">
            {content.lyrics.map((l, i) => (
              <li key={i} className={`flex items-center gap-4 rounded-[22px] p-3 transition ${line === i ? "bg-sun shadow-pop" : "bg-card"}`}>
                {l.art && <Art k={l.art} className="h-16 w-16 shrink-0" />}
                <button type="button" onClick={() => speak(l.es)} className="text-left">
                  <span className="block font-display text-2xl font-extrabold">{l.es}</span>
                  {l.en && <span className="text-sm font-semibold text-ink-2">{l.en}</span>}
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

// ---------- Video ----------
export function VideoPlayer({ content, onDone }: { content: ContentFor<"VIDEO">; onDone?: Done }) {
  useEffect(() => { if (content.youtubeId) onDone?.(1, 1); }, [content.youtubeId]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-[28px] bg-ink shadow-pop">
        {content.file ? (
          <video controls playsInline preload="metadata" src={libraryFileUrl(content.file.fileId)} onEnded={() => onDone?.(1, 1)} className="aspect-video w-full" data-testid="video-file" />
        ) : content.youtubeId ? (
          <iframe title="Video" src={`https://www.youtube-nocookie.com/embed/${content.youtubeId}?rel=0`} allow="encrypted-media; picture-in-picture; fullscreen" className="aspect-video w-full" />
        ) : (
          <p className="p-10 text-center text-white">No video yet.</p>
        )}
      </div>
      {content.captions && <p className="mt-4 whitespace-pre-line rounded-[22px] bg-card p-4 text-ink-2">{content.captions}</p>}
    </div>
  );
}

// ---------- Printables / worksheets ----------
export function PrintablePlayer({ content, title, onDone }: { content: ContentFor<"PRINTABLE">; title: string; onDone?: Done }) {
  useEffect(() => { onDone?.(1, 1); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (content.file) {
    const url = libraryFileUrl(content.file.fileId);
    const isPdf = content.file.mime === "application/pdf" || content.file.name.toLowerCase().endsWith(".pdf");
    return (
      <div>
        <div className="no-print mb-3 flex gap-2">
          <a href={url} target="_blank" rel="noopener" className="rounded-full bg-ink px-5 py-3 font-bold text-white">Open to print</a>
        </div>
        {isPdf ? <iframe title={title} src={url} className="h-[75vh] w-full rounded-[22px] border border-line bg-white" /> : <img src={url} alt={title} className="mx-auto max-h-[80vh] rounded-[22px] border border-line bg-white" />}
      </div>
    );
  }
  const sheet = content.sheet;
  if (!sheet) return <p className="text-muted">Nothing to print yet.</p>;
  return (
    <div>
      <div className="no-print mb-3 flex gap-2">
        <button type="button" onClick={() => window.print()} className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-bold text-white"><Icon name="printables" /> Print</button>
      </div>
      <article className="mx-auto max-w-3xl rounded-[22px] border border-line bg-white p-8 print:border-0 print:p-0">
        <header className="mb-6 flex items-center justify-between border-b-2 border-line pb-3">
          <img src="/brand/laxtrospeak-logo.png" alt="LaxtroSpeak" className="h-7 w-auto" />
          <span className="text-sm font-bold">Name: ____________________</span>
        </header>
        <h2 className="mb-5 font-display text-2xl font-extrabold">{sheet.heading || title}</h2>
        {sheet.style === "dictionary" && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {sheet.words.map((w, i) => (
              <div key={i} className="rounded-2xl border-2 border-line p-3 text-center">
                <div className="mx-auto h-20 w-20"><Picture image={w.image} label={w.en} /></div>
                <p className="mt-2 font-display text-lg font-extrabold">{w.es}</p>
                <p className="text-sm text-ink-2">{w.en}</p>
              </div>
            ))}
          </div>
        )}
        {sheet.style === "write" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {sheet.words.map((w, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl border-2 border-line p-3">
                <div className="h-20 w-20 shrink-0"><Picture image={w.image} label={w.en} /></div>
                <div className="flex-1"><p className="text-sm text-ink-2">{w.en}</p><p className="mt-6 border-b-2 border-dashed border-ink-2" /></div>
              </div>
            ))}
          </div>
        )}
        {sheet.style === "connect" && (
          <ConnectSheet words={sheet.words} />
        )}
      </article>
    </div>
  );
}

function ConnectSheet({ words }: { words: Pair[] }) {
  const right = useMemo(() => shuffle(words.map((_, i) => i)), [words]);
  return (
    <div className="grid grid-cols-[1fr_6rem_1fr] items-center gap-y-4">
      {words.map((w, i) => (
        <div key={i} className="contents">
          <div className="flex items-center gap-3"><div className="h-20 w-20"><Picture image={w.image} label={w.en} /></div><span className="h-3 w-3 rounded-full bg-ink" /></div>
          <span />
          <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-ink" /><span className="font-display text-xl font-extrabold">{words[right[i]].es}</span></div>
        </div>
      ))}
    </div>
  );
}

// ---------- Dispatcher ----------
// Games and sheets shuffle their cards, so they render only in the browser: a server-rendered
// order would not match the browser's and taps would land on the wrong card.
const noop = () => () => {};
const useInBrowser = () => useSyncExternalStore(noop, () => true, () => false);

export function ResourcePlayer({ kind, content, title, onDone }: { kind: Kind; content: AnyContent; title: string; onDone?: Done }) {
  const inBrowser = useInBrowser();
  if (!inBrowser && (kind === "GAME" || kind === "PRINTABLE" || kind === "WORKSHEET")) {
    return <div className="mx-auto grid h-64 max-w-3xl place-items-center rounded-[28px] bg-card shadow-pop"><Pinita mood="happy" className="h-24 w-24 animate-wiggle" /></div>;
  }
  switch (kind) {
    case "FLASHCARDS": return <FlashcardsPlayer content={content as ContentFor<"FLASHCARDS">} onDone={onDone} />;
    case "GAME": return <GamePlayer content={content as ContentFor<"GAME">} onDone={onDone} />;
    case "SONG": return <SongPlayer content={content as ContentFor<"SONG">} onDone={onDone} />;
    case "VIDEO": return <VideoPlayer content={content as ContentFor<"VIDEO">} onDone={onDone} />;
    case "PRINTABLE":
    case "WORKSHEET": return <PrintablePlayer content={content as ContentFor<"PRINTABLE">} title={title} onDone={onDone} />;
  }
}
