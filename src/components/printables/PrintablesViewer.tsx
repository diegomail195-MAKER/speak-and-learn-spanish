"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import {
  PAPER,
  flashcardSheets,
  isEmptyFace,
  matchPages,
  quizItems,
  quizPages,
  wheelGroups,
  type FlipEdge,
  type PaperSize,
  type PrintCard,
  type PrintTemplate,
} from "@/lib/printables/layout";
import { AnswerKeyPage, CardSheetPage, MatchPageView, QuizPageView, WheelPage } from "./PrintPages";

const TEMPLATES: Array<{ key: PrintTemplate; label: string; help: string }> = [
  { key: "flashcards", label: "Flash cards", help: "Cut-out cards, one side or front and back" },
  { key: "match", label: "Match up – line drawing", help: "Join each pair with a line" },
  { key: "quiz", label: "Quiz", help: "Four choices, A to D" },
  { key: "wheel", label: "Spin the wheel", help: "A paper wheel to cut out" },
];

/** Little drawings of each template for the picker (LextroSpeak's own, not screenshots). */
function Thumb({ kind }: { kind: PrintTemplate }) {
  const s = { stroke: "currentColor", fill: "none", strokeWidth: 1.4 } as const;
  return (
    <svg viewBox="0 0 36 46" className="h-12 w-10 shrink-0 rounded-sm bg-white text-ink-2 shadow-[0_0_0_1px_var(--color-line)]" aria-hidden>
      <rect x="0" y="0" width="36" height="3" fill="var(--color-coral)" />
      {kind === "flashcards" && [0, 1, 2].flatMap((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={4 + c * 15} y={7 + r * 12} width="13" height="10" {...s} strokeDasharray="2 1.5" />))}
      {kind === "match" && (
        <>
          {[0, 1, 2].map((r) => <rect key={`l${r}`} x="3" y={9 + r * 11} width="10" height="7" {...s} />)}
          {[0, 1, 2].map((r) => <rect key={`r${r}`} x="23" y={9 + r * 11} width="10" height="7" {...s} />)}
          <path d="M13 12.5 L23 34.5 M13 23.5 L23 12.5 M13 34.5 L23 23.5" {...s} />
        </>
      )}
      {kind === "quiz" && [0, 1, 2].map((r) => (
        <g key={r}>
          <path d={`M4 ${9 + r * 12} H26`} {...s} />
          <circle cx="8" cy={13 + r * 12} r="1.6" {...s} />
          <circle cx="20" cy={13 + r * 12} r="1.6" {...s} />
        </g>
      ))}
      {kind === "wheel" && (
        <>
          <circle cx="18" cy="25" r="14" {...s} />
          {[0, 60, 120].map((a) => <path key={a} d={`M${18 - 14 * Math.cos((a * Math.PI) / 180)} ${25 - 14 * Math.sin((a * Math.PI) / 180)} L${18 + 14 * Math.cos((a * Math.PI) / 180)} ${25 + 14 * Math.sin((a * Math.PI) / 180)}`} {...s} />)}
        </>
      )}
    </svg>
  );
}

/** Scales a real-size page down to the width available, keeping its layout. */
function Scaled({ width, height, avail, children }: { width: number; height: number; avail: number; children: ReactNode }) {
  const k = Math.min(1, avail / width);
  return (
    <div style={{ width: width * k, height: height * k }} className="mx-auto shadow-[0_2px_12px_rgba(31,42,68,.18)]">
      <div style={{ width, height, transform: `scale(${k})`, transformOrigin: "top left" }}>{children}</div>
    </div>
  );
}

