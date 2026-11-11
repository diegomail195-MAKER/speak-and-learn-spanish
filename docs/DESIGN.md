# Speak & Learn Spanish — visual identity ("playful editorial")

All tokens live in `src/app/globals.css` (`@theme`). Screens use the token names, never raw hex.

## Colour
| Role | Token | Hex | Use |
|---|---|---|---|
| Primary | `indigo` | #303477 | main buttons, current nav tab, selected answers |
| Secondary | `coral` (AA) / `coral-bright` | #C4452C / #F16B50 | small accents, eyebrows; bright tone only for drawings, rules, the tilde |
| Reward | `sun` | #F3C55D | stars, boxes, "practising" — text on it is always ink; text in its family is `sun-ink` |
| Support / voice | `aqua`, `teal` | #BEE7E5, #1D6F6B | anything microphone or listening |
| Background | `paper` | #FFF8EE | page |
| Surface | `card` | #FFFFFF | reading and exercise panels |
| Text | `ink` | #24283B | body text, outlines and printed shadows |
| Correct | `leaf` | #2E7550 | always with a check mark and words |
| Info / unsure | `sky` | #3A4FA0 | "I didn't hear you", previews |

Contrast (WCAG 2.2 AA): white on indigo 11.2:1, white on coral 5:1, ink on sun 9:1, muted on paper 5.8:1,
teal-dark on aqua 5.7:1. Brand coral #F16B50 is 3:1 with white, so it is never used behind text.

## Type
- **Bricolage Grotesque** (`font-display`): headings, big questions, numbers.
- **DM Sans** (`font-sans`): instructions, navigation, answers. Open, very legible letterforms for early readers.

## Signature elements
- **Printed controls**: 2px ink outline + small offset shadow; pressing pushes into the shadow (`.press`).
- **Tilde underline** (`.tilde-underline`): the ñ's tilde, hand-drawn, under one key word per heading and under the current nav tab.
- **Stacked index cards**: question pictures and flashcards sit on a coloured offset card (aqua / sun).
- **Firm corners** (10–14px), pills only for chips and status.
- **Line icons** (`components/ui/Icon.tsx`) next to words instead of emoji.

## Learning screens
Every activity has the same order: title + progress (top) → task line (indigo chip) → picture → question
(largest text) → hint (mango note with bulb) → feedback (words + mark + colour) → microphone state → controls.
Correct answers land like a stamp; wrong answers never shake. All motion is disabled with `prefers-reduced-motion`.
