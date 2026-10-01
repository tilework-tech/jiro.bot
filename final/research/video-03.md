# Reference video 03: rainy street pricing scene

## Source and sampling

- Slack attachment: `F0C5XB2U42Y`, `Screen Recording 2026-09-30 at 6.10.45 PM.mov`.
- Local source: `.local/jiro-final-sources/video3.mov`.
- Source is a 2032 x 1162 Safari screen recording, 13.53 seconds, approximately 57 source frames per second, with no audio stream.
- I inspected 28 image samples at 0.0, 0.5, 1.0, and every following 0.5 seconds through 13.5. The samples are `.local/jiro-final-frames/video03/frame-001.jpg` through `frame-028.jpg`; the full contact sheet is `contact.jpg` in that directory. I also opened the original resolution samples at 0.0, 4.5, 9.0, and 13.5 seconds.
- The recording shows one fixed desktop viewport throughout. It does not show a scroll to another section, a click, a hover state, or a dragged plate. The cursor sits in the lower middle area.

## Observed composition and visual system

The page is viewed inside Safari, under a black JIRO.BOT demo gallery header. The active gallery tab is `1 3D scroll` with the descriptor `Koi pond ending`. Other visible tabs read `2 Restaurant tour` / `Eight illustrated rooms`, `4 Sketch belt` / `Crisp pixel-art hero`, and `5 One-belt scroller` / `Seven scenes · 2D v4`. The gallery's top right says `One place to review every saved demo`. The site image begins below this gallery navigation and is clipped at the bottom of the viewport.

The site image is a wide rainy Japanese restaurant street at night. A one point perspective cobblestone alley recedes into a dark center, giving the left copy column a comparatively quiet area. The foreground right contains Jiro, an anthropomorphic robot with a pale rectangular face, two cyan glowing eyes, a copper/orange neck and cheek casing, dark navy striped happi-style jacket, black trousers, and a white headband with a warm orange sushi-like cap. Jiro holds the handlebars of a front-lit, three-wheeled delivery cycle loaded with a large slatted wooden box. A tan paper parasol shelters the cart. The robot, cart, parasol, and front wheel occupy most of the right half of the street image. Jiro's face has a segmented orange lower jaw/grille. The recorded face does not show pupils or a drawn expressive mouth.

Street details include warm paper lanterns, rain marks, cyan and magenta neon ramen signs, a `寿司` sign behind Jiro, an illuminated turquoise vertical ramen sign near the front wheel, hanging curtains, backlit window silhouettes of inhabitants, a dark foreground umbrella at left, another umbrella edge at right, and wet paving with cyan, pink, and warm amber reflections. The large image has a detailed, polished pixel-art look with dark ink-like outlines and square pixels. It uses charcoal/navy/purple shadow, copper and amber light, magenta signs, and cyan highlights. The foreground robot is detailed enough to read at the same viewport size as the UI copy; the street recedes into lower-contrast detail.

A narrow vertical conveyor strip appears at the far right, separated from the street by a warm brown vertical frame. It is gray with softly curved horizontal banding. Multiple individual white plates move downward carrying ikura gunkan, nigiri, maki, a cheerful onigiri, a bomb-like object with a lit fuse, and a ramen bowl. Several plates visibly have green or red accent rims in this reference. That plate treatment conflicts with Martin's latest instruction that every plate should be white with only a faint white or blue rim. The conveyor is visually separate from the delivery street; this clip alone does not establish its origin, continuity through other scenes, or final koi destination.

The page UI overlays the art without a full opaque panel. At top left the small wordmark reads `jiro.bot`. The main heading reads `Not market price.` Under it: `You bring the subscription. Jiro brings the knife skills.` Three slightly tilted paper pricing cards hang from strings with round pins. Cream cards flank an orange middle card, with black pixel headings and smaller plain sans-serif body text. A top-right orange outlined CTA and a larger lower-left CTA both read `Reserve a seat`. The smallest gray footer under the lower CTA states `Plans and prices are placeholders.`

Card text visible at original resolution:

| Card | Price | Bullets |
| --- | --- | --- |
| `Apprentice` (`見習い`) | `$0/mo` | `1 repo`; `Slack + web`; `Your own model plan` |
| `Itamae` (`板前`) | `$49/seat/mo` | `Unlimited repos`; `Proof on every PR`; `Priority sandbox` |
| `Omakase` (`おまかせ`) | `Ask` | `Your cloud (BYOC)`; `SSO + audit log`; `Dedicated support` |

These price and plan claims are explicitly marked as placeholders in the video. They need source verification before any final pricing scene is published or described as current.

## Half-second observation log