export function PrintablesViewer({ title, cards, onClose }: { title: string; cards: PrintCard[]; onClose: () => void }) {
  const [tpl, setTpl] = useState<PrintTemplate>("flashcards");
  const [size, setSize] = useState<PaperSize>("letter");
  const [sides, setSides] = useState<"one" | "two">(() => (cards.some((c) => !isEmptyFace(c.back)) ? "two" : "one"));
  const [flip, setFlip] = useState<FlipEdge>("long");
  const [answerKey, setAnswerKey] = useState(true);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6) + 1);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(cards.map((c) => c.id)));
  const [filled, setFilled] = useState<Record<string, string>>({});
  const [showOptions, setShowOptions] = useState(false);
  const [busy, setBusy] = useState<"" | "pdf">("");
  const [error, setError] = useState("");
  const [avail, setAvail] = useState(600);
  const previewRef = useRef<HTMLDivElement>(null);
  const printRoot = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useLayoutEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAvail(el.clientWidth - 32));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && (showOptions ? setShowOptions(false) : onClose());
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [onClose, showOptions]);

  const chosen = useMemo(() => cards.filter((c) => picked.has(c.id)), [cards, picked]);
  const withBacks = chosen.filter((c) => !isEmptyFace(c.back));
  const quiz = useMemo(() => quizItems(chosen, seed, filled), [chosen, seed, filled]);
  const missing = quiz.filter((q) => q.options.some((o) => o.missing));
  const { w, h } = PAPER[size];

  const pages: ReactNode[] = useMemo(() => {
    if (!chosen.length) return [];
    if (tpl === "flashcards") return flashcardSheets(chosen, { sides, flip }).map((s, i) => <CardSheetPage key={`c${i}`} sheet={s} size={size} index={i} />);
    if (tpl === "match") return matchPages(chosen, seed).map((p, i) => <MatchPageView key={`m${i}`} page={p} size={size} title={title} index={i} />);
    if (tpl === "quiz") {
      const qp = quizPages(quiz).map((items, i) => <QuizPageView key={`q${i}`} items={items} size={size} title={title} index={i} first={i === 0} />);
      return answerKey ? [...qp, <AnswerKeyPage key="key" items={quiz} size={size} title={title} />] : qp;
    }
    const groups = wheelGroups(chosen.map((c) => ({ cardId: c.id, face: c.front })));
    return groups.map((g, i) => <WheelPage key={`w${i}`} faces={g} size={size} title={title} index={i} total={groups.length} />);
  }, [chosen, tpl, sides, flip, seed, size, title, quiz, answerKey]);

  const emptyNote =
    !chosen.length ? "Choose at least one card in Options." : tpl === "match" && !withBacks.length ? "Match up needs cards with a back." : "";

  function print() {
    const style = document.createElement("style");
    style.textContent = `@page { size: ${size === "a4" ? "A4" : "letter"}; margin: 0 }`;
    document.head.appendChild(style);
    document.body.classList.add("ls-printing");
    const done = () => {
      document.body.classList.remove("ls-printing");
      style.remove();
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
    setTimeout(done, 1000);
  }

  async function downloadPdf() {
    setBusy("pdf");
    setError("");
    try {
      const [{ jsPDF }, { toPng }] = await Promise.all([import("jspdf"), import("html-to-image")]);
      const nodes = Array.from(printRoot.current?.querySelectorAll<HTMLElement>("[data-print-page]") ?? []);
      await Promise.all(
        Array.from(printRoot.current?.querySelectorAll("img") ?? []).map((img) => (img.complete ? null : new Promise((r) => ((img.onload = r), (img.onerror = r))))),
      );
      const pdf = new jsPDF({ unit: "px", format: [w, h], orientation: "portrait", hotfixes: ["px_scaling"], compress: true });
      for (let i = 0; i < nodes.length; i++) {
        let png: string;
        try {
          png = await toPng(nodes[i], { pixelRatio: 2, backgroundColor: "#ffffff", width: w, height: h });
        } catch {
          png = await toPng(nodes[i], { pixelRatio: 2, backgroundColor: "#ffffff", width: w, height: h, skipFonts: true });
        }
        if (i > 0) pdf.addPage([w, h], "portrait");
        pdf.addImage(png, "PNG", 0, 0, w, h, undefined, "FAST");
      }
      const name = `${(title || "flashcards").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase()}-${tpl}.pdf`;
      pdf.save(name);
    } catch (e) {
      setError(`The PDF could not be made: ${(e as Error).message}`);
    } finally {
      setBusy("");
    }
  }

  const bar = "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-ink-2 hover:bg-paper-2 hover:text-ink disabled:opacity-40";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-paper" role="dialog" aria-modal="true" aria-label="Printables">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-card px-3 py-2 sm:px-5">
        <h2 className="mr-auto font-display text-lg font-extrabold">Printables</h2>
        <button type="button" className={bar} onClick={print} disabled={!pages.length || !!emptyNote} data-testid="print-worksheet">🖨 Print worksheet</button>
        <button type="button" className={bar} onClick={downloadPdf} disabled={!pages.length || !!emptyNote || !!busy} data-testid="download-pdf">⬇ {busy === "pdf" ? "Making PDF…" : "Download PDF"}</button>
        <button type="button" className={`${bar} ${showOptions ? "bg-paper-2 text-ink" : ""}`} onClick={() => setShowOptions((v) => !v)} aria-expanded={showOptions}>⚙ Options</button>
        <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-2xl leading-none text-muted hover:bg-paper-2 hover:text-ink" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <nav aria-label="Printable templates" className="shrink-0 border-b border-line bg-card md:w-64 md:border-b-0 md:border-r">
          <p className="hidden px-4 pt-4 text-xs font-extrabold uppercase tracking-wider text-muted md:block">Templates</p>
          <ul className="flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible">
            {TEMPLATES.map((t) => (
              <li key={t.key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setTpl(t.key)}
                  aria-pressed={tpl === t.key}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${tpl === t.key ? "bg-teal text-white" : "hover:bg-paper-2"}`}
                >
                  <Thumb kind={t.key} />
                  <span>
                    <span className="block text-sm font-bold">{t.label}</span>
                    <span className={`hidden text-xs md:block ${tpl === t.key ? "text-white/80" : "text-muted"}`}>{t.help}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="relative min-h-0 flex-1">
          {showOptions && (
            <section aria-label="Print options" className="absolute right-3 top-3 z-10 max-h-[calc(100%-1.5rem)] w-[min(22rem,calc(100%-1.5rem))] overflow-auto rounded-xl2 border border-line bg-card p-4 text-sm shadow-soft">
              <fieldset className="mb-3">
                <legend className="mb-1 font-bold">Paper size</legend>
                {(["letter", "a4"] as const).map((p) => (
                  <label key={p} className="mr-4 inline-flex items-center gap-1.5"><input type="radio" name="paper" checked={size === p} onChange={() => setSize(p)} /> {PAPER[p].label}</label>
                ))}
              </fieldset>
              {tpl === "flashcards" && (
                <>
                  <fieldset className="mb-3">
                    <legend className="mb-1 font-bold">Sides</legend>
                    <label className="mr-4 inline-flex items-center gap-1.5"><input type="radio" name="psides" checked={sides === "one"} onChange={() => setSides("one")} /> Front only</label>
                    <label className="inline-flex items-center gap-1.5"><input type="radio" name="psides" checked={sides === "two"} onChange={() => setSides("two")} /> Front and back (duplex)</label>
                  </fieldset>
                  {sides === "two" && (
                    <fieldset className="mb-3">
                      <legend className="mb-1 font-bold">Printer flips on the</legend>
                      <label className="mr-4 inline-flex items-center gap-1.5"><input type="radio" name="flip" checked={flip === "long"} onChange={() => setFlip("long")} /> Long edge</label>
                      <label className="inline-flex items-center gap-1.5"><input type="radio" name="flip" checked={flip === "short"} onChange={() => setFlip("short")} /> Short edge</label>
                    </fieldset>
                  )}
                </>
              )}
              {tpl === "quiz" && (
                <label className="mb-3 flex items-center gap-1.5"><input type="checkbox" checked={answerKey} onChange={(e) => setAnswerKey(e.target.checked)} /> Add an answer key page</label>
              )}
              {(tpl === "match" || tpl === "quiz") && (
                <Button size="sm" variant="secondary" className="mb-3" onClick={() => setSeed((s) => s + 1)}>🔀 Shuffle again</Button>
              )}
              <fieldset>
                <legend className="mb-1 font-bold">Cards to include ({chosen.length} of {cards.length})</legend>
                <div className="mb-1 flex gap-3 text-xs font-bold">
                  <button type="button" className="text-sky hover:underline" onClick={() => setPicked(new Set(cards.map((c) => c.id)))}>All</button>
                  <button type="button" className="text-sky hover:underline" onClick={() => setPicked(new Set())}>None</button>
                </div>
                <ul className="max-h-56 space-y-0.5 overflow-auto rounded-lg border border-line p-1">
                  {cards.map((c, i) => (
                    <li key={c.id}>
                      <label className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-paper-2">
                        <input
                          type="checkbox"
                          checked={picked.has(c.id)}
                          onChange={(e) => setPicked((p) => { const n = new Set(p); if (e.target.checked) n.add(c.id); else n.delete(c.id); return n; })}
                        />
                        <span className="w-6 text-right text-xs text-muted">{i + 1}.</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {c.front.imageUrl && <img src={c.front.imageUrl} alt="" className="h-5 w-5 object-contain" />}
                        <span className="truncate">{c.front.text || c.front.imageAlt || "(picture)"}{c.back?.text ? ` — ${c.back.text}` : ""}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            </section>
          )}

          <div ref={previewRef} className="h-full overflow-auto bg-paper-2 p-4" data-testid="printable-preview">
            {error && <p role="alert" className="mx-auto mb-3 max-w-xl rounded-xl bg-coral-soft p-3 text-sm text-coral-dark">{error}</p>}
            {tpl === "quiz" && missing.length > 0 && (
              <section aria-label="Complete the quiz options" className="mx-auto mb-4 max-w-2xl rounded-xl2 border border-sun bg-sun-soft p-4 text-sm">
                <p className="font-bold">Some questions need more choices.</p>
                <p className="mb-2 text-ink-2">Type the missing choices. Blank ones print as a line.</p>
                <div className="space-y-2">
                  {missing.map((q) => (
                    <div key={q.cardId} className="flex flex-wrap items-center gap-2">
                      <span className="w-40 truncate font-bold">{q.number}. {q.question.text || q.question.imageAlt || "(picture)"}</span>
                      {q.options.map((o, i) =>
                        o.missing ? (
                          <input
                            key={o.key}
                            value={filled[o.key] ?? ""}
                            onChange={(e) => setFilled((f) => ({ ...f, [o.key]: e.target.value }))}
                            placeholder={o.correct ? `${"ABCD"[i]} (right answer)` : `${"ABCD"[i]}`}
                            aria-label={`Question ${q.number}, choice ${"ABCD"[i]}${o.correct ? " (right answer)" : ""}`}
                            className={`h-8 w-36 rounded-md border bg-card px-2 ${o.correct ? "border-leaf" : "border-line"}`}
                          />
                        ) : null,
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
            {emptyNote ? (
              <p className="mt-10 text-center font-bold text-muted">{emptyNote}</p>
            ) : (
              <div className="space-y-5 pb-6">
                <p className="text-center text-xs font-bold text-muted">{pages.length} {pages.length === 1 ? "page" : "pages"} · {PAPER[size].label}</p>
                {pages.map((p, i) => (
                  <Scaled key={i} width={w} height={h} avail={avail}>{p}</Scaled>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {mounted &&
        createPortal(
          <div id="ls-print-root" ref={printRoot} aria-hidden>
            {emptyNote ? null : pages}
          </div>,
          document.body,
        )}
    </div>
  );
}
