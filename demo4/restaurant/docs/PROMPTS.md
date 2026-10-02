# Demo4 art and prompt provenance

The exact saved pixels are committed in `public/`, with source material in `art/` and `src/scenes/bar/source.png`. Image generation is not deterministic, so a new prompt alone cannot recreate this demo byte for byte. Use the saved files first. `ASSETS.md` supplies checksums for proof.

## Original references

- Martin's belt and scene sketch: `art/src/sketch.jpg`, from the opening Slack message.
- Canon Jiro character: `art/src/jiro-canon.png`.
- Earlier scene source and experiments: `art/first/` and `art/src/`.
- The latest hero raw still: `src/scenes/bar/source.png`.
- The final hero grid and sprite atlas: `public/art/bar/room.png`, `public/art/bar/sprites.png`, and `src/scenes/bar/art.json`.
- The crisp pond that Martin named as a style reference: `public/art/pond.jpg`.

## Exact generation record

`BIBLE.md` contains the initial creative brief, but it predates later cuts and the final hero redraw. The source branch does not contain a complete verbatim log of every image-model call used for all scenes. No missing prompt is invented here. The last agent posted a future-scene style prompt in the original thread:

https://tilework-tech.slack.com/archives/C0BGDN7PK3K/p1790792914824769?thread_ts=1790717424.131459&cid=C0BGDN7PK3K

That proposed pipeline uses a 480 by 270 native grid scaled four times. The saved hero itself uses a 640 by 360 grid scaled three times, as specified by `src/scenes/bar/build_art.py`; follow the code and final art when reproducing Demo4. The style prompt is guidance for further art, not a record of how every saved image was generated.

## Rebuilding the final hero derivative

The raw `source.png`, `build_art.py`, and `art.json` are committed. Install the Pillow and NumPy versions compatible with your Python runtime, then from `restaurant/` run:

```bash
python3 src/scenes/bar/build_art.py
npm run build
python3 tools/asset_manifest.py --check
```

A regenerating library version may produce slightly different palette quantization or pixels. The committed derived images are authoritative. When checking the exact saved version, run the manifest check without regenerating first.

For transitions, follow the `src/transitions/*.md` notes and the adjacent `build_art.py` files where present. The final transition bands and overlays are already checked in under `public/art/tr/`.
