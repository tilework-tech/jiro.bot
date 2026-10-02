#!/usr/bin/env python3
"""Generate a 16:9 pixel-art still with Gemini image model.

usage: gen_still.py OUT.png "prompt" [ref1 ref2 ...]
"""
import base64, json, os, sys, time, requests

KEY = os.environ["GEMINI_API_KEY"]
MODEL = os.environ.get("IMG_MODEL", "gemini-3-pro-image-preview")
B = "https://generativelanguage.googleapis.com/v1beta"

STYLE = (
    "Style: high-quality 16-bit pixel art like a modern premium indie game (Eastward, Octopath HD-2D sprites), "
    "crisp hard-edged pixels, rich warm palette of copper, wood browns, indigo, cream, lantern amber, soft dithering, "
    "consistent with the reference bar scene. The character Jiro is exactly the robot in the character reference: "
    "copper-and-cream riveted dome head with a white twisted hachimaki headband knotted on the side, two glowing "
    "cyan-blue square eyes, a small horizontal speaker-grille mouth, cream faceplate, NO shoulder pads or shoulder armor, "
    "blue-and-white vertically striped happi jacket with dark navy V collar and rolled sleeves, slim segmented copper arms "
    "and copper robot hands. No watermark, no UI, no borders."
)


def mime(p):
    return "image/png" if p.lower().endswith(".png") else "image/jpeg"


def main():
    out, prompt, *refs = sys.argv[1:]
    parts = []
    for r in refs:
        parts.append({"inlineData": {"mimeType": mime(r), "data": base64.b64encode(open(r, "rb").read()).decode()}})
    parts.append({"text": prompt + "\n\n" + STYLE})
    body = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": os.environ.get("AR", "16:9"), "imageSize": os.environ.get("SIZE", "2K")}},
    }
    for attempt in range(4):
        r = requests.post(f"{B}/models/{MODEL}:generateContent?key={KEY}", json=body, timeout=300)
        try:
            j = r.json()
            for p in j["candidates"][0]["content"]["parts"]:
                if "inlineData" in p:
                    open(out, "wb").write(base64.b64decode(p["inlineData"]["data"]))
                    print("wrote", out, flush=True)
                    return
            print("no image:", json.dumps(j)[:400], flush=True)
        except Exception as e:
            print("err", r.status_code, r.text[:400], e, flush=True)
        time.sleep(10)
    sys.exit(1)


if __name__ == "__main__":
    main()
