import sys, io, concurrent.futures as cf
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image

R = Path(__file__).parent / "repo/brand"
OUT = Path(__file__).parent / "stills"; OUT.mkdir(exist_ok=True)
client = genai.Client()
canon = types.Part.from_bytes(data=(R / "character/05-design-iterations/19-CANON-rolled-sleeves-grille-mouth-facing-left.png").read_bytes(), mime_type="image/png")
bar = types.Part.from_bytes(data=(R / "scenes/04-belt-edits/v5-FINAL-belt-into-wall-opening/01.jpg").read_bytes(), mime_type="image/jpeg")

STYLE = (
    "Detailed 16-bit pixel art in exactly the same art style, palette and rendering as the second reference image "
    "(the sushi bar). The main character is Jiro, the sushi-master robot in the first reference image: round copper dome helmet "
    "with a rivet seam, cream faceplate, copper cheek guards, two glowing blue eyes, a small speaker grille for a mouth (no drawn mouth line), "
    "white hachimaki headband with the knot on one side, indigo striped happi coat with dark V collar, sleeves rolled to the elbow, "
    "slim copper arms, copper hands, NO shoulder armor, no apron. Warm, light-hearted, cozy mood. 16:9 wide composition, "
    "no text, no letters, no UI, no watermark, no conveyor belt. "
)

SCENES = {
    "s1-coding": "Jiro sits at a small wooden desk in the cozy back office of the sushi bar, typing on a chunky mechanical keyboard in front of "
                 "a beige CRT monitor with green terminal code. A cup of green tea steams, a plate of nigiri sits beside the keyboard, colorful "
                 "sticky notes on the wall, a paper lantern overhead. Three-quarter view, camera slightly above, his hands on the keyboard clearly visible.",
    "s2-topdown": "Strict top-down bird's-eye view, camera looking straight down onto the floor of a busy small sushi restaurant: square wooden "
                  "tables with customers seen from above, tatami mats, plates of sushi, tea cups. Jiro seen from directly above in the middle, "
                  "carrying a wooden sushi platter to a table (we see the top of his copper dome helmet and the white headband).",
    "s3-tuna": "Jiro stands behind a long hinoki counter breaking down a huge whole bluefin tuna with a long maguro-bocho knife, "
               "clean red loins, neat cuts, ice, a bowl of water, fish-market lanterns behind. Side view, the whole tuna and knife visible.",
    "s3b-knife": "Extreme close-up of Jiro's copper hands slicing a perfect glossy red block of tuna sashimi with a gleaming yanagiba knife "
                 "on a wooden cutting board, precise slices fanned out, droplets, the edge of the indigo striped sleeve visible. Macro detail.",
    "s4-teaching": "Jiro teaches three tiny apprentice robots (small copper robots with white headbands) at a low wooden table in a classroom "
                   "behind the bar. A green chalkboard with chalk doodles of onigiri, fish and nigiri (drawings only, no words). The apprentices hold "
                   "tiny rice balls, one proudly, one clumsily. Jiro gently demonstrates shaping nigiri.",
    "s5-menuboard": "Jiro stands to the right beside a large hanging wooden menu board suspended by ropes from a beam, above a sushi counter. "
                    "The board has three completely blank, smooth, empty light-wood panels side by side with no writing at all, framed in dark wood, "
                    "with small paper lanterns around. Jiro gestures proudly toward the board. The board takes up the left two thirds of the image.",
    "s6-tea": "Jiro kneels at a low table on tatami in a quiet tea room, whisking matcha, sliding shoji doors open onto a zen garden with "
              "raked gravel, a mossy rock and a cherry tree dropping petals. Calm golden late afternoon light.",
    "s6b-bento": "Jiro rides a delivery bicycle with a wooden cargo box stacked with bento boxes through a rainy neon-lit night alley in Tokyo, "
                 "puddle reflections, paper lanterns, glowing signs with no readable text, steam from a vent.",
    "sb-clumsy": "A clumsy generic gray boxy robot (NOT Jiro: gray metal, square head, single red eye, no headband, no coat) at a messy sushi counter "
                 "making a disaster: rice stuck everywhere, lopsided falling-apart nigiri, a knocked-over soy sauce bottle, fish slices on the floor. "
                 "Front-facing cooking-show shot: the gray robot stands alone behind the counter facing the camera, holding a lacquered tray of ruined sushi. "
                 "Jiro does NOT appear anywhere in this image. Same sushi bar setting and style. Comedic.",
    "sb-jiro": "Jiro at a clean, orderly sushi counter proudly presenting a perfect lacquered tray of immaculate nigiri and maki, each piece "
               "identical and glossy, garnish precise, the counter spotless. Same sushi bar setting and style, same camera framing as a cooking-show shot.",
}

def gen(name, prompt, take):
    out = OUT / f"{name}-{take}.png"
    if out.exists(): return out
    r = client.models.generate_content(
        model="gemini-3-pro-image",
        contents=[canon, bar, STYLE + prompt],
        config=types.GenerateContentConfig(response_modalities=["IMAGE"], image_config=types.ImageConfig(aspect_ratio="16:9", image_size="2K")),
    )
    for p in r.candidates[0].content.parts:
        if p.inline_data:
            Image.open(io.BytesIO(p.inline_data.data)).convert("RGB").save(out); return out
    raise RuntimeError(f"no image for {name}")

names = sys.argv[1:] or list(SCENES)
takes = 2
with cf.ThreadPoolExecutor(8) as ex:
    futs = {ex.submit(gen, n, SCENES[n], t): (n, t) for n in names for t in range(takes)}
    for f in cf.as_completed(futs):
        try: print("ok", f.result())
        except Exception as e: print("fail", futs[f], e)
