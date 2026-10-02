# Reference video 02: product demo panel

- Source: Slack file `F0C5MDYB1UK`, “Screen Recording 2026-09-30 at 6.10.14 PM.mov”. Local source: `.local/jiro-final-sources/video2.mov`.
- Source duration and format: 10.52 seconds, 2032 × 1162, H.264, approximately 60 frames per second. The MOV has no audio stream, so no sound is present in the source.
- Inspection: extracted **21 frames at 0.5-second intervals** (0.0 through 10.0 seconds) into `.local/jiro-final-frames/video02/`. Inspected all samples through three contact sheets and opened 0.0, 2.0, 5.0, 8.0, and 10.0 seconds at full resolution. Thus a change faster than half a second may be missed.

## What the source visibly shows

The recording is a Safari browser window showing the Jiro.bot demo gallery with **Demo 1, “3D scroll”, active**. Gallery tabs across the top are `1 3D scroll / Koi pond ending`, `2 Restaurant tour / Eight illustrated rooms`, `4 Sketch belt / Crisp pixel-art hero`, and `5 One-belt scroller / Seven scenes · 2D v4`. The gallery chrome and browser tabs are wrapper UI, not the product scene.

The entire 10.52-second excerpt holds on one product-demo view. Behind the content is an almost black, reddish-brown restaurant interior. At upper left, a small `jiro.bot` logotype uses white and orange pixel lettering. At upper right, an orange `Reserve a seat` button overlaps the conveyor side strip. On the left, Jiro is a large detailed robot at a wooden desk, sitting three-quarter view, hands on an off-white keyboard. He has orange/copper exposed parts, a cream rectangular face, solid cyan-blue eye panels without visible pupils, a segmented lower jaw rather than a drawn mouth, striped navy short-sleeve garment, and a white-and-orange head wrap. A beige CRT with green code, hanging paper lantern, pinned paper notes, steaming green cup, and small sushi dish make the room feel used. Warm lantern light pools on wood paneling; the lower and outer edges fall into deep shadow.

The center/right has a large near-black rectangular demo panel, approximately 1110 × 650 pixels within the 2032 × 1162 recording. Its top row has three tabs: orange selected `1 eng-dashboard`, then `2 Pull request`, then `3 Proof`. The visible first state is a compact message with blue square avatar `M`, `you 9:41`, and the exact request `@jiro make the dashboard faster`. Below it is an orange `Send to Jiro →` button. Most of the panel remains deliberately empty, giving copy and future interaction room. No message progression, result, pull-request state, or proof state appears during this excerpt.

At the right edge, a straight, narrow, top-to-bottom conveyor appears in a slot framed by orange/brown uprights. The exposed track is light gray with repeating horizontal bands. Large white plates carry pixel sprites, including salmon nigiri, tuna nigiri, tamago, salmon roe, a small Jiro head, a laptop with flames, and an angry onigiri. The visible examples have **colored outer plate rims** (green, red, blue, yellow, and dark), which conflicts with the requested final direction of white plates with only a faint white or blue rim. The belt is sharply cropped by the viewport and demo overlay; this excerpt does not show its physical origin, a bend, a connection to another room, or a pond. The bottom has a small `Open full size ↗` overlay.

The palette is primarily nearly black brown, dark umber wood, copper/orange accents, paper-lantern cream, muted beige computer hardware, slate-blue clothing, and small cyan/green UI highlights. Art is high-detail pixel art with hard visible pixels and restrained shading. The robot, computer, and belt sprites are more detailed than the low-detail dark background. The page structure is legible but notably leaves a large unused dark demo area.

## Half-second visual log

Each item refers to the extracted frame named in the first column. The stationary content above persists in every frame. Between every adjacent sampled pair, the plates advance downward; there is no visible text change, scene transition, camera movement, or tab switch. The specific movement of smaller sprites cannot be established confidently at this sampling rate.

