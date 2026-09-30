#!/usr/bin/env python3
"""Veo 3.1 image-to-video with first AND last frame pinned to the same still,
so the clip starts and ends on the identical pose.

usage: gen_veo.py STILL.png OUT_RAW.mp4 "motion prompt"
"""
import base64, io, json, os, sys, time, requests
from PIL import Image

KEY = os.environ["GEMINI_API_KEY"]
B = "https://generativelanguage.googleapis.com/v1beta"
MODEL = os.environ.get("VEO_MODEL", "veo-3.1-generate-preview")
NEG = ("camera movement, zoom, pan, dolly, camera shake, cuts, scene change, text, subtitles, watermark, "
       "morphing, extra limbs, new characters appearing, objects falling from above, fast motion, "
       "shoulder pads, shoulder armor")


def still_b64(path):
    sz = (3840, 2160) if os.environ.get("RES") == "4k" else (1920, 1080)
    im = Image.open(path).convert("RGB").resize(sz, Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=95)
    return base64.b64encode(buf.getvalue()).decode()


def main():
    still, out, prompt = sys.argv[1:4]
    img = still_b64(still)
    prompt = (prompt + " 16-bit pixel art animation, crisp pixels, the style and palette stay exactly the same as the "
              "starting image. The final frame is identical to the first frame so the clip loops seamlessly.")
    inst = {"prompt": prompt,
            "image": {"bytesBase64Encoded": img, "mimeType": "image/jpeg"},
            "lastFrame": {"bytesBase64Encoded": img, "mimeType": "image/jpeg"}}
    body = {"instances": [inst], "parameters": {"aspectRatio": "16:9", "resolution": os.environ.get("RES", "1080p"),
                                                "durationSeconds": 8, "negativePrompt": NEG}}
    for attempt in range(20):
        r = requests.post(f"{B}/models/{MODEL}:predictLongRunning?key={KEY}", json=body, timeout=120).json()
        if "name" not in r:
            print("submit err", json.dumps(r)[:300], flush=True); time.sleep(60); continue
        op = r["name"]; print("op", op, flush=True)
        while True:
            time.sleep(15)
            o = requests.get(f"{B}/{op}?key={KEY}", timeout=60).json()
            if o.get("done"):
                break
        try:
            uri = o["response"]["generateVideoResponse"]["generatedSamples"][0]["video"]["uri"]
            v = requests.get(uri + ("&" if "?" in uri else "?") + "key=" + KEY, allow_redirects=True, timeout=300)
            open(out, "wb").write(v.content)
            print("wrote", out, len(v.content), flush=True)
            return
        except Exception as e:
            print("gen err", json.dumps(o)[:600], e, flush=True); time.sleep(20)
    sys.exit(1)


if __name__ == "__main__":
    main()
