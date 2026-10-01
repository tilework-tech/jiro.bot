# Style probe (2026-10-01)

One `gemini-3-pro-image` `generateContent` call, 16:9, 1K, canon #19 attached as the reference, no post-processing. Confirms the REST shape (`generationConfig.imageConfig`) and the look direction. Elapsed 21 s, 1355 output tokens (≈ $0.13).

Prompt:

> Reference image attached is the canon character Jiro (copper dome robot sushi chef). Create a single 16-bit pixel art sprite sheet style-master: on a flat dark plum background #130a0c, show (left) Jiro waist-up facing left behind a walnut counter, no mouth line, plain jaw plate, two glowing cyan square eyes without pupils; (right) a row of 4 plain white round sushi plates with a faint grey-blue rim, each holding one item slightly off-centre: salmon nigiri, a sleepy onigiri with closed eyes, a tiny bonsai, a rubber duck. Crisp hard pixels, 1px dark outlines, limited 48-colour warm palette, no anti-aliasing, no gradients, no text. SNES-era quality.

Not final art: it is off-grid and over-coloured, as every raw Gemini output is. Final assets go through `tools/fit.py` (grid snap → `jiro48.gpl` → orphan cleanup) and LibreSprite export.
