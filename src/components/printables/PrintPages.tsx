// The printable pages themselves, drawn at their real size (CSS px at 96 dpi). The same
// components feed the preview (scaled), the browser print and the PDF.
import type { ReactNode } from "react";
import {
  CARD_COLS,
  CARD_ROWS,
  MARGIN,
  QUIZ_LETTERS,
  quizHasPictures,
  sectorPath,
  type CardSheet,
  type MatchPage,
  type PrintCard,
  type PrintFace,
  type QuizItem,
  type ShowParts,
} from "@/lib/printables/layout";
import { printSrc } from "@/lib/printables/fromGame";

const INK = "#1f2a44";
const LINE = "#9aa1b3";
const BRAND = "#d93a30";
const SOFT = "#4a5572";

export type PaperBox = { w: number; h: number };

/** What every worksheet page gets: the paper, the title, what to show and the instruction line. */
export interface SheetProps {
  paper: PaperBox;
  title: string;
  show: ShowParts;
  /** The teacher's instruction; empty uses the template's own (null = none). */
  instruction: string;
  /** The question all the cards share, said once at the top (see teacherCards). */
  lead?: string | null;
  /** Language of the activity, for the worksheet's own instructions. */
  lang?: PrintLang;
}

export type PrintLang = "es" | "en" | "fr";
/** The worksheet's own instructions, in the language of the activity. */
const SAY: Record<PrintLang, { matchPics: string; match: string; quiz: string }> = {
  es: { matchPics: "Une con una línea cada imagen con su palabra.", match: "Une con una línea cada pareja.", quiz: "Marca la respuesta correcta." },
  en: { matchPics: "Draw a line from each picture to its word.", match: "Draw a line to join each pair.", quiz: "Tick the right answer." },
  fr: { matchPics: "Relie chaque image à son mot.", match: "Relie chaque paire.", quiz: "Coche la bonne réponse." },
};

export function Page({ paper, children, label, footer }: { paper: PaperBox; children: ReactNode; label: string; footer?: boolean }) {
  const { w, h } = paper;
  return (
    <div
      data-print-page
      aria-label={label}
      className="ls-print-page relative overflow-hidden bg-white"
      style={{ width: w, height: h, padding: MARGIN, color: INK, fontFamily: "var(--font-sans)", boxSizing: "border-box" }}
    >
      {children}
      {footer && (
        <div style={{ position: "absolute", left: MARGIN, right: MARGIN, bottom: MARGIN - 26, display: "flex", justifyContent: "space-between", fontSize: 10, color: LINE, fontWeight: 700 }}>
          <span>Made with LextroSpeak</span>
        </div>
      )}
    </div>
  );
}

/** Title with Date and Name lines, as on a worksheet; each part can be hidden in Options. */
export function WorksheetHeader({ title, show }: { title: string; show: Pick<ShowParts, "title" | "name" | "date"> }) {
  if (!show.title && !show.name && !show.date) return null;
  return (
    <div style={{ borderBottom: `3px solid ${BRAND}`, paddingBottom: 10, marginBottom: 18, display: "flex", alignItems: "flex-end", gap: 18, minHeight: 36, boxSizing: "border-box" }}>
      <h2 style={{ flex: 1, fontSize: 22, fontWeight: 800, textTransform: "uppercase", lineHeight: 1.15, margin: 0 }}>{show.title ? title || "Untitled" : ""}</h2>
      {show.date && <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>Date: <span style={{ display: "inline-block", width: 96, borderBottom: `1px solid ${INK}` }} /></span>}
      {show.name && <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>Name: <span style={{ display: "inline-block", width: 150, borderBottom: `1px solid ${INK}` }} /></span>}
    </div>
  );
}

