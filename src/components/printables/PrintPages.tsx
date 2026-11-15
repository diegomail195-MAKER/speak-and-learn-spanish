// The printable pages themselves, drawn at their real size (CSS px at 96 dpi). The same
// components feed the preview (scaled), the browser print and the PDF.
import type { ReactNode } from "react";
import {
  CARD_COLS,
  CARD_ROWS,
  MARGIN,
  PAPER,
  QUIZ_LETTERS,
  sectorPath,
  type CardSheet,
  type MatchPage,
  type PaperSize,
  type PrintFace,
  type QuizItem,
} from "@/lib/printables/layout";
import { printSrc } from "@/lib/printables/fromGame";

const INK = "#1f2a44";
const LINE = "#9aa1b3";
const BRAND = "#d93a30";

export function Page({ size, children, label }: { size: PaperSize; children: ReactNode; label: string }) {
  const { w, h } = PAPER[size];
  return (
    <div
      data-print-page
      aria-label={label}
      className="ls-print-page relative overflow-hidden bg-white"
      style={{ width: w, height: h, padding: MARGIN, color: INK, fontFamily: "var(--font-sans)", boxSizing: "border-box" }}
    >
      {children}
    </div>
  );
}

/** Title with Name and Date lines, as on a worksheet. */
export function WorksheetHeader({ title, nameDate = true }: { title: string; nameDate?: boolean }) {
  return (
    <div style={{ borderBottom: `3px solid ${BRAND}`, paddingBottom: 10, marginBottom: 18, display: "flex", alignItems: "flex-end", gap: 18 }}>
      <h2 style={{ flex: 1, fontSize: 22, fontWeight: 800, textTransform: "uppercase", lineHeight: 1.15, margin: 0 }}>{title || "Untitled"}</h2>
      {nameDate && (
        <>
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>Date: <span style={{ display: "inline-block", width: 96, borderBottom: `1px solid ${INK}` }} /></span>
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>Name: <span style={{ display: "inline-block", width: 150, borderBottom: `1px solid ${INK}` }} /></span>
        </>
      )}
    </div>
  );
}

/** A face: picture and/or text, fitted into its box. */
export function FaceView({ face, textSize = 20, imageMax = "70%", row = false, start = false }: { face: PrintFace | null; textSize?: number; imageMax?: string; row?: boolean; start?: boolean }) {
  if (!face) return null;
  const src = printSrc(face.imageUrl);
  return (
    <div style={{ display: "flex", flexDirection: row ? "row" : "column", alignItems: "center", justifyContent: start ? "flex-start" : "center", gap: row ? 10 : 6, width: "100%", height: "100%", minWidth: 0 }}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={face.imageAlt || face.text} crossOrigin="anonymous" style={{ maxHeight: row ? "100%" : imageMax, maxWidth: row ? "45%" : "90%", objectFit: "contain", flexShrink: 1, minHeight: 0 }} />
      )}
      {face.text.trim() && (
        <span style={{ fontSize: textSize, fontWeight: 700, textAlign: "center", lineHeight: 1.15, overflowWrap: "anywhere", minWidth: 0 }}>{face.text}</span>
      )}
    </div>
  );
}

