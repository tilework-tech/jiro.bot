# Video 05: "Same ticket. Two kitchens." (good vs bad taste)

- Source: `F0C5UBH07A9.mov`. It is 6.45 s long, 2032 × 1162, H.264, about 57.7 fps (60 tbr), with no audio. This file matches the duration and resolution of the earlier log's `video5.mov`.
- Frames: `full/05/f_0001..0013.jpg` at 0.0–6.0 s. I read all 13 and checked them with crops. I also pulled 20 fps sub-samples for 0.0–0.6 s and 10 fps sub-samples for 2.5–3.7 s to track the cursor and the room label.
- Coordinates are in **original capture px** (2032 wide). Percentages are relative to the **embedded site viewport**: x 58–1974, y 254–1088, so 1916 × 834 px with origin (58, 254). Browser and gallery chrome are ignored.

## Corrections to the earlier log (`jiro.bot/final/research/video-05.md`)

| Earlier log | Verified |
|---|---|
| Heading `ONE TICKET. TWO KITCHENS.` | The heading is **`SAME TICKET. TWO KITCHENS.`** The site logo `JIRO.BOT by Nori` (x 120–300 px) is drawn on top of its first word, so "SAME" reads as "S/AME" behind "BOT". This is a z-order or overlap layout bug. |
| "No pointer movement… no interaction response" | At 0.0 s a cursor sits over the right panel at (1646, 688). The **right panel has a 2 px green outline (#5bb469/#81da8f)**, which is a hover state. Between 0.3 and 0.55 s the cursor moves right toward the room rail. The green outline is gone at 0.5 s, and a **`DINING ROOM` hover label** fades in beside the rail at 0.5 s. The label is solid until about 2.8 s, half-faded at 2.5–3.0 s, and gone by 3.0–3.5 s. |
| "Covered dessert / tiny lamp" entering left | It is a **UFO abducting a tuna nigiri**: a grey saucer whose yellow tractor beam holds a nigiri, on a black-rim plate. It enters at 3.0–3.5 s. At 6.0 s a third new item appears at the left edge: yellow-topped nigiri (tamago?) on a dark-rim plate. |
| "Right diagnosis … at 0.0 s mid-sentence" | Correct. The left feed reveals whole lines and scrolls in blocks. The right prose types character by character. The right code reveals line by line (see §6). |
| Belt plates "move right" | Confirmed. The **slat texture also translates** with the plates: the seam pitch is 34.9 px and it shifts +31 px per 0.5 s, so the bed is not static. |

## 1. Scene identity / place in flow

- This is the gallery's Demo 2, "Restaurant tour / Eight illustrated rooms". The right-edge rail has **8 square markers**, with the **3rd active** (orange #d1793b). Its hover label is `DINING ROOM`.
- In the final 7-stop flow (DESIGN-BRIEF §"Seven stops") this is **stop 3, "Good taste versus bad taste"**. It sits between the product demo (2) and the comparison table (4).
- The camera is static for the whole clip: there is no page scroll and no transition. The scrollbar thumb is fixed at x≈1966, y≈523–561, roughly 35% down the page.

## 2. Layout map (% of site viewport; x, y, w, h)

| Element | px (x0–x1, y0–y1) | x% | y% | w% | h% | Depth / notes |
|---|---|---|---|---|---|---|
| Letterbox side bars (#0b0908) | 58–186 and 1848–1974 | 0 / 93.3 | 0 | 6.7 / 6.6 | 100 | The page background outside the art stage |
| **Art stage** (room + belt) | 186–1848, 254–1088 | 6.7 | 0 | 86.7 | 100 | Back layer. Centred within ±1 px. |
| Site logo (red robot head + `JIRO.BOT` + green `by Nori`) | 78–300, 264–300 | 1.0 | 1.2 | 11.6 | 4.3 | Fixed overlay. **Overlaps the heading.** |
| Heading `SAME TICKET. TWO KITCHENS.` (pixel caps, muted #a49792, about 18 px cap height, wide tracking) | ~233–698, 272–296 | 9.1 | 2.2 | 24.3 | 2.9 | Over the room. Low contrast. |
| Ticket line (mono, #77716d) | 707–1455, 278–292 | 33.9 | 2.9 | 39.0 | 1.7 | Over the string lights. Contrast is too low. |
| Speaker button (square, dark, 1 px light border) | 1716–1756, 264–304 | 86.5 | 1.2 | 2.1 | 4.8 | Overlay |
| `RESERVE A SEAT` (copper #cd7741, dark pixel caps) | 1766–1940, 264–306 | 89.1 | 1.2 | 9.1 | 5.0 | Overlay. It overhangs the stage's right edge. |
| **Left panel "GENERIC AGENT"** | 209–993, 316–843 | 7.9 | 7.4 | 40.9 | 63.2 | Mid layer. Opaque. Brown 4–6 px frame (#301f15). |
| **Right panel "JIRO"** | 1019–1803, 316–845 | 50.2 | 7.4 | 40.9 | 63.4 | Mid layer. Green outline only on hover. |
| Gap between panels | 993–1019 | 49.0 | — | 1.4 | — | A 26 px sliver of the room shows through |
| Panel title row (title left, subtitle right) | panel top + 10–30 | | | | ≈2.4 | Title: pixel caps. Subtitle: mono. |
| Panel sub-header (3 dots · name · `checkout-svc` … `working`) | panel top + 44–60 | | | | ≈2 | Darker strip (#191515) |
| Panel feed viewport | panel top + 64 → bottom − 12 | | | | ≈54 | Clipped. Auto-scrolls to bottom. |
| Room visible strip under panels | 843–862 | | 70.6 | | 2.3 | Dark back-counter shelf |
| **Belt** (copper top rail + slatted bed + lower rail) | 186–1848, 862–966 | 6.7 | 72.9 | 86.7 | 12.5 | Front layer. Spans the full stage width and is clipped by the stage edges. |
| Counter face (walnut) + lip + dark kick band | 966–1036 | | 85.3 | 86.7 | 8.4 | Front |
| Floor band (#1a0e14) | 1036–1088 | | 93.8 | 86.7 | 6.2 | Front |
| Room rail (8 squares joined by dotted links) | x≈1930–1942, y≈588–755 | 97.7 | 40.1 | 0.6 | 20 | Fixed overlay in the right letterbox |
| `DINING ROOM` hover label | ~1823–1905, 630–645 | 92.1 | 45 | 4.3 | 1.8 | Shows on hover and fades |
| `✦ 0/88 EASTER EGGS` counter (outlined box) | 70–250, 1046–1076 | 0.6 | 95 | 9.4 | 3.6 | Fixed. Bottom-left letterbox. |

**Occlusion:** the two panels cover about 52% of the viewport and about 60% of the art stage. Only these parts of the room are visible:
- a 60 px band at the top (festoon string lights, a paper-lantern/shoji glow at the upper right);
- a 23 px wood post left of the left panel;
- a 45 px wall/post strip right of the right panel;
- the 26 px gap between the panels;
- a 19 px shelf strip above the belt.

The room art is effectively wallpaper here.

## 3. Palette (sampled)

| Role | Hex |
|---|---|
| Letterbox / page bg | #0b0908 |
| Room wall (dim, warm) | #3d2c26 / #1c181a / #2c2521 |
| String-light bulbs (glow) | #e8e4cd core, warm haze ~#5a4a3a |
| Panel frame (brown) | #301f15 |
| Panel title strip | #171514 |
| Panel sub-header strip | #191515 |
| Panel feed bg | #110f10 – #0c0c0c |
| Hover outline (Jiro panel) | #5bb469 / #81da8f |
| Belt bed (slats) | #25211f (seams #181412) |
| Belt rails (copper) | #b87344 highlight, #6d3b1f shade |
| Counter face (walnut) | #86513b, lip #a47352, kick #3d221f |
| Floor | #1a0e14 |
| CTA copper | #cd7741 (dark text #2a1208) |
| Active rail marker | #d1793b |

**Panel text and syntax** (mono, about 13 px; colours are anti-alias-adjusted estimates):

| Role | Hex |
|---|---|
| Body / prose | #e8e4e0 (bright cream) |
| Muted meta lines | #817e79 |
| Context code | #b3acad |
| `JIRO` title green | #6cdb85 |
| `GENERIC AGENT` title | #e8e4e4 |
| Status bullet ● and `▸` tool verbs (`Search`/`Read`) | copper #cb885d / #a77659 |
| `Ticket #482` label and left quote bar | #ae7553 / #cd714e |
| File path after ✎ | #a97254 |
| `working` | #a1745c |
| Added line text | #71b385 on row bg #1a1f17 |
| Removed line text | #c15067 on row bg #201314 |
| Context diff block bg | #161210 |
| `… N more lines` | italic grey #817e79 |

**Lighting:** the room is very dim and warm. The only light sources are the string-light bulbs and the paper glow at the upper right. There is no rim light on the panels. The belt and counter are lit flat and much brighter than the room, which reads as foreground.

## 4. Pixel-art grain

- **Room:** soft, dim pixel art, upscaled with some smoothing (JPEG/scaling blur). Estimated 3–4 screen px per art pixel. There is little detail and it is crushed toward black.
- **Belt bed:** vector-crisp. Vertical slat seams every 34.9 px, 1 px darker lines, with a faint horizontal centreline at plate-centre height. The rails are flat 4–6 px copper bands. It reads as CSS or tile, not hand-pixelled.
- **Plate items:** the most detailed art. Chunky 1–2 px black outlines, 2–3-tone shading, and about 2 screen px per art pixel. Items are about 60–70 px tall (roughly 30 art px), and plates are an ellipse of about 68 × 22 px.
- **Mismatch:** the item sprites are noticeably sharper and higher-resolution than the room. Pixel-scale consistency is not maintained.
- **Text:** pixel display face for headings and titles (`GENERIC AGENT`, `JIRO`, `RESERVE A SEAT`, the room label). Everything else is a smooth monospace.

## 5. Conveyor

- **Geometry:** one straight horizontal run spanning the full art stage, x 186–1848 (1662 px = 86.7% of viewport width). It is cut off hard at both stage edges, with no bend, origin, or exit.
  - Copper top rail: y 862–868.
  - Bed: y 872–958 (about 86 px).
  - Copper lower rail: y 962–968.
  - Walnut counter face below.
  - Plates are centred at y≈905–912, slightly above the bed centre, so items overlap the top rail.
- **Direction and speed:** screen-right, constant, with no easing. The shrimp plate is at x 407 → 439 → 469 → 501 → 531 → 562 → 593 → 624 → 654 → 686 → 716 → 747 → 778 across the 13 frames. That is **371 px / 6 s = 62 px/s** at 2032 px capture width (3.2% of viewport width per second). A plate takes about 27 s to cross the stage.
- **Spacing:** uniform **~201 px** centre-to-centre (10.5% vw), giving about 8.3 slots across the stage. A new item enters every ~3.25 s.
- **Occupancy:** 100%. Every slot is filled, with 8–9 items visible at all times.
- **Sequence (right to left):** onigiri (blue rim, exits at about 0.5 s) · tuna nigiri (yellow) · salmon nigiri (blue) · sleepy onigiri with nori band (green) · fortune cookie with paper slip (cream/white rim) · grey seal wearing a chef's toque (black rim) · amaebi/shrimp nigiri (blue) · shrimp nigiri (yellow) · matcha in a stone cup (green) · **UFO abducting tuna nigiri** (black, enters about 3.25 s) · tamago-like nigiri (dark rim, enters about 6.0 s).
- **Rim colours:**
  - yellow #d6a935;
  - blue #375daf;
  - green #46a35e;
  - black #1b1719 with grey #5c5a5b face;
  - cream #d5cbbd;
  - all with a cream inner face #ebe1d4.
- **Item placement:** each item sits centred on its plate, overhanging the plate top by about 40 px. Nothing else moves: no wobble, no slips, no item animation.

## 6. Motion log (0.5 s)

L-scroll and R-scroll are the feed's upward scroll since the previous frame, in px. Belt x is the leading shrimp plate's centre.

| t (s) | Left "GENERIC AGENT" feed | L-scroll | Right "JIRO" feed | R-scroll | Belt x | Other |
|---|---|---|---|---|---|---|
| 0.0 | Ticket quote (top clipped) → `I'll fix…` → Search/Read → `I see the issue!…` → total.ts diff up to `const cp = …find(…"percent-off")` | — | Ticket block, Reading…, 3 tool lines, typing `…A gift car▌` | 0 | 407 | Cursor over the right panel. Green hover outline on. |
| 0.5 | + `amount = amount * (1 - cp.percent / 100) - gc.cents;`, `const tax…`, `return roundMoney(…) as any;`, `}` | 72 | `…d added before a coupon⏎shrink▌` (+30 ch) | 0 | 439 | Outline off, cursor gone. `DINING ROOM` label in. |
| 1.0 | + `for (const adj…`, −/+ `applyAdjustment(…)`, `}` | 77 | `…s the base that the coupon and the▌` (+34) | 0 | 469 | Onigiri has exited at the right |
| 1.5 | + −`Math.round` tax / −`return amount + tax` / + new tax / + `return roundMoney(amount + tax);` | 74 | `…tax are computed on.` then a new bullet `Writi▌` | 0 | 501 | |
| 2.0 | + `}`, then the `✎ src/checkout/adjustments.ts` block: signature, 2 `+` guard lines | 116 | `Writing the failing te▌` (+17) | 0 | 531 | |
| 2.5 | + `switch`, `case "percent-off":`, − `return Math.round(…)` | 62 | `…st first.` + `✎ test/checkout/total.test.ts` + 2 import diff lines | 0 | 562 | Label fading |
| 3.0 | + replacement return, `case "amount-off"`, `case "gift-card"`, `return Math.max(…)` | 74 | + blank, `const COMBO = {`, `items: …10_000` | 7 | 593 | Label gone |
| 3.5 | + `default:` / `return amount as any;` / `}` | 56 | + `taxRate`, `adjustments: [`, gift-card 2_500 | 54 | 624 | UFO plate fully in at the left |
| 4.0 | + `… 22 more lines (+19 -6)`, `✎ src/checkout/types.ts`, 3 diff lines | 105 | + percent-off 10, `],`, `} satisfies CartInput;` | 66 | 654 | |
| 4.5 | + `giftCardApplied?`, `couponApplied?` | 51 | + `describe(…)`, `it("applies gift cards after coupons and tax"…`, `// $100 - 10% …` | 60 | 686 | |
| 5.0 | + `}`, `✎ src/utils/money.ts (new file)`, 2 lines | 89 | + `expect(…).toBe(7_220);`, `});`, blank, `it("does not depend on adjustment order"…` | 63 | 716 | |
| 5.5 | + `}`, `… 41 more lines (+41 -0)` | 36 | + `reversed`, `const a`, `const b` | 61 | 747 | |
| 6.0 | + `✎ src/checkout/validate.ts`, `+ if (adj.kind === "gift-card" && adj.cents <= 0) {` | 69 | + `expect(a).toBe(b);`, `});`, then `$ pnpm v▌` (prompt typing) | 69 | 778 | Tamago-like plate at the left edge |

**Rates:**
- Right prose types at **≈55–65 chars/s**. The 20 fps sub-samples show 1–3 characters per 50 ms, with a block cursor ▌ in copper.
- Right code lines appear whole at **≈6–7 lines/s**. The feed scrolls ≈126 px/s once full, with a line height of about 18.7 px.
- The left feed reveals whole lines in bursts at **≈8 lines/s**. It scrolls ≈147 px/s, unevenly (36–116 px per step) because file headers and gaps insert spacing.
- The left panel is always "ahead" in volume and the right panel "ahead" in reasoning, which is the intended contrast.
- Both status labels stay `working` for the whole clip.
- **Background:** static. Mean frame-difference in the room regions is 0.4–1.6 out of 255, which is JPEG noise. The string lights do not twinkle.

## 7. Transcription

**Overlay:** `JIRO.BOT` · `by Nori` (green) · `SAME TICKET. TWO KITCHENS.` · `Ticket #482 · Checkout total is wrong when a coupon and a gift card are combined` · 🔊 · `RESERVE A SEAT` · rail label `DINING ROOM` · `✦ 0/88 EASTER EGGS`.

**Left panel.** Title `GENERIC AGENT`, subtitle `Says "All tests pass". The combo total is still wrong.`, sub-header `●●● Generic agent · checkout-svc` … `working`.
```
│ (Ticket #482 — clipped)
│ Checkout total is wrong when a coupon and a gift card are combined.
● I'll fix the checkout total calculation! Let me explore the codebase.
▸ Search total|coupon|gift
  47 matches in 19 files
▸ Read src/checkout/total.ts (1-20)
  20 lines
● I see the issue! The total isn't calculated correctly when a coupon and a gift card are
  combined. I'll add special handling for this case and make the code more robust.
✎ src/checkout/total.ts
  import { subtotal } from "./cart";
+ import { roundMoney } from "../utils/money";

  export function computeTotal(cart: Cart): number {
    let amount = subtotal(cart.items);
+   // Handle coupon + gift card combination
+   const hasCoupon = cart.adjustments.some((a: any) => a.kind === "percent-off");
+   const hasGift = cart.adjustments.some((a: any) => a.kind === "gift-card");
+   if (hasCoupon && hasGift) {
+     const gc = (cart.adjustments as any).find((a: any) => a.kind === "gift-card");
+     const cp = (cart.adjustments as any).find((a: any) => a.kind === "percent-off");
+     amount = amount * (1 - cp.percent / 100) - gc.cents;
+     const tax = amount * cart.taxRate;
+     return roundMoney(amount + tax) as any;
+   }
    for (const adj of cart.adjustments) {
-     amount = applyAdjustment(amount, adj);
+     amount = applyAdjustment(amount, adj as any) || 0;
    }
-   const tax = Math.round(amount * cart.taxRate);
-   return amount + tax;
+   const tax = amount * cart.taxRate;
+   return roundMoney(amount + tax);
  }
✎ src/checkout/adjustments.ts
  export function applyAdjustment(amount: number, adj: Adjustment) {
+   if (!adj) return amount;
+   if ((adj as any).cents < 0) (adj as any).cents = 0;
    switch (adj.kind) {
      case "percent-off":
-       return Math.round(amount * (1 - adj.percent / 100));
+       return amount * (1 - (adj as any).percent / 100);
      case "amount-off":
      case "gift-card":
        return Math.max(0, amount - adj.cents);
+     default:
+       return amount as any;
    }
  … 22 more lines (+19 -6)
✎ src/checkout/types.ts
  export interface Cart {
-   adjustments: Adjustment[];
+   adjustments: Adjustment[] | any[];
+   giftCardApplied?: boolean;
+   couponApplied?: boolean;
  }
✎ src/utils/money.ts (new file)
+ export function roundMoney(value: any): number {
+   return parseFloat(Number(value).toFixed(2));
+ }
  … 41 more lines (+41 -0)
✎ src/checkout/validate.ts
+   if (adj.kind === "gift-card" && adj.cents <= 0) {
```
The planted "bad taste" is deliberate:
- `as any` everywhere;
- a special-case branch instead of a root-cause fix;
- mutating input;
- `|| 0` masking;
- `toFixed(2)` dollar-rounding applied to cent values;
- a scatter of edits across 5 files.

**Right panel.** Title `JIRO` (green), subtitle `Failing test first, root cause named, one-function fix.`, sub-header `●●● Jiro · checkout-svc` … `working`.
```
│ Ticket #482
│ Checkout total is wrong when a coupon and a gift card are combined.
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
- import { makeCart } from "./fixtures";
+ import { makeCart, type CartInput } from "./fixtures";
+
+ const COMBO = {
+   items: [{ sku: "mug", cents: 10_000 }],
+   taxRate: 0.08,
+   adjustments: [
+     { kind: "gift-card", cents: 2_500 },
+     { kind: "percent-off", percent: 10 },
+   ],
+ } satisfies CartInput;

  describe("computeTotal", () => {
+   it("applies gift cards after coupons and tax", () => {
+     // $100 - 10% = $90 → +8% tax = $97.20 → -$25 card
+     expect(computeTotal(makeCart(COMBO))).toBe(7_220);
+   });
+
+   it("does not depend on adjustment order", () => {
+     const reversed = [...COMBO.adjustments].reverse();
+     const a = computeTotal(makeCart(COMBO));
+     const b = computeTotal(makeCart({ ...COMBO, adjustments: reversed }));
+     expect(a).toBe(b);
+   });
$ pnpm v▌            (clip ends; the command is truncated — do not guess)
```
The arithmetic is internally consistent: 10000 × 0.9 = 9000 → ×1.08 = 9720 → −2500 = 7220.

## 8. Fun details / easter-egg candidates

- **UFO tractor-beaming a tuna nigiri.** Candidate: click it and the nigiri is lifted off and returned two plates later.
- **Seal in a chef's toque** riding a plate. Candidate: it flips or barks; it could be a "sous-chef" cameo.
- **Sleepy onigiri** (closed eyes, blush). Candidate: it wakes and blinks when hovered.
- **Fortune cookie with a paper slip poking out.** This is the natural egg: click it to reveal a dev fortune (e.g. "Write the failing test first."), using copy from the scene, not claims.
- **Matcha in a stone cup:** steam puff.
- **Tamago-like nigiri** entering at the end.
- **Copy jokes already in the scene:**
  - the generic agent's `!`-heavy enthusiasm ("I see the issue!") and "make the code more robust";
  - `… 41 more lines (+41 -0)` for a two-line helper;
  - `giftCardApplied?` / `couponApplied?` flag creep;
  - `sku: "mug"` in Jiro's fixture.
  - Candidate egg: hovering `as any` makes a tiny red stamp "any" appear.
- **Room rail chain:** the dotted links between rail squares look like chopstick or ticket-rail joins.
- **Hover-reveal room names** are a cheap discoverable affordance worth keeping.
- **String-light bulbs** could be clickable to toggle on and off. Keep this static by default.

## 9. Reconstruction prompt (Gemini, 16-bit pixel art background)

> 16-bit pixel-art interior, Japanese izakaya / sushi dining room at night, wide 16:7 landscape, side-on orthographic view with no perspective vanishing lines, rendered at a native resolution of 480×210 and intended for 4× nearest-neighbour upscale. One consistent pixel scale across the whole image, no anti-aliasing, no gradients except dithered ones, a limited palette of about 24 colours. Mood: very dim, warm, late-service calm; the room is mostly in shadow so that two large dark code panels can sit over the middle 80% without the art competing.
> Back wall: dark walnut posts every ~120 native px and plaster panels in warm umber (#3d2c26, #2c2521, #1c181a); two shoji screens in the upper right with a soft paper glow (#e8e4cd core fading through #5a4a3a); a single round paper lantern hanging at the upper right. Across the top 15% a sagging festoon string of small warm bulbs (1–2 px cream cores with a 1 px dithered halo) in two gentle catenary loops. Mid-height, behind where the panels will go, keep detail sparse: faint lattice, a noren curtain edge at the far left, and a tall wooden post hugging the right edge. Lower 25%: a dark back counter or shelf with tiny silhouetted bottles and bowls, then the front sushi bar. Leave a clean horizontal band for a conveyor (do not draw plates or food). Below it, a warm walnut counter face (#86513b) with a lighter lip (#a47352), a dark kick band (#3d221f) and a plum-black floor (#1a0e14).
> No people, no text, no logos, no UI, no food on the belt. Background only, flat lighting from the string lights and shoji, no bloom.

**Animation / UI spec to rebuild as seen**

1. **Stage:**
   - Centred art stage at 86.7% viewport width, with #0b0908 letterbox at the sides.
   - Background static.
   - Fixed header row at y 1–6% with the logo, a pixel heading, a mono ticket line, a speaker toggle and a copper CTA.
   - **Fix:** don't let the logo overlap the heading, and raise the ticket-line contrast to at least 4.5:1.
2. **Panels:**
   - Two equal cards at x 7.9% and 50.2%, w 40.9%, y 7.4%, h 63%, with a 1.4% gap.
   - 4–6 px brown frame #301f15.
   - Title row: pixel-caps title left, mono subtitle right.
   - Sub-header: three grey dots, `Name · checkout-svc`, and `working` on the right.
   - Feed viewport auto-pins to the bottom.
   - Hover shows a 2 px #5bb469 outline.
3. **Feed playback (scripted, looping, start on scene-enter):**
   - Prose types at 60 chars/s with a copper ▌ cursor.
   - Tool rows (`▸ Read …` + muted meta line) and diff lines reveal whole at 7 lines/s (right) and 8 lines/s (left), each panel independently.
   - Scroll smoothly to keep the last line about 12 px above the bottom.
   - Diff rows get full-width tinted backgrounds (+ #1a1f17, − #201314); file headers use ✎ + a copper path.
   - The run takes about 6.5 s to reach `$ pnpm v…`. Add an end state (see §10).
4. **Belt:**
   - Straight, stage-width, y 72.9–85.3%.
   - Copper rails, charcoal slats with a 35 px pitch.
   - Bed and plates translate together at 62 px/s at 2032 px (scale with stage width).
   - Plates spaced 201 px; ellipse plates 68 × 22 with ~30-art-px items overhanging the top rail.
5. **Rail:** 8 squares on the right letterbox; the active one is #d1793b. On hover, show the room name label, which fades in at ~150 ms, holds, then fades out over ~500 ms after the pointer leaves.

## 10. Conflicts with binding rules

| Rule | Observed | Action |
|---|---|---|
| Plates all white with only a faint white/icy-blue rim | Yellow, blue, green, black and cream rims | Recolour every plate to white face with #e6eef5 / #cfe0ee faint rim |
| ~50% occupancy, seeded gaps | 100% occupancy, a tidy repeating sequence | Use a seeded sparse stream |
| One continuous belt through all scenes | A straight segment hard-clipped at the stage edges, with no evidence of continuity | Route the belt as one document-space path; this scene shows it "along the room edge" (brief §3), not as a standalone bar |
| Ambient motion <5% | The belt band is ≈10.8% of the viewport area and moves constantly. The two code feeds (≈52% of the viewport) scroll continuously for the whole clip. | Shrink and offset the belt to the room edge so its moving area is under 5%. Treat the feeds as the scene's single primary animation: play once on enter, then hold an end state, with a reduced-motion fallback that shows the final state. |
| No invented product claims | These are presented as if real and must be **labelled as an illustrative scripted replay**: `47 matches in 19 files`, `12 lines`, `4 matches · only total.ts applies it`, `… 22 more lines (+19 -6)`, `… 41 more lines (+41 -0)`, `Ticket #482`, `$97.20` / `7_220`. The panel subtitles make behavioural claims ("Says 'All tests pass'. The combo total is still wrong."; "Failing test first, root cause named, one-function fix."), and the clip never shows "All tests pass" or a fix being applied. `0/88 EASTER EGGS` is a demo count; the brief asks for 50+ real identities, so set the count to the implemented total. | Add an "Illustrative replay" tag. Keep the numbers as fiction inside the code, and avoid outcome/benchmark language. |
| Other quality issues | Heading/logo overlap. Low-contrast heading and ticket line. Both statuses stuck on `working`. The room is ~60% occluded. Sprite pixel scale doesn't match the room. | Fix in the rebuild |