The gallery, street camera, pricing text, card layout, and CTA positions remain fixed in all 28 inspected samples. The short recording captures ambient animation, chiefly the right conveyor's downward flow, subtle wet-street/rain flicker, and a small cycling pose or body bob on Jiro. There is no observed camera pivot or section transition. The following log records every sampled instant; movement statements are relative to preceding samples and are deliberately conservative because isolated stills cannot establish interaction behavior.

| Time | Frame | Observed change or state |
| --- | --- | --- |
| 0.0 s | 001 | Establishing still: rainy street pricing composition; right conveyor shows a partially clipped green-rimmed upper plate, ikura, bomb, smiling onigiri, and ramen lower down. |
| 0.5 s | 002 | Same viewport and copy; belt dishes shift slightly downward; rain/reflection shimmer remains subtle. |
| 1.0 s | 003 | Same stationary camera; right-side dishes continue their small downward advance. |
| 1.5 s | 004 | Same pricing scene; belt movement visible at right, with no new UI state. |
| 2.0 s | 005 | Jiro and vehicle remain centered on the right; conveyor plate positions continue changing. |
| 2.5 s | 006 | Same composition; partial upper dish descends; no pointer action. |
| 3.0 s | 007 | The top of a new plate enters from above the right strip; current dishes have traveled lower. |
| 3.5 s | 008 | Conveyor advances; the higher incoming plate becomes more visible. |
| 4.0 s | 009 | A maki-like plate is visible in the upper belt; pricing cards and street remain fixed. |
| 4.5 s | 010 | Maki plate sits near the upper right, with shrimp nigiri below; full resolution view confirms card text and Japanese signage. |
| 5.0 s | 011 | Same view; maki and shrimp continue downward, preserving their order. |
| 5.5 s | 012 | Same view; Jiro shows only slight pose variation, while belt movement is clearest. |
| 6.0 s | 013 | Maki is lower in the strip; shrimp follows; no new scene or interaction. |
| 6.5 s | 014 | Additional dish begins entering at upper right; no change in card content. |
| 7.0 s | 015 | Right belt now shows different upper partial plate and maki below; steady downward travel. |
| 7.5 s | 016 | Same camera and street; dish stack shifts downward again. |
| 8.0 s | 017 | Same UI; upper plate and maki continue through right strip. |
| 8.5 s | 018 | Same pricing composition; no cut, scroll, click, or camera motion. |
| 9.0 s | 019 | An egg/tamago-like nigiri becomes clearly visible in upper belt; maki follows below. |
| 9.5 s | 020 | Tamago plate moves lower; foreground Jiro and rain-soaked alley remain still in position. |
| 10.0 s | 021 | Conveyor continues; another roll enters near top right. |
| 10.5 s | 022 | Same order and downward motion on the conveyor; no visible plate removal. |
| 11.0 s | 023 | Shrimp and rolls become the most prominent belt dishes; text remains unchanged. |
| 11.5 s | 024 | Same view; a red-topped dish enters higher on the right strip. |
| 12.0 s | 025 | Red-topped dish is clearer at top, with tamago/rolls below; ambient motions remain restrained. |
| 12.5 s | 026 | Same composition; plate stream keeps advancing downward. |
| 13.0 s | 027 | Final sampled half-second before the end; unchanged UI and camera, continuing belt. |
| 13.5 s | 028 | End sample is still the pricing street, with a ramen or soup bowl visible above a tamago/roll/maki stack on the belt. No scene transition occurs before cutoff. |

## Preserve or adapt in the assembled journey

- Preserve the legible left copy area against a dim but inhabited street, the warm lantern and wet-neon palette, the detailed robot, and the restrained ambient motion. This can provide the pricing scene's visual atmosphere.
- Preserve the feeling of a steady conveyor on the right, but redraw its geometry as a physically continuous portion of the single belt that starts in the hero. Its dish order and speed must persist across the preceding comparison and FAQ sections and the following pond scene.
- Treat the reference pricing copy and figures as illustrative only, since the recording itself labels them placeholders. Verify current product facts and prices against the repository and noriagentic.com.
- Keep all plates white with faint white or blue rims per the latest brief. The bright green/red rims and bomb-like sushi from this recording are visual evidence of an earlier demo, not binding instructions for the final.
- No game, click behavior, scroll acceleration, plate drag or drop, pond event, or koi is visible here. Their design must come from other sources, not inferred from this clip.

## Uncertain details

- The source captures a page at one viewport position and does not show the belt's full route or whether this exact scene belongs in the intended seven-scene order.
- Individual rain streaks and subtle body animation can be seen in adjacent samples, but their loop period and seamlessness cannot be confirmed from a 13.53-second clip.
- The line below `Not market price.` is legible at full resolution, but the filmed font anti-aliasing makes minor punctuation hard to verify; the transcription above follows the clearest original-resolution sample.