export function CardSheetPage({ sheet, size, index }: { sheet: CardSheet; size: PaperSize; index: number }) {
  const { w, h } = PAPER[size];
  const cw = (w - 2 * MARGIN) / CARD_COLS;
  const ch = (h - 2 * MARGIN) / CARD_ROWS;
  return (
    <Page size={size} label={`Flash cards, sheet ${index + 1} (${sheet.side})`}>
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

export function MatchPageView({ page, size, title, index }: { page: MatchPage; size: PaperSize; title: string; index: number }) {
  const rowH = 96;
  const dot = (side: "left" | "right") => (
    <span style={{ position: "absolute", top: "50%", [side]: -22, width: 12, height: 12, marginTop: -6, borderRadius: 999, border: `2px solid ${INK}`, background: "white" }} />
  );
  const box = (f: PrintFace, side: "left" | "right") => (
    <div style={{ position: "relative", width: 250, height: rowH - 18, border: `1.5px solid ${LINE}`, borderRadius: 12, padding: 8 }}>
      <FaceView face={f} textSize={18} imageMax="100%" row={!!f.imageUrl && !!f.text.trim()} />
      {dot(side === "left" ? "right" : "left")}
      <span style={{ position: "absolute", top: "50%", [side === "left" ? "right" : "left"]: -11, width: 11, height: 2, background: INK }} />
    </div>
  );
  return (
    <Page size={size} label={`Match up, page ${index + 1}`}>
      <WorksheetHeader title={title} />
      <p style={{ fontSize: 13, margin: "0 0 12px", color: "#4a5572" }}>Draw a line to join each pair.</p>
      <div style={{ display: "grid", gridTemplateColumns: "250px 1fr 250px", rowGap: 18, alignItems: "center", padding: "0 30px" }}>
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

export function QuizPageView({ items, size, title, index, first }: { items: QuizItem[]; size: PaperSize; title: string; index: number; first: boolean }) {
  return (
    <Page size={size} label={`Quiz, page ${index + 1}`}>
      <WorksheetHeader title={title} />
      {first && <p style={{ fontSize: 13, margin: "0 0 12px", color: "#4a5572" }}>Circle the right answer.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {items.map((it) => {
          const pics = !!it.question.imageUrl || it.options.some((o) => o.face?.imageUrl);
          return (
            <div key={it.cardId} style={{ breakInside: "avoid" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, height: it.question.imageUrl ? 90 : 34 }}>
                <span style={{ fontSize: 18, fontWeight: 800, width: 30 }}>{it.number}.</span>
                <div style={{ flex: 1, height: "100%", display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ maxWidth: 420, height: "100%" }}>
                    <FaceView face={it.question} textSize={18} imageMax="100%" row start />
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8, paddingLeft: 40 }}>
                {it.options.map((o, i) => (
                  <div key={o.key} style={{ display: "flex", alignItems: "center", gap: 10, height: pics ? 64 : 30 }}>
                    <span style={{ display: "grid", placeItems: "center", width: 26, height: 26, flexShrink: 0, borderRadius: 999, border: `1.5px solid ${INK}`, fontSize: 13, fontWeight: 800 }}>{QUIZ_LETTERS[i]}</span>
                    <div style={{ flex: 1, height: "100%", minWidth: 0, display: "flex", alignItems: "center" }}>
                      {o.face ? <FaceView face={o.face} textSize={15} imageMax="100%" row start /> : <span style={{ flex: 1, borderBottom: `1px solid ${LINE}`, height: "60%" }} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Page>
  );
}

export function AnswerKeyPage({ items, size, title }: { items: QuizItem[]; size: PaperSize; title: string }) {
  return (
    <Page size={size} label="Quiz answer key">
      <WorksheetHeader title={`${title} — Answer key`} nameDate={false} />
      <div style={{ columns: 4, fontSize: 16, lineHeight: 2 }}>
        {items.map((it) => (
          <div key={it.cardId}><strong>{it.number}.</strong> {it.correctLetter}</div>
        ))}
      </div>
    </Page>
  );
}

export function WheelPage({ faces, size, title, index, total }: { faces: Array<{ cardId: string; face: PrintFace }>; size: PaperSize; title: string; index: number; total: number }) {
  const { w } = PAPER[size];
  const D = w - 2 * MARGIN - 20;
  const R = D / 2 - 24;
  const c = D / 2;
  const n = Math.max(1, faces.length);
  const step = 360 / n;
  const item = Math.min(150, Math.max(64, (2 * Math.PI * R * 0.6) / n - 10));
  return (
    <Page size={size} label={`Spin the wheel ${index + 1}`}>
      <WorksheetHeader title={total > 1 ? `${title} (${index + 1}/${total})` : title} nameDate={false} />
      <div style={{ position: "relative", width: D, height: D, margin: "10px auto 0" }}>
        <svg width={D} height={D} viewBox={`0 0 ${D} ${D}`} style={{ position: "absolute", inset: 0 }} aria-hidden>
          <circle cx={c} cy={c} r={D / 2 - 4} fill="none" stroke={LINE} strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" />
          {faces.map((f, i) => (
            <path key={f.cardId} d={sectorPath(c, c, R, i * step, (i + 1) * step)} fill="white" stroke="#7d8597" strokeWidth={1.2} />
          ))}
          <circle cx={c} cy={c} r={R} fill="none" stroke={INK} strokeWidth={3} />
          <circle cx={c} cy={c} r={11} fill="white" stroke={INK} strokeWidth={2} />
          <line x1={c - 6} y1={c} x2={c + 6} y2={c} stroke={INK} strokeWidth={1.5} />
          <line x1={c} y1={c - 6} x2={c} y2={c + 6} stroke={INK} strokeWidth={1.5} />
        </svg>
        <span aria-hidden style={{ position: "absolute", top: -6, left: c - 10, fontSize: 22, color: LINE, background: "white" }}>✂</span>
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
