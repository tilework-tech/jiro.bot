# v05 — "Same ticket. Two kitchens." comparison scene (Restaurant tour)

Source: `/home/sprite/org/workspace/jiro.bot-media/frames/v05_0611b/f_001.png` … `f_013.png` (13 frames, 0.5 s apart, 6.5 s).
Screenshot is 1280×732; the website viewport occupies roughly x 40–1245, y 160–685 (browser chrome and the demo-gallery strip above y≈160 are ignored). All pixel coordinates below are in screenshot space at that size; treat them as proportions of a ~1205 px wide viewport.

Working crops (3× nearest-neighbour upscales of both panels, header, belt) were produced in `/tmp/crops/` to read the copy; everything below was transcribed from those.

---

## 1. Scene identity and purpose

- Scene: "Restaurant tour" demo, room 3 of 8 (the right-edge scene nav shows 8 dots, 3rd active, labelled **DINING ROOM**).
- Heading: **SAME TICKET. TWO KITCHENS.**  Sub: `Ticket #482 · Checkout total is wrong when a coupon and a gift card are combined`.
- Purpose: a side-by-side, auto-playing "two agents, one bug" comparison. Left = a generic coding agent that pattern-matches, shotguns `as any`, sprays changes across 5 files and claims "All tests pass". Right = Jiro, which reads first, names the root cause in one sentence, writes the failing test before touching code, and runs it. The scene is the product's core argument (discipline over speed), dressed as two kitchen stations in a sushi bar; the conveyor belt with plates runs underneath as ambience.
- Nothing is interactive in the 6.5 s: both transcripts stream automatically, the belt scrolls, the easter-egg counter stays at 0/88.

## 2. Layout

Measured at the 1280 px screenshot.

