# Jiro head, front view (Gemini)

Reference image: `../../reference/jiro-original.png`, passed inline with the prompt.
Models: 1 and 3 `gemini-3.1-flash-image`, 2 and 4 `gemini-3-pro-image`. Aspect 1:1, 1024x1024.

Base prompt:

> Using the attached pixel-art image as the exact character template, create a clean head-and-shoulders portrait of this robot sushi chef in a strictly frontal, straight-on view, perfectly symmetrical, looking directly at the camera. Keep every design detail identical to the template: round copper dome helmet with a cream front panel and rivet seams, white twisted hachimaki headband tied around the brow, cream faceplate with copper jaw and cheek guards, two glowing blue eyes, no mouth, indigo and white striped happi collar at the bottom edge. Render as genuine 16-bit pixel art with crisp visible pixels, limited palette, hard 1-pixel outlines, no anti-aliasing, no blur. Plain dark flat background, no scene, no text.

3 and 4 append: "Frame the head large and centered, filling about 80% of the image, suitable as an avatar icon."
4 also appends: "The headband knot and tails should hang at the back, hidden, so the front view is symmetrical."

Run: `GEMINI_API_KEY=... python3 generate.py <model> <out.png> "<prompt>"` (edit the reference path in `generate.py`).