| Sample | Time | Observed belt/content state |
| --- | --- | --- |
| `frame-0001.png` | 0.0 s | Right strip shows angry onigiri near the top, tamago, tuna, Jiro-head plate, and fire/laptop near the bottom. Robot and selected demo tab are in the positions described above. |
| `frame-0002.png` | 0.5 s | Same scene; plates have advanced downward a small but visible amount. |
| `frame-0003.png` | 1.0 s | Same scene; belt advance brings the next plates nearer the upper edge. |
| `frame-0004.png` | 1.5 s | Same scene; angry onigiri and tamago progress lower; no panel text change. |
| `frame-0005.png` | 2.0 s | Salmon appears near the top, followed by onigiri, tamago, tuna, Jiro head, and fire/laptop lower in the strip. |
| `frame-0006.png` | 2.5 s | Same scene; belt continues at a steady downward pace. |
| `frame-0007.png` | 3.0 s | Same scene; plates keep their order and spacing, with no visible jumps. |
| `frame-0008.png` | 3.5 s | Same scene; belt advances. |
| `frame-0009.png` | 4.0 s | Same scene; partial roe plate begins to enter above salmon. |
| `frame-0010.png` | 4.5 s | Same scene; belt advances, selected `eng-dashboard` tab and request remain unchanged. |
| `frame-0011.png` | 5.0 s | Roe is now at the top, then salmon, onigiri, tamago, and tuna. |
| `frame-0012.png` | 5.5 s | Same scene; belt advances. |
| `frame-0013.png` | 6.0 s | Same scene; belt advances. |
| `frame-0014.png` | 6.5 s | Same scene; belt advances. |
| `frame-0015.png` | 7.0 s | Blue-rim roe plate and green-rim salmon plate are both clearly visible. |
| `frame-0016.png` | 7.5 s | Same scene; belt advances. |
| `frame-0017.png` | 8.0 s | Roe at upper edge, salmon, onigiri, tamago, tuna below. No camera pan, section transition, or changed text. |
| `frame-0018.png` | 8.5 s | Same scene; belt advances. |
| `frame-0019.png` | 9.0 s | Same scene; more of the repeated sequence enters from the top. |
| `frame-0020.png` | 9.5 s | Same scene; belt advances. |
| `frame-0021.png` | 10.0 s | Shrimp nigiri is entering at upper right, followed by roe, salmon, onigiri, and tamago. The recording ends before any scene transition. |

## Movement and interpretation

**Observed:** The camera is locked. The gallery header, `jiro.bot` mark, product panel, desk, lantern, and CTA do not visibly shift relative to the viewport. The right belt and plates move consistently **downward** while the user does not scroll, so the belt must be independently animated in this prototype. Plate order is stable and the motion does not visibly reverse. I do not see a click, drag, plate pickup, falling object, soot sprite, or response to the Send button. Motion in Jiro's hands, eyes, steam, and lantern is too small to establish confidently from the 0.5-second samples.

**Inference for the final assembly:** Preserve the calm locked-camera product-demo composition and the belt's gentle autonomous downward movement. Carry that same physical belt into and out of this room, with plausible occlusion at room boundaries. Retain the warm workbench, blue unpupilled eye panels, tiny jaw, lantern glow, green CRT text, and concise three-step demo UI. Rebuild the belt plates with white or faint blue rims per Martin's explicit newer direction; do not carry forward the colorful plate rims. Do not treat the unobserved product states as approved copy or behavior. The giant empty demo panel can support richer actual product evidence, but any new claim must be checked against Nori source material.

## Uncertainty and limits

- This is a screen recording of a nested gallery preview, not a raw film or the full website. Browser chrome and gallery framing must be excluded from the final scene.
- The recording contains only one product-demo state. It cannot establish how `Pull request`, `Proof`, or `Send to Jiro` behave.
- The right belt appears vertical and continuous during this excerpt only. Its start and end, curves, occlusion, and physical connection across sections are outside this recording.
- Exact belt speed in CSS pixels per second cannot be derived reliably from this capture without accounting for preview scaling and frame timing. Its perceived speed is slow and constant.
