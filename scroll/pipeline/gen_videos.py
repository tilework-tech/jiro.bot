import sys, io, time, concurrent.futures as cf
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image

D = Path(__file__).parent
SRC = D / "src"; SRC.mkdir(exist_ok=True)
RAW = D / "raw"; RAW.mkdir(exist_ok=True)
client = genai.Client()

BASE = ("Subtle, calm, looping 16-bit pixel-art game animation. Static locked-off camera, no camera movement, no zoom, no cuts. "
        "Keep the pixel-art style and every object in place. Small idle motions only; the final frame returns exactly to the first frame. "
        "No new objects appear, no text. ")

CLIPS = {
    "s1-coding": ("s1-coding-0", "Jiro's copper fingers type steadily on the keyboard, green code lines scroll slowly on the CRT, steam curls from the tea, "
                  "the paper lantern sways very slightly, Jiro's blue eyes blink once."),
    "s1-shoulder": ("s1-coding-1", "Over-the-shoulder view: Jiro's copper fingers type steadily on the keyboard, green code lines scroll slowly "
                    "on the CRT screen, steam curls from the tea, the paper lantern sways very slightly. Jiro's head stays still."),
    "s2-topdown": ("s2-topdown-0", "Seen from directly above: customers make small idle motions, lifting chopsticks and cups, Jiro takes a few small steps "
                   "carrying the platter and returns to his spot, steam rises from tea cups."),
    "s3-tuna": ("s3-tuna-0", "Jiro draws the long knife slowly along the tuna in a smooth careful stroke and returns, lanterns glow and sway slightly, "
                "a faint mist from the ice, water in the bowl ripples gently."),
    "s3b-knife": ("s3b-knife-1", "The copper hand draws the gleaming knife through the tuna block in one slow precise stroke and back, "
                  "light glints along the blade, droplets shimmer."),
    "s4-teaching": ("s4-teaching-0", "Jiro gently presses a nigiri with small hand motions, the tiny apprentice robots bob their heads, one wobbles "
                    "its rice ball, eyes blink, lantern flickers softly."),
    "s5-menuboard": ("s5-menuboard-1", "The menu board is rigidly fixed in place and never moves or swings. Lanterns flicker warmly, steam rises faintly. Jiro stays in pose, "
                     "his open hand makes a tiny welcoming motion, his round blue eyes stay open and glowing. The blank board panels stay completely blank."),
    "s6-tea": ("s6-tea-0", "Jiro whisks the matcha with small quick motions, cherry blossom petals drift slowly down in the garden, "
               "sunbeams shimmer softly, dust motes float."),
    "s6b-bento": ("s6b-bento-1", "Rain falls steadily, puddles ripple, neon signs flicker, steam drifts from the vent, lanterns sway; Jiro pedals "
                  "gently in place while the bike stays in the same position in frame."),
    "sb-clumsy": ("sb-clumsy-1", "The gray robot's arms twitch awkwardly, a grain of rice drops, the sushi on its tray wobbles, soy sauce drips "
                  "from the tipped bottle, its red eye flickers, lanterns sway."),
    "sb-jiro": ("sb-jiro-0", "Jiro holds the tray perfectly steady and gives a tiny proud nod. His face never changes: round glowing blue eyes and the speaker grille, no mouth, no smile. "
                "Lanterns sway softly, the glossy sushi glistens."),
}

def still_bytes(name):
    im = Image.open(D / "stills" / f"{name}.png").convert("RGB")
    w, h = im.size; th = round(w * 9 / 16); top = (h - th) // 2
    im = im.crop((0, top, w, top + th)).resize((1920, 1080), Image.LANCZOS)
    im.save(SRC / f"{name}.png")
    b = io.BytesIO(); im.save(b, "PNG"); return b.getvalue()

def gen(key, take):
    out = RAW / f"{key}-{take}.mp4"
    if out.exists(): return out
    still, prompt = CLIPS[key]
    img = types.Image(image_bytes=still_bytes(still), mime_type="image/png")
    for attempt in range(40):
        try:
            op = client.models.generate_videos(
                model="veo-3.1-generate-preview", prompt=BASE + prompt, image=img,
                config=types.GenerateVideosConfig(last_frame=img, aspect_ratio="16:9", resolution="1080p", duration_seconds=8,
                                                  number_of_videos=1),
            )
            break
        except Exception as e:
            if "429" not in str(e): raise
            time.sleep(30)
    while not op.done:
        time.sleep(15); op = client.operations.get(op)
    if op.error: raise RuntimeError(op.error)
    v = op.response.generated_videos[0].video
    client.files.download(file=v); v.save(str(out)); return out

keys = sys.argv[1:] or list(CLIPS)
with cf.ThreadPoolExecutor(10) as ex:
    futs = {ex.submit(gen, k, 0): k for k in keys}
    for f in cf.as_completed(futs):
        try: print("ok", f.result(), flush=True)
        except Exception as e: print("fail", futs[f], repr(e)[:300], flush=True)