function Instruction({ text, fallback, lead }: { text: string; fallback: string | null; lead?: string | null }) {
  const t = text.trim() || fallback;
  if (!t && !lead) return null;
  return (
    <p style={{ fontSize: 13, margin: "0 0 12px", color: SOFT, height: 20, lineHeight: "20px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
      {lead && <strong style={{ fontSize: 16, color: INK, marginRight: 8 }}>{lead}</strong>}
      {t}
    </p>
  );
}

/** A face: picture and/or text, fitted into its box. */
export function FaceView({ face, textSize = 20, imageMax = "70%", row = false, start = false }: { face: PrintFace | null; textSize?: number; imageMax?: string; row?: boolean; start?: boolean }) {
  if (!face) return null;
  const src = printSrc(face.imageUrl);
  const text = face.text.trim();
  // Picture and word side by side: the picture sits in a square slot of the same size on every
  // line, so the pictures and the words each line up in a column.
  const side = row && src && text;
  const img = src && (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={face.imageAlt || face.text} crossOrigin="anonymous" style={side ? { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" } : { maxHeight: row && !imageMax.endsWith("px") ? "100%" : imageMax, maxWidth: "90%", objectFit: "contain", flexShrink: 1, minHeight: 0 }} />
  );
  return (
    <div style={{ display: "flex", flexDirection: row ? "row" : "column", alignItems: "center", justifyContent: start || side ? "flex-start" : "center", gap: row ? 12 : 6, width: "100%", height: "100%", minWidth: 0 }}>
      {side ? (
        <div style={{ height: imageMax.endsWith("px") ? imageMax : "100%", aspectRatio: "1", maxWidth: "45%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{img}</div>
      ) : (
        img
      )}
      {text && <span style={{ fontSize: textSize, fontWeight: 700, textAlign: start || side ? "left" : "center", lineHeight: 1.15, overflowWrap: "anywhere", minWidth: 0 }}>{face.text}</span>}
    </div>
  );
}

/** Flash cards as a table: one card per row, front on the left and back on the right. */
export function CardTablePage({ cards, rows, contentH, index, oneSide, ...p }: SheetProps & { cards: PrintCard[]; rows: number; contentH: number; index: number; oneSide: boolean }) {
  const rowH = Math.floor(contentH / rows);
  return (
    <Page paper={p.paper} label={`Flash cards, page ${index + 1}`} footer={p.show.footer}>
      <WorksheetHeader title={p.title} show={p.show} />
      <Instruction text={p.instruction} fallback={null} lead={p.lead} />
      <div style={{ border: `1.5px solid ${INK}`, borderRadius: 6, overflow: "hidden" }}>
        {cards.map((c, i) => {
          const hh = rowH - (i === cards.length - 1 ? 3 : 0);
          const cell = { height: hh, padding: 8, boxSizing: "border-box" as const, overflow: "hidden", minWidth: 0 };
          const size = Math.min(26, Math.max(14, rowH / 4));
          const img = `${hh - 16}px`;
          return (
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: oneSide ? "1fr" : "1fr 1fr", height: hh, borderTop: i ? `1px solid ${LINE}` : undefined, boxSizing: "border-box" }}>
              <div style={cell}>
                <FaceView face={c.front} textSize={size} imageMax={img} row={!!c.front.imageUrl && !!c.front.text.trim()} />
              </div>
              {!oneSide && (
                <div style={{ ...cell, borderLeft: `1.5px dashed ${LINE}` }}>
                  <FaceView face={c.back} textSize={size} imageMax={img} row={!!c.back?.imageUrl && !!c.back?.text.trim()} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Page>
  );
}

/** Cut-out cards, 2 × 4 on a sheet; back sheets are laid out for duplex printing. */
export function CardSheetPage({ sheet, paper, index }: { sheet: CardSheet; paper: PaperBox; index: number }) {
  const { w, h } = paper;
  const cw = (w - 2 * MARGIN) / CARD_COLS;
  const ch = (h - 2 * MARGIN) / CARD_ROWS;
  return (
    <Page paper={paper} label={`Flash cards, sheet ${index + 1} (${sheet.side})`}>
      <div style={{ position: "relative", width: w - 2 * MARGIN, height: h - 2 * MARGIN, display: "grid", gridTemplateColumns: `repeat(${CARD_COLS}, ${cw}px)`, gridTemplateRows: `repeat(${CARD_ROWS}, ${ch}px)` }}>
        {sheet.slots.map((s, i) => (
          <div key={i} style={{ position: "relative", border: `1.5px dashed ${LINE}`, marginLeft: i % CARD_COLS ? -1.5 : 0, marginTop: i >= CARD_COLS ? -1.5 : 0, padding: 16 }}>
            {s && <FaceView face={s.face} textSize={26} />}
          </div>
        ))}
        <span aria-hidden style={{ position: "absolute", top: -26, left: -4, fontSize: 18, color: LINE }}>✂</span>
        <span style={{ position: "absolute", bottom: -30, right: 0, fontSize: 10, color: LINE, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{sheet.side === "back" ? "Back — print on the reverse" : "Front"}</span>
      </div>
    </Page>
  );
}

export function MatchPageView({ page, index, contentH, ...p }: SheetProps & { page: MatchPage; index: number; contentH: number }) {
  const rows = Math.max(1, page.left.length);
  const rowH = Math.min(96, Math.floor((contentH + 18) / rows));
  const boxW = Math.min(280, Math.floor((p.paper.w - 2 * MARGIN - 60) * 0.36));
  const dot = (side: "left" | "right") => (
    <span style={{ position: "absolute", top: "50%", [side]: -22, width: 12, height: 12, marginTop: -6, borderRadius: 999, border: `2px solid ${INK}`, background: "white" }} />
  );
  const box = (f: PrintFace, side: "left" | "right") => (
    <div style={{ position: "relative", width: boxW, height: rowH - 18, border: `1.5px solid ${LINE}`, borderRadius: 12, padding: 8, boxSizing: "border-box" }}>
      <FaceView face={f} textSize={18} imageMax="100%" row={!!f.imageUrl && !!f.text.trim()} />
      {dot(side === "left" ? "right" : "left")}
      <span style={{ position: "absolute", top: "50%", [side === "left" ? "right" : "left"]: -11, width: 11, height: 2, background: INK }} />
    </div>
  );
  return (
    <Page paper={p.paper} label={`Match up, page ${index + 1}`} footer={p.show.footer}>
      <WorksheetHeader title={p.title} show={p.show} />
      <Instruction text={p.instruction} fallback={SAY[p.lang ?? "en"][page.left.some((l) => l.face.imageUrl && !l.face.text.trim()) && page.right.every((r) => !r.face.imageUrl) ? "matchPics" : "match"]} lead={p.lead} />
      <div style={{ display: "grid", gridTemplateColumns: `${boxW}px 1fr ${boxW}px`, rowGap: 18, alignItems: "center", padding: "0 30px" }}>
        {page.left.map((l, i) => (
          <div key={l.cardId} style={{ display: "contents" }}>
            {box(l.face, "left")}
            <span />
            {box(page.right[i].face, "right")}
          </div>
        ))}
      </div>
    </Page>
  );
}

/** A quiz page: two columns of questions split by a dashed rule; each choice has its letter and a box to tick. */
export function QuizPageView({ columns, index, first, answers, letters, ...p }: SheetProps & { columns: QuizItem[][]; index: number; first: boolean; answers: boolean; letters: boolean }) {
  return (
    <Page paper={p.paper} label={`Quiz, page ${index + 1}`} footer={p.show.footer}>
      <WorksheetHeader title={p.title} show={p.show} />
      {first ? <Instruction text={p.instruction} fallback={SAY[p.lang ?? "en"].quiz} lead={p.lead} /> : p.instruction.trim() ? <Instruction text={p.instruction} fallback={null} /> : null}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 24 }}>
        {[0, 1].map((ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0, paddingLeft: ci ? 24 : 0, borderLeft: ci ? `1.5px dashed ${LINE}` : undefined }}>
            {(columns[ci] ?? []).map((it) => {
              const pics = quizHasPictures(it);
              return (
                <div key={it.cardId} style={{ breakInside: "avoid" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, height: it.question.imageUrl ? 80 : 30 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, width: 26, flexShrink: 0 }}>{it.number}.</span>
                    <div style={{ flex: 1, height: "100%", minWidth: 0 }}>
                      <FaceView face={it.question} textSize={16} imageMax="100%" row start />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 8, rowGap: 6, marginTop: 8, paddingLeft: 26 }}>
                    {it.options.map((o, i) => (
                      <div key={o.key} style={{ display: "flex", alignItems: "center", gap: 6, height: pics ? 56 : 30, minWidth: 0 }}>
                        {letters && <span style={{ fontSize: 13, fontWeight: 800, width: 14, flexShrink: 0 }}>{QUIZ_LETTERS[i]}</span>}
                        <span style={{ position: "relative", width: 16, height: 16, flexShrink: 0, border: `1.5px solid ${INK}`, borderRadius: 3, boxSizing: "border-box" }}>
                          {answers && o.correct && <span style={{ position: "absolute", left: 1, top: -6, fontSize: 18, fontWeight: 900, color: BRAND, lineHeight: 1 }}>✓</span>}
                        </span>
                        <div style={{ flex: 1, height: "100%", minWidth: 0, display: "flex", alignItems: "center" }}>
                          {o.face ? <FaceView face={o.face} textSize={pics ? 13 : 15} imageMax="100%" row start /> : <span style={{ flex: 1, borderBottom: `1px solid ${LINE}`, height: "60%" }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Page>
  );
}

export function AnswerKeyPage({ items, paper, title, footer }: { items: QuizItem[]; paper: PaperBox; title: string; footer: boolean }) {
  return (
    <Page paper={paper} label="Quiz answer key" footer={footer}>
      <WorksheetHeader title={`${title} — Answer key`} show={{ title: true, name: false, date: false }} />
      <div style={{ columns: 4, fontSize: 16, lineHeight: 2 }}>
        {items.map((it) => (
          <div key={it.cardId}><strong>{it.number}.</strong> {it.correctLetter}</div>
        ))}
      </div>
    </Page>
  );
}

export function WheelPage({ faces, index, total, cutOut, contentH, ...p }: SheetProps & { faces: Array<{ cardId: string; face: PrintFace }>; index: number; total: number; cutOut: boolean; contentH: number }) {
  const { w } = p.paper;
  const D = Math.min(w - 2 * MARGIN - 20, contentH - 20);
  const R = D / 2 - 24;
  const c = D / 2;
  const n = Math.max(1, faces.length);
  const step = 360 / n;
  const item = Math.min(150, Math.max(64, (2 * Math.PI * R * 0.6) / n - 10));
  return (
    <Page paper={p.paper} label={`Spin the wheel ${index + 1}`} footer={p.show.footer}>
      <WorksheetHeader title={total > 1 ? `${p.title} (${index + 1}/${total})` : p.title} show={p.show} />
      <Instruction text={p.instruction} fallback={null} lead={p.lead} />
      <div style={{ position: "relative", width: D, height: D, margin: "10px auto 0" }}>
        <svg width={D} height={D} viewBox={`0 0 ${D} ${D}`} style={{ position: "absolute", inset: 0 }} aria-hidden>
          {cutOut && <circle cx={c} cy={c} r={D / 2 - 4} fill="none" stroke={LINE} strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" />}
          {faces.map((f, i) => (
            <path key={f.cardId} d={sectorPath(c, c, R, i * step, (i + 1) * step)} fill="white" stroke="#7d8597" strokeWidth={1.2} />
          ))}
          <circle cx={c} cy={c} r={R} fill="none" stroke={INK} strokeWidth={3} />
          <circle cx={c} cy={c} r={11} fill="white" stroke={INK} strokeWidth={2} />
          <line x1={c - 6} y1={c} x2={c + 6} y2={c} stroke={INK} strokeWidth={1.5} />
          <line x1={c} y1={c - 6} x2={c} y2={c + 6} stroke={INK} strokeWidth={1.5} />
        </svg>
        {cutOut && <span aria-hidden style={{ position: "absolute", top: -6, left: c - 10, fontSize: 22, color: LINE, background: "white" }}>✂</span>}
        {faces.map((f, i) => {
          const a = ((i + 0.5) * step * Math.PI) / 180;
          const rr = n === 1 ? 0 : R * 0.64;
          const x = c + rr * Math.sin(a);
          const y = c - rr * Math.cos(a);
          return (
            <div key={f.cardId} style={{ position: "absolute", left: x - item / 2, top: y - item / 2, width: item, height: item }}>
              <FaceView face={f.face} textSize={Math.max(12, Math.min(20, item / 6))} imageMax="72%" />
            </div>
          );
        })}
      </div>
    </Page>
  );
}