### Header bar (y ≈ 160–200, full width)
- Dark bar-backdrop strip (blurred pixel-art back bar: shelves, bottles, two brick/plaster pillars at x≈250 and x≈1000, warm string lights hanging in three catenary swags with ~14 glowing bulbs, bulb dots ≈ 4 px, colour #e6c27a→#8a6a3a). Overall bar luminance is very low (#121011–#252019).
- Left: site logo — 24 px pixel avatar (sushi-chef robot head: white toque, red/orange body, black visor) at x≈58, then `JIRO.BOT` in the pixel display font, cream.
- Title `SAME TICKET. TWO KITCHENS.` starts at x≈150 — i.e. **it overlaps the logo** (reads "JIRO.BOTAME TICKET…"). A tiny green `nori` tag (#4ccc5a, ~8 px) is also stuck at x≈180 under the "AME". Title: pixel display font, ~18 px cap height, letter-spaced, cream #e8e0d0 with a 1 px dark outline/shadow.
- Sub-header runs inline on the same baseline immediately after the title, from x≈447 to x≈915: `Ticket #482 · Checkout total is wrong when a coupon and a gift card are combined` — monospace ~11 px, dim grey #8a847a, sitting directly on the string lights (poor contrast).
- Right: mute button (x 1080–1104, y 168–193): dark square #2a2622 with 1 px grey border #5a544b, white/grey speaker-with-waves icon. Then **RESERVE A SEAT** button (x 1112–1222, y 168–193): flat orange #cf7a3d fill, 1 px darker orange edge #b2642c, 2 px dark-brown bottom "pixel bevel", label in the pixel display font, dark brown #4a2a12, letter-spaced.

### The two panels (y ≈ 200–527, each ≈ 490 × 327)
| | GENERIC AGENT (left) | JIRO (right) |
|---|---|---|
| x range | 133 – 622 | 641 – 1131 |
| gap between | 19 px (backdrop shows through) | |
| border | 2 px, dark brown/amber #312017 → #4a3020 (outer glow of ~2 px darker) | 2 px, green #2f7a3a (outer edge brighter #3fa34a), inner shadow #0b2300 |
| panel bg | #0e0c0a | #0b0908 |
| header row 1 (y 205–222) | `GENERIC AGENT` pixel display font, cream #d8cfbd, letter-spaced, left | `JIRO` same font, green #4ccc5a, left |
| header tagline (row 1, right-aligned, mono 11 px, cream #cfc6b4) | `Says "All tests pass". The combo total is still wrong.` | `Failing test first, root cause named, one-function fix.` |
| header row 2 (y 226–240, bg #161312) | three grey dots #3a3632 (traffic lights), **Generic agent** bold cream, `· checkout-svc` grey #7a7268, right: `working` orange #c8732f | three grey dots, **Jiro** bold cream, `· checkout-svc` grey, right: `working` orange |
| separator | 1 px #2a2420 under row 2 | same |
| body | monospace ~11 px, line-height ~12 px, padding 10 px; auto-scrolls pinned to bottom | same |

Body typography inside both panels:
- Ticket block: 2 px orange left bar #d37c3d; `Ticket #482` orange #d37c3d; description cream #e4dccb.
- Prose step: filled orange circle bullet (6 px, #d37c3d) + cream text, wraps at panel width.
- Tool step: small orange `▸` (4 px) + keyword `Read` / `Search` in orange #d37c3d + argument in cream; sub-line below in grey #7a7268 (`47 matches in 19 files`, `12 lines · computeTotal()` etc.).
- Diff card: slightly lighter bg #141211, 1 px border #221e1a, 4 px radius; header `✎ path` with orange pencil icon and orange filename; `(new file)` grey note; context lines grey #a09888; `+` lines green text #7fd37f on #171e14 row tint; `-` lines salmon #e06c5c on #2a1512 row tint; `… 22 more lines (+19 -6)` grey italic.
- Typing cursor: solid orange block #d37c3d, ~6×11 px, at the end of the currently-typed prose line (Jiro panel only). No blink observed across 13 frames.

### Backdrop between header and belt (y 200–540)
Almost fully covered by the two panels. Visible only in the 19 px gap and at the far edges: a dark wood/brick bar interior with vertical dark-brown posts (#3a2a1c) at the gap edges, a deeper near-black room (#161613) behind, a hint of a counter/shelf shape at y≈400–480 in the gap. Effectively black-on-black.

### Conveyor belt (y ≈ 540–650, x 118–1162, hard-clipped at both ends)
- y 541–546: top rail, 2 px bright orange #c97a35 over 3 px #5f3a20.
- y 546–608: belt surface #1b1918 with vertical slat lines every ~16 px (#2a2725, 1 px) and a faint horizontal seam at y≈578.
- y 608–612: second thin orange rail #c97a35.
- y 612–648: front counter/wood apron #8d5a37 → #6f4528 (flat, with a stretched blotchy gradient); 1 px dark edge at the bottom #3c1e17.
- y 648–685: dark floor/page strip #180f13 → #000.
- Plates: flat pixel ellipses ≈ 30 × 10 px with 1 px dark outline; colours green #3aa655, gold #d4a62a, blue #2b5fc2, black #1a1a1a, cream #e8dcc4.
- Items ≈ 32 × 28 px sprites, 1 px black outline, 16-bit shading, sitting on the plate centre at y≈568.

### Scene nav (right edge, x≈1219, y 370–475)
Eight 9 px hollow square dots (#8a847a outline) on a 15 px vertical pitch, connected by 1 px dotted lines; the 3rd dot is a filled orange square #d37c3d (active) and the connectors above it are solid orange. A pill label `DINING ROOM` (orange pixel font on #1a1512) appears to its left in frames 2–6 only.

### Easter-egg counter (bottom-left, x 43–157, y 657–676)
Rounded 2 px dark rect, border #4a4038, fill #2a2420 (sampled inner #3e362e), small orange 4-point sparkle/plus icon (#d37c3d) then `0/88 EASTER EGGS` in the pixel display font, cream #d8cfbd, ~9 px, letter-spaced. Never changes in the clip.

### Other chrome
- `Open full size ↗` pill bottom-right (x 1165–1235, y 657–676) is the demo-gallery wrapper, not the site.
- A mouse pointer is visible at (1037, 432) in frame 1 only.

## 3. Colour and light

Approximate palette (sampled, then rounded):

| Role | Hex |
|---|---|
| Page/room black | #000000 / #0a0806 |
| Bar backdrop | #161613, #121011 (header strip), posts #3a2a1c |
| String-light bulbs | #e6c27a core, #8a6a3a halo |
| Panel bg | #0e0c0a (generic), #0b0908 (Jiro) |
| Panel header rows | #161312 |
| Generic border | #312017 / #4a3020 |
| Jiro border | #2f7a3a edge, #3fa34a highlight, #0b2300 inner |
| Jiro title green | #4ccc5a |
| Orange accent (bullets, Ticket, Read/Search, cursor, working, button, nav active, egg icon) | #d37c3d (button #cf7a3d, "working" #c8732f) |
| Cream text | #e4dccb (body), #d8cfbd (display font) |
| Grey secondary | #7a7268 / #8a847a |
| Context code | #a09888 |
| Diff add | text #7fd37f, row #171e14 |
| Diff remove | text #e06c5c, row #2a1512 |
| Belt rails | #c97a35 |
| Belt surface | #1b1918, slats #2a2725 |
| Counter apron | #8d5a37 → #6f4528, edge #3c1e17 |
| Plates | green #3aa655, gold #d4a62a, blue #2b5fc2, black #1a1a1a, cream #e8dcc4 |

Light: the only "light sources" are the string bulbs in the header strip and the orange accents. The scene is ~90 % values under #202020; the panels are the brightest objects purely because of text. The Jiro panel's green border is the single hue that differs from the brown/orange world, which is what sells "this one is different".

Fonts: titles/labels in a chunky letter-spaced pixel display face (Silkscreen / Press-Start-like, caps only); everything inside the panels and the sub-header in a small monospace (~11 px, looks like a hinted JetBrains/Plex Mono rather than a bitmap font).

## 4. Copy — verbatim

### Header
- Title: `SAME TICKET. TWO KITCHENS.`
- Sub: `Ticket #482 · Checkout total is wrong when a coupon and a gift card are combined`
- Buttons: `RESERVE A SEAT`; mute icon (no label).
- Nav label: `DINING ROOM`; counter: `0/88 EASTER EGGS`.

### Left panel — GENERIC AGENT
Header: `GENERIC AGENT` — `Says "All tests pass". The combo total is still wrong.` — `Generic agent · checkout-svc` — `working`

Transcript (in order; the ticket block is only half visible at the top of frame 1, its text is identical to Jiro's):

```
┃ Ticket #482
┃ Checkout total is wrong when a coupon and a gift card are combined.

● I'll fix the checkout total calculation! Let me explore the codebase.

▸ Search total|coupon|gift
  47 matches in 19 files

▸ Read src/checkout/total.ts (1-20)
  20 lines

● I see the issue! The total isn't calculated correctly when a coupon and a gift card are
  combined. I'll add special handling for this case and make the code more robust.

✎ src/checkout/total.ts
    import { subtotal } from "./cart";
+   import { roundMoney } from "../utils/money";

    export function computeTotal(cart: Cart): number {
      let amount = subtotal(cart.items);
+     // Handle coupon + gift card combination
+     const hasCoupon = cart.adjustments.some((a: any) => a.kind === "percent-off");
+     const hasGift = cart.adjustments.some((a: any) => a.kind === "gift-card");
+     if (hasCoupon && hasGift) {
+       const gc = (cart.adjustments as any).find((a: any) => a.kind === "gift-card");
+       const cp = (cart.adjustments as any).find((a: any) => a.kind === "percent-off");
+       amount = amount * (1 - cp.percent / 100) - gc.cents;
+       const tax = amount * cart.taxRate;
+       return roundMoney(amount + tax) as any;
+     }
      for (const adj of cart.adjustments) {
-       amount = applyAdjustment(amount, adj);
+       amount = applyAdjustment(amount, adj as any) || 0;
      }
-     const tax = Math.round(amount * cart.taxRate);
-     return amount + tax;
+     const tax = amount * cart.taxRate;
+     return roundMoney(amount + tax);
    }

✎ src/checkout/adjustments.ts
    export function applyAdjustment(amount: number, adj: Adjustment) {
+     if (!adj) return amount;
+     if ((adj as any).cents < 0) (adj as any).cents = 0;
      switch (adj.kind) {
        case "percent-off":
-         return Math.round(amount * (1 - adj.percent / 100));
+         return amount * (1 - (adj as any).percent / 100);
        case "amount-off":
        case "gift-card":
          return Math.max(0, amount - adj.cents);
+       default:
+         return amount as any;
      }
  … 22 more lines (+19 -6)

✎ src/checkout/types.ts
    export interface Cart {
-     adjustments: Adjustment[];
+     adjustments: Adjustment[] | any[];
+     giftCardApplied?: boolean;
+     couponApplied?: boolean;
    }

✎ src/utils/money.ts (new file)
+   export function roundMoney(value: any): number {
+     return parseFloat(Number(value).toFixed(2));
+   }
  … 41 more lines (+41 -0)

✎ src/checkout/validate.ts
+     if (adj.kind === "gift-card" && adj.cents <= 0) {
```
(clip ends mid-diff; the tagline implies it later prints an "All tests pass" claim.)

### Right panel — JIRO
Header: `JIRO` — `Failing test first, root cause named, one-function fix.` — `Jiro · checkout-svc` — `working`

```
┃ Ticket #482
┃ Checkout total is wrong when a coupon and a gift card are combined.

● Reading the checkout path before changing anything.

▸ Read src/checkout/total.ts
  12 lines · computeTotal()

▸ Read src/checkout/adjustments.ts
  percent-off · amount-off · gift-card

▸ Search "gift-card"
  4 matches · only total.ts applies it

● Adjustments run in the order the customer added them. A gift card added before a coupon
  shrinks the base that the coupon and the tax are computed on.

● Writing the failing test first.

✎ test/checkout/total.test.ts
-   import { makeCart } from "./fixtures";
+   import { makeCart, type CartInput } from "./fixtures";
+
+   const COMBO = {
+     items: [{ sku: "mug", cents: 10_000 }],
+     taxRate: 0.08,
+     adjustments: [
+       { kind: "gift-card", cents: 2_500 },
+       { kind: "percent-off", percent: 10 },
+     ],
+   } satisfies CartInput;

    describe("computeTotal", () => {
+     it("applies gift cards after coupons and tax", () => {
+       // $100 - 10% = $90 → +8% tax = $97.20 → -$25 card
+       expect(computeTotal(makeCart(COMBO))).toBe(7_220);
+     });
+
+     it("does not depend on adjustment order", () => {
+       const reversed = [...COMBO.adjustments].reverse();
+       const a = computeTotal(makeCart(COMBO));
+       const b = computeTotal(makeCart({ ...COMBO, adjustments: reversed }));
+       expect(a).toBe(b);
+     });

$ pnpm v▮
```
(clip ends while typing the shell command — presumably `pnpm vitest …` → 1 failing test → one-function fix → green.)

## 5. Motion timeline, frame by frame

Belt displacement measured by cross-correlating the belt strip against frame 1; item centres detected per frame (pitch ≈ 127 px).

| Frame | t (s) | Generic panel (left) | Jiro panel (right) | Belt (item x-centres, L→R) | Other |
|---|---|---|---|---|---|
| 1 | 0.0 | Already scrolled: ticket half-clipped under header; prose, Search, Read, "I see the issue", `total.ts` diff down to `const cp = …`. | Ticket, Reading…, 3 tool steps, typing `…A gift car▮` | 134, 257, 384, 511, 637, 763, 891, 1017, 1142 | Mouse pointer at (1037,432) |
| 2 | 0.5 | +5 diff lines (`amount = …` … `}`), scrolled ~45 px | typed `…added before a coupon shrink▮` (+33 chars) | +19 px (149 …1155); rightmost onigiri exiting | `DINING ROOM` nav label appears |
| 3 | 1.0 | +4 lines (`for`, `-amount`, `+amount`, `}`) | `shrinks the base that the coupon and the▮` (+34 chars) | +20 px (169 … 1056); rightmost exited | label visible |
| 4 | 1.5 | +4 lines (`-const tax`, `-return`, `+const tax`, `+return`) | `…tax are computed on.` then new bullet `Writi▮` (+27 chars incl. line break) | +20 px | label visible |
| 5 | 2.0 | +6 lines (`}`, blank, `✎ adjustments.ts` header, `export function…`, 2 `+if`) | `Writing the failing te▮` (+17 chars) | +19 px | label visible |
| 6 | 2.5 | +4 lines (`switch`, `case "percent-off"`, `-return Math.round…`) | `Writing the failing test first.` done; diff card header + 2 import lines pop in (not typed) | +19 px (227 … 1114) | label visible, fading |
| 7 | 3.0 | +4 lines (`+return amount * …`, `case "amount-off"`, `case "gift-card"`, `return Math.max…`) | +3 lines (`+`, `+const COMBO = {`, `+items: …`); whole panel content shifted up 4 px (scroll began) | belt wrapped: new item (UFO) enters at 125; 247, 374, 500, 628, 753, 881, 1007, 1134 | label gone |
| 8 | 3.5 | +3 lines (`+default:`, `+return amount as any;`, `}`) | +4 lines (`taxRate`, `adjustments: [`, `{ kind: "gift-card"…`); ticket block scrolled off the top | +15 px (140 …1147) | |
| 9 | 4.0 | `… 22 more lines (+19 -6)`, `✎ types.ts` header, `export interface Cart {`, `-adjustments`, `+adjustments … | any[]` (+5) | +4 lines (`percent-off`, `],`, `} satisfies CartInput;`) | +19 px | |
| 10 | 4.5 | +2 lines (`giftCardApplied?`, `couponApplied?`) | +4 lines (blank ctx, `describe(…`, `it("applies…`, `// $100 …`) | +19 px | |
| 11 | 5.0 | `}`, blank, `✎ src/utils/money.ts (new file)`, 2 `+` lines (+5) | +4 lines (`expect(…).toBe(7_220)`, `});`, `+`, `it("does not depend…`) | +19 px | |
| 12 | 5.5 | `+ }`, `… 41 more lines (+41 -0)` (+2) | +3 lines (`const reversed`, `const a`, `const b`) | +20 px (217 … 1104) | |
| 13 | 6.0 | `✎ src/checkout/validate.ts` header + 1 `+` line (+3) | +2 lines (`expect(a).toBe(b);`, `});`) then shell prompt `$ pnpm v▮` typing | +20 px (237 … 1123); next item's gold plate entering at x≈118 | |

Rates derived from the above:
- **Jiro prose typewriter**: ≈ 33 chars per 0.5 s → **≈ 65 chars/s** (≈15 ms/char), with a ~150–250 ms pause at the end of a sentence/bullet before the next bullet starts.
- **Diff/code lines (both panels)**: revealed whole-line, ≈ 4 lines per 0.5 s → **≈ 8 lines/s** (≈125 ms/line); the generic panel occasionally pops 5–6 when a card header + blank is included (headers/blank lines cost no extra time).
- **Scrolling**: both panels are pinned to the bottom (new content pushes old up); no easing visible between frames — it is a hard scrollTop = scrollHeight update per line. The Jiro panel starts scrolling at t≈3.0 s when its content first overflows, with a visible 4 px jump.
- **Belt**: left-to-right, **≈ 19.5 px per 0.5 s ≈ 39 px/s** (≈ 3.2 % of viewport width per second). Item pitch ≈ 127 px → a new plate enters from the left every ≈ 3.3 s. Items do not bob; plates do not rotate. Belt wraps seamlessly.
- **Cursor**: orange block, static (no blink detected at 2 fps sampling).
- **No toasts, no easter-egg popups, no sound cue visible** in 6.5 s.
- `DINING ROOM` nav label visible frames 2–6 (≈ 2.5 s), then gone — looks like a hover/auto-label with a timed fade.

## 6. Belt details and item types

Order on the belt, left to right, as first seen in frame 1 (the sequence is a loop; the UFO item enters at frame 7):

1. **Matcha / tea bowl** — grey stone cup, green tea surface, on green plate.
2. **Ebi (shrimp) nigiri** — orange-striped shrimp on rice, on gold plate.
3. **Ebi nigiri** — same sprite, on blue plate.
4. **Seal in a chef's toque** — small grey seal mascot wearing a white hat, on black plate (easter-egg / mascot item).
5. **Fortune cookie** — orange cookie with white paper slip, on cream plate.
6. **Onigiri with sleepy face** — white rice triangle, nori band, closed-eye face, on green plate.
7. **Salmon nigiri** — orange salmon with white stripes, on blue plate.
8. **Maguro (tuna) nigiri** — deep red/pink tuna, on gold plate.
9. **Onigiri** — second rice ball, on blue plate (frame 1 right edge).
10. **UFO abducting a tuna nigiri** (enters frame 7) — grey saucer with a pale yellow-green tractor-beam cone lifting a nigiri, on black plate. Clearly an easter-egg item.
11. (frame 13, mostly off-screen) dark object on a gold plate — unidentified.

Sprite style: ~32×28 px, 1 px black outline, 3–4 tone shading, slight top-left highlight, drawn at 1:1 (no visible upscale blur). Plates are flat ellipses with a 1 px darker rim; items overlap the plate's upper half. Spacing uniform (127 px) — no clustering or gaps, which reads as mechanical.

## 7. Odd / broken — do not repeat

1. **Title collides with the site logo**: "SAME TICKET…" is drawn starting at x≈150, under the `JIRO.BOT` wordmark, producing "JIRO.BOTAME TICKET". A stray green `nori` micro-label also overlaps. Either hide the logo in-scene or offset the title.
2. **Sub-header inline on the same baseline** as the title, in dim grey over the string lights — unreadable at a glance. Put it on its own line with a dark plate behind it.
3. **Taglines spoil the punchline**: "Says "All tests pass". The combo total is still wrong." is visible from t=0, before the generic agent has done anything. Reveal taglines at the end as verdicts.
4. **Panels hide the backdrop**: 19 px gap and a 40 px header strip are all that remain of the bar art. If the room is worth painting, give panels 60–70 % height or stagger them.
5. **No entrance state**: the generic panel is already scrolled and mid-diff at frame 1 (streaming started before the scene was reached). Start both transcripts when the scene is in view and keep them in sync at the ticket block.
6. **Clipped lines under the header rows** (frames 1, 3, 4, 7, 9, 11, 13 show half-cut text directly beneath the "working" row) — no top mask/fade or padding on the scroll container.
7. **No bottom padding**: content butts against the bottom border once scrolling starts (frames 8–13).
8. **Scroll jitter**: a 4 px layout jump at the moment the Jiro panel first overflows (frame 7).
9. **Inconsistent cursors**: Jiro has a block cursor during prose but none during code; the generic panel never shows a cursor — lines just pop. Decide on one model (type prose, pop code is fine, but show a cursor in both).
10. **Cursor never blinks**; a static orange block reads as a glitch.
11. **Generic panel's `as any` spam, five files, "+41 -0" new file** — this is intentional content, keep it; but "47 matches in 19 files" vs Jiro's "4 matches" is the real contrast and should be visually emphasised (it currently sits in grey sub-text).
12. **Easter-egg counter never reacts** even though two egg items (seal chef, UFO) scroll past — no hover affordance, no hint they are clickable.
13. **Belt is hard-clipped** at x=118 and x=1162 with no fade or end-cap, and the backdrop's wooden posts are sliced mid-sprite at the clip edges.
14. **Counter apron has a smeared gradient** (looks like a stretched texture) instead of pixel wood grain.
15. **Belt is perfectly uniform** (same pitch, no bobbing, no empty slots) — reads as mechanical, not like a real kaiten belt; also it never changes speed or pauses.
16. **`DINING ROOM` label** appears and vanishes with no apparent cause (not hover-driven), and names the room differently from the title.
17. **Both statuses stay `working`** for the whole clip; no pass/fail resolution within the demo window means a 6-second viewer sees no verdict.
18. Belt occupies y 540–650 but the panels end at 527 — the 13 px between panel bottoms and the rail is dead black.

## 8. Specs for the rebuild

### 8a. Backdrop generation prompt (16-bit pixel art)

> 16-bit pixel art, SNES/Neo-Geo era, crisp 1:1 pixels, no anti-aliasing, 2:1 wide composition (e.g. 640×320 base canvas, scaled ×2 or ×3 with nearest-neighbour). Interior of a dim Japanese sushi bar at night, straight-on view. Back wall: dark cedar wood panelling (#2a1c12 / #3a2a1c) with a long back-bar shelf holding sake bottles, ceramic jars and small lanterns, two plaster-and-brick pillars framing the wall. Three swags of warm string lights (small amber bulbs #e6c27a with soft 2-tone glow halos #8a6a3a) hang in catenary curves across the top third. Centre-bottom: a horizontal kaiten conveyor belt running the full width — dark rubber belt surface (#1b1918) with evenly spaced vertical slat lines (#2a2725), a thin bright orange guide rail (#c97a35) on the top and bottom edge, and in front of it a warm wooden counter apron (#8d5a37 to #6f4528) with visible 2–3 tone wood grain and a dark edge (#3c1e17). Below the counter, near-black floor (#180f13). Overall very low-key lighting: 85 % of pixels darker than #202020, the string lights and the orange rails are the only bright accents; a faint cool rim light on the pillars. Leave two large empty rectangles (each ~40 % of width, 60 % of height, side by side above the belt) with nothing important painted behind them, as two terminal panels will sit there. Palette limited to ~32 colours: browns, warm blacks, amber, one muted green. No characters, no text, no plates on the belt (plates are separate sprites).

Companion sprite prompt (plates & items): > 16-bit pixel art sprite sheet, 32×32 cells, 1 px black outline, 3–4 shade cel shading, transparent background: flat elliptical sushi plates in green #3aa655, gold #d4a62a, blue #2b5fc2, black #1a1a1a, cream #e8dcc4; items: ebi nigiri, salmon nigiri, maguro nigiri, onigiri with a sleepy face, fortune cookie with paper slip, matcha tea bowl, a small grey seal wearing a chef's toque, a UFO beaming up a nigiri with a pale green tractor-beam cone.

### 8b. Animation spec

```
scene: comparison ("Same ticket. Two kitchens.")
trigger: start when scene is ≥60 % in viewport; reset on leave (or play once and hold on final state)

belt:
  direction: left → right
  speed: 40 px/s at 1200 px-wide viewport  (≈ 3.3 % viewport-width / s); allow ±10 % jitter
  item pitch: 128 px nominal; vary 112–144 px, leave an empty slot every ~7 items
  item bob: ±1 px vertical on a 1.2 s sine (optional), plates do not bob
  wrap: seamless loop; items spawn off-screen left and despawn off-screen right; soft 24 px fade at both clip edges
  easter-egg items (seal chef, UFO): clickable, hover = 1 px glow + cursor pointer; click → counter increments + small toast

panels (both):
  reveal: fade/slide up 200 ms, generic first then Jiro +150 ms
  body: scroll container pinned to bottom; 12 px top mask-gradient and 12 px bottom padding; scroll with 120 ms ease-out when content overflows (no jumps)
  status pill: "working" (orange) → generic ends "done" (green pill, but tagline reveals the lie) / Jiro ends "passing" (green)
  taglines: hidden at start; typed in as the final line of each panel (verdict), not shown in header until then

typing:
  prose (● lines): typewriter 60–70 chars/s (15 ms/char), orange block cursor, blink 530 ms; 250 ms pause after each sentence, 400 ms pause before a new bullet
  tool steps (▸ Read/Search + sub-line): pop whole-step after a 300–500 ms "thinking" delay (three dots animate in the header row 2 while waiting)
  diff cards: header pops, then lines reveal at 8 lines/s (125 ms/line); removed lines reveal 60 ms before their replacement
  shell line ($ pnpm vitest …): typewriter at 40 chars/s, then output lines pop at 8 lines/s

timing (both panels start together on the ticket block):
  t=0.0  ticket block (both)
  t=0.4  generic: "I'll fix…"        | jiro: "Reading the checkout path…"
  t=1.6  generic: Search (47 matches) | jiro: Read total.ts
  t=2.4  generic: Read total.ts (1-20)| jiro: Read adjustments.ts
  t=3.2  generic: "I see the issue!…" | jiro: Search "gift-card" (4 matches)
  t=5.0  generic: total.ts diff (23 lines, ~3 s) | jiro: root-cause sentence (~2.4 s)
  t=8.0  generic: adjustments.ts diff  | jiro: "Writing the failing test first." + test diff (25 lines ≈ 3.2 s)
  t=11.5 generic: types.ts, money.ts, validate.ts | jiro: "$ pnpm vitest total" → 1 failed (red) → one-function fix diff → "$ pnpm vitest" → 2 passed (green)
  t≈16   generic ends: "All tests pass ✓" (it did not run the combo case) | jiro ends: tagline verdict
  hold final state; loop only on re-entry
```

### 8c. Comparison content spec (data)

```json
{
  "scene": {
    "title": "SAME TICKET. TWO KITCHENS.",
    "subtitle": "Ticket #482 · Checkout total is wrong when a coupon and a gift card are combined",
    "nav_label": "DINING ROOM",
    "cta": "RESERVE A SEAT",
    "egg_counter": "0/88 EASTER EGGS"
  },
  "ticket": {
    "id": "Ticket #482",
    "text": "Checkout total is wrong when a coupon and a gift card are combined."
  },
  "generic": {
    "title": "GENERIC AGENT",
    "name": "Generic agent",
    "repo": "checkout-svc",
    "tagline": "Says \"All tests pass\". The combo total is still wrong.",
    "steps": [
      { "type": "ticket" },
      { "type": "say", "text": "I'll fix the checkout total calculation! Let me explore the codebase." },
      { "type": "tool", "verb": "Search", "arg": "total|coupon|gift", "sub": "47 matches in 19 files" },
      { "type": "tool", "verb": "Read", "arg": "src/checkout/total.ts (1-20)", "sub": "20 lines" },
      { "type": "say", "text": "I see the issue! The total isn't calculated correctly when a coupon and a gift card are combined. I'll add special handling for this case and make the code more robust." },
      { "type": "diff", "file": "src/checkout/total.ts", "lines": [
        [" ", "import { subtotal } from \"./cart\";"],
        ["+", "import { roundMoney } from \"../utils/money\";"],
        [" ", ""],
        [" ", "export function computeTotal(cart: Cart): number {"],
        [" ", "  let amount = subtotal(cart.items);"],
        ["+", "  // Handle coupon + gift card combination"],
        ["+", "  const hasCoupon = cart.adjustments.some((a: any) => a.kind === \"percent-off\");"],
        ["+", "  const hasGift = cart.adjustments.some((a: any) => a.kind === \"gift-card\");"],
        ["+", "  if (hasCoupon && hasGift) {"],
        ["+", "    const gc = (cart.adjustments as any).find((a: any) => a.kind === \"gift-card\");"],
        ["+", "    const cp = (cart.adjustments as any).find((a: any) => a.kind === \"percent-off\");"],
        ["+", "    amount = amount * (1 - cp.percent / 100) - gc.cents;"],
        ["+", "    const tax = amount * cart.taxRate;"],
        ["+", "    return roundMoney(amount + tax) as any;"],
        ["+", "  }"],
        [" ", "  for (const adj of cart.adjustments) {"],
        ["-", "    amount = applyAdjustment(amount, adj);"],
        ["+", "    amount = applyAdjustment(amount, adj as any) || 0;"],
        [" ", "  }"],
        ["-", "  const tax = Math.round(amount * cart.taxRate);"],
        ["-", "  return amount + tax;"],
        ["+", "  const tax = amount * cart.taxRate;"],
        ["+", "  return roundMoney(amount + tax);"],
        [" ", "}"]
      ]},
      { "type": "diff", "file": "src/checkout/adjustments.ts", "lines": [
        [" ", "export function applyAdjustment(amount: number, adj: Adjustment) {"],
        ["+", "  if (!adj) return amount;"],
        ["+", "  if ((adj as any).cents < 0) (adj as any).cents = 0;"],
        [" ", "  switch (adj.kind) {"],
        [" ", "    case \"percent-off\":"],
        ["-", "      return Math.round(amount * (1 - adj.percent / 100));"],
        ["+", "      return amount * (1 - (adj as any).percent / 100);"],
        [" ", "    case \"amount-off\":"],
        [" ", "    case \"gift-card\":"],
        [" ", "      return Math.max(0, amount - adj.cents);"],
        ["+", "    default:"],
        ["+", "      return amount as any;"],
        [" ", "  }"]
      ], "more": "… 22 more lines (+19 -6)" },
      { "type": "diff", "file": "src/checkout/types.ts", "lines": [
        [" ", "export interface Cart {"],
        ["-", "  adjustments: Adjustment[];"],
        ["+", "  adjustments: Adjustment[] | any[];"],
        ["+", "  giftCardApplied?: boolean;"],
        ["+", "  couponApplied?: boolean;"],
        [" ", "}"]
      ]},
      { "type": "diff", "file": "src/utils/money.ts", "note": "(new file)", "lines": [
        ["+", "export function roundMoney(value: any): number {"],
        ["+", "  return parseFloat(Number(value).toFixed(2));"],
        ["+", "}"]
      ], "more": "… 41 more lines (+41 -0)" },
      { "type": "diff", "file": "src/checkout/validate.ts", "lines": [
        ["+", "  if (adj.kind === \"gift-card\" && adj.cents <= 0) {"]
      ], "note": "clip ends here; continue with 2–3 more lines then:" },
      { "type": "shell", "cmd": "pnpm test", "out": ["✓ 14 passed", "All tests pass."], "inferred": true },
      { "type": "verdict", "text": "Says \"All tests pass\". The combo total is still wrong.", "tone": "warn" }
    ]
  },
  "jiro": {
    "title": "JIRO",
    "name": "Jiro",
    "repo": "checkout-svc",
    "tagline": "Failing test first, root cause named, one-function fix.",
    "steps": [
      { "type": "ticket" },
      { "type": "say", "text": "Reading the checkout path before changing anything." },
      { "type": "tool", "verb": "Read", "arg": "src/checkout/total.ts", "sub": "12 lines · computeTotal()" },
      { "type": "tool", "verb": "Read", "arg": "src/checkout/adjustments.ts", "sub": "percent-off · amount-off · gift-card" },
      { "type": "tool", "verb": "Search", "arg": "\"gift-card\"", "sub": "4 matches · only total.ts applies it" },
      { "type": "say", "text": "Adjustments run in the order the customer added them. A gift card added before a coupon shrinks the base that the coupon and the tax are computed on." },
      { "type": "say", "text": "Writing the failing test first." },
      { "type": "diff", "file": "test/checkout/total.test.ts", "lines": [
        ["-", "import { makeCart } from \"./fixtures\";"],
        ["+", "import { makeCart, type CartInput } from \"./fixtures\";"],
        ["+", ""],
        ["+", "const COMBO = {"],
        ["+", "  items: [{ sku: \"mug\", cents: 10_000 }],"],
        ["+", "  taxRate: 0.08,"],
        ["+", "  adjustments: ["],
        ["+", "    { kind: \"gift-card\", cents: 2_500 },"],
        ["+", "    { kind: \"percent-off\", percent: 10 },"],
        ["+", "  ],"],
        ["+", "} satisfies CartInput;"],
        [" ", ""],
        [" ", "describe(\"computeTotal\", () => {"],
        ["+", "  it(\"applies gift cards after coupons and tax\", () => {"],
        ["+", "    // $100 - 10% = $90 → +8% tax = $97.20 → -$25 card"],
        ["+", "    expect(computeTotal(makeCart(COMBO))).toBe(7_220);"],
        ["+", "  });"],
        ["+", ""],
        ["+", "  it(\"does not depend on adjustment order\", () => {"],
        ["+", "    const reversed = [...COMBO.adjustments].reverse();"],
        ["+", "    const a = computeTotal(makeCart(COMBO));"],
        ["+", "    const b = computeTotal(makeCart({ ...COMBO, adjustments: reversed }));"],
        ["+", "    expect(a).toBe(b);"],
        ["+", "  });"]
      ]},
      { "type": "shell", "cmd": "pnpm vitest total", "out": ["✗ applies gift cards after coupons and tax", "  expected 7_220, received 6_880"], "inferred": true, "note": "clip ends at '$ pnpm v'" },
      { "type": "say", "text": "Root cause: gift cards are applied in insertion order. They must come off after tax.", "inferred": true },
      { "type": "diff", "file": "src/checkout/total.ts", "inferred": true, "lines": [
        [" ", "export function computeTotal(cart: Cart): number {"],
        [" ", "  let amount = subtotal(cart.items);"],
        ["-", "  for (const adj of cart.adjustments) {"],
        ["+", "  const giftCards = cart.adjustments.filter((a) => a.kind === \"gift-card\");"],
        ["+", "  const discounts = cart.adjustments.filter((a) => a.kind !== \"gift-card\");"],
        ["+", "  for (const adj of discounts) {"],
        [" ", "    amount = applyAdjustment(amount, adj);"],
        [" ", "  }"],
        [" ", "  const tax = Math.round(amount * cart.taxRate);"],
        ["-", "  return amount + tax;"],
        ["+", "  let total = amount + tax;"],
        ["+", "  for (const gc of giftCards) total = applyAdjustment(total, gc);"],
        ["+", "  return total;"]
      ]},
      { "type": "shell", "cmd": "pnpm vitest", "out": ["✓ 2 passed"], "inferred": true },
      { "type": "verdict", "text": "Failing test first, root cause named, one-function fix.", "tone": "ok" }
    ]
  }
}
```

Entries marked `"inferred": true` are not in the 6.5 s capture; everything else is verbatim from the frames. The two visible contrasts to keep front-and-centre: **47 matches in 19 files vs 4 matches · only total.ts applies it**, and **5 files / +60 lines of `as any` vs one test file then one function**.
