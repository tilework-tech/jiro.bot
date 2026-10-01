# v2.1 — changes from the draft brief, and open questions

Draft = `DESIGN-BRIEF.md` as of the first v2 proposal (2026-10-01 morning). v2.1 = the current `DESIGN-BRIEF.md` + `BELT-SPEC.md`. Each bullet cites the analysis file that drove it (`jiro.bot-media/analysis/`).

## What changed and why

**Camera and page**
- Dropped the draft's "hero run is straight in world space but reads as a diagonal". In the Zelda-style ¾ camera a world-straight run is horizontal or vertical on screen; a diagonal run plus 90° corners cannot produce a vertical spine. The hero belt is now a horizontal counter lane with two 90° corners (v08's bar topology, v08 §5), which also respects brand canon "runs in one straight line past Jiro". (v08, v01, v07, v09)
- Added an explicit page map with pixel y ranges for 7 stops and 6 bands (8865 px total), band heights 40–60 % of a viewport, bracketed by v06's measured 49 % garden strip and v08's 67–82 % basement. (v06 §2a, v08 §4)
- Replaced "native scroll + soft settle" with "native scroll + 300 ms Lenis-style smoothing + proximity snap", because Martin's "belt moves first, then the scene" needs the scene to visibly lag the belt; v07 did this with jerky coupling (v07 §5 derived numbers). (v07, v08 §6)
- Banned the three measured camera defects by name: v06's 125 px sideways jump on pond entry, v09's +33 px drift while scrolling, v01's ±1 px breathing zoom. (v06 §7.1–7.2, v09 §6.3, v01 §8.2)
- Section UI opacity is bound to scroll progress, never to a timer (v08's soot room materialised with 5 px of scroll). (v08 §9.5–9.6)

**Composition**
- Added a 48 px HUD-safe band, a solid darkened backplate, and a 24 px right margin for the scroll rail: six of ten recordings had the CTA/egg pill over plates, lanterns or diners, and v07/v10 clipped the rail. (v02 §8.8, v03 §8.4, v06 §7.6, v07 §8.2, v08 §9.7, v09 §6.2, v10 §6.7)
- Lifted the copy-field floor from near-black to `#171112`–`#241510` so props stay faintly legible; v08's `#050308` void read as "unloaded", v09's 5 %-lit floor read as a bug. (v08 §9.2, v09 §6.1)
- Panels capped at 60 % of stop height; v05's two panels hid the whole backdrop. (v05 §7.4)

**Art system**
- The 48-colour palette is now fully enumerated (17 warm / 12 cool / 15 accents / 4 plate), with every hex taken from measured values where the videos were on-palette and replacements where they were not (v03 neon pink, v04 splash blue, v10 purple signs). (v01 §3, v03 §3, v04 §3, v06 §5, v08 §7, v10 §3)
- Pipeline corrected after testing: LibreSprite 1.2 runs headless but its `--palette` does not quantize and `app.command.*` segfaults, so quantize/mode-downscale/despeckle are a scripted Pillow step; LibreSprite keeps `.ase` sources and sheet export. Gemini model names updated; `gemini-2.5-flash-image` retires 2026-10-02. (research_tooling §1–2)
- Added the mandatory Gemini post-process chain (grid detect → mode downscale → palette snap → orphan removal → chroma-key) because Gemini output is off-grid and over-coloured. (research_tooling §2)
- Type: Plex Mono for terminal text (what noriagentic.com loads), never a system sans inside pixel panels. (research_product_facts §7, v02 §8.9)

**Jiro**
- Kept canon #19's three-slot vent on the jaw plate at ≤ 1 tone of contrast instead of the draft's "plain jaw plate": Martin's text forbids a drawn mouth, not the vent, and #19 is approved with it. Jaw motion rule unchanged. (brand/README.md, v07 §7 for the teeth failure)
- One sprite set for all seven stops; v09 shipped two different Jiros and v03/v10 gave him a visor and a shoulder emblem. (v09 §6.6, v03 §7, v10 §2)
- Blink timing: 4–7 s elsewhere, 2–2.5 s in the product scene (measured in v02 and it reads well for "coding"). (v02 §5)

**Belt (now its own file, `BELT-SPEC.md`)**
- Corner geometry replaced the draft's "radius ≥ 1.5 belt widths" with the measured v08 quarter circle (38 band / 32 inner / 70 outer at 1×) scaled to the hero grain: band 52, inner 44, outer 96, centre 70 CSS px (≈ 1.35 widths). It is the only clean corner in the evidence. (v08 §2, §10c)
- Items now rotate with the tangent; plates do not. v08 kept items upright and the analyst liked it, but Martin's text says items must turn; a round plate is rotation-invariant so it stays an ellipse. (v08 §2, v09 §6.4)
- Rest speed confirmed at 16 px/s after tabulating all ten measured speeds (6–94 px/s); v04 ran at exactly 16 and reads calm. Surge is now a formula (4× at ≥ 1500 px/s intent, 120 ms attack, τ 350 ms decay, Δs capped at 4 px/frame). (v01 §5, v02 §5, v03 §5, v04 §5, v05 §5, v06 §3, v07 §5, v08 §3, v09 §3)
- Slot pitch 60 (v08's pitch ≈ belt width, v04's 53, v07's 58, v09's 60), fill generator with explicit run/gap distributions and a 48–52 % window, and a 6-slot no-repeat rule (v08 had three ikura in a row). (v08 §9.4, v05 §7.15)
- Link bars move with the plates on every run and fan in corners; three recordings slid plates over static slats. (v02 §8.6, v03 §8.7, v08 §2)
- Full route with every corner's coordinates, a dogleg in B3 (two corners in a quiet band), and an occluder table including notched roof copings (v06's belt vanished behind tiles with no opening) and hatch lips that reach the counter (v08's 15 px gap). (v06 §7.4, v08 §9.8)
- Terminus is the pond boathouse; nothing falls off the end. v04's pier had no end and v06 dropped every plate into the koi, which contradicts "only one or two things fall". (v04 §7.11, v06 §3)
- Koi: fires every 24–32 s while in view (v04 fired once and its ripple re-fired without a fish), "GULP" on the bite frame (v04 showed it 1 s early), 2–4 items eaten within 60 px of the mouth (v04 removed six plates up to 140 px away), empty plates ride on (v04 left a permanent gap), koi drawn at the hero grain (v04 pasted a finer fish). (v04 §7.1–7.6)
- Fall-off happens at a corner with a visible wobble and lands on a surface; v04's mid-belt "whoa~" with no cause is dropped. (v04 §7.5)
- Added per-slot seeded item offsets, cosmetic stacked plates, bomb/UFO caps, and a 24-item limit on placed objects.

**Interaction, creatures, eggs, games**
- Added hover feedback (ring cursor + 1 px lift + rim brighten); v02 and v07 gave no response. (v02 §8.4, v07 §8.13)
- Egg count set to 60 with a full named catalogue, up from the draft's 54 and down from the videos' 88/124, which were never demonstrated. Tracker format `🍣 n / 60`, top-centre, toast in its own slot (v06's toast covered the game button). (v05 §7.12, v06 §7.8, v07 §8.14)
- Belt item catalogue: 40 items at 70/20/10 with colours, click effects, drag flags; v09's item list and v06/v08 rosters were the seed. (v09 §7, v08 §5, v06 §3)
- Dust spirits: 1/3/5 per group, one group per band, mostly blink. v09's three-sprite candle scene is the reference; v08's single dangling sprite is kept as the B4 bench sitter. (v09 §4, v08 §8)
- Games: Sushi Rush cabinet in S4, Daily Roll stall in S7, mobile-only modal. Flappy Koi (v06) superseded; whack-a-mole stays rejected. (research_repo §2)

**Content**
- Product demo tab 3 renamed "Proof" → "Review": the site's FAQ says output is "a pull request, commit, comment, or completed task for you to review"; "proof" is not published copy. (research_product_facts §2, v02 §4)
- Pricing is the published four-plan table (Free trial $0/30 days, Developer $99, Team $250, Enterprise contact); v03's three tags and "Not market price." are placeholders. Footnote verbatim. (research_product_facts §5, v03 §4)
- "Bring your own subscription." replaced by "any model, your keys"; the phrase does not exist on noriagentic.com. (research_product_facts §5 note, v01 §4, v07 §4, v10 §4)
- Footer links are the site's; v04's "Docs" and "Security" pages return 404. Pond paragraph's "you keep your own subscription" dropped. (research_product_facts §6, v04 §4, v06 §1)
- Street signage uses real words; v03 and v10 were pseudo-kanji. (v03 §8.9, v10 §6.3)

**Delivery**
- Three stacked canvases (room / belt / ambient at 12 fps) and `?still` fallback specified; WebGL excluded on evidence (iOS context loss). (research_tooling §3)
- Added test surface: four pure modules and ~30 observable behaviours. (BELT-SPEC §16–17)

## Open questions for Martin (answer each in one line)

1. **Hero belt topology.** v2.1 runs the hero belt horizontally along the counter (out of the hatch, 90° right, past Jiro, 90° down at the right edge) instead of the videos' diagonal. OK, or do you want the diagonal and accept non-90° geometry?
2. **CTA label.** Keep the videos' "Reserve a seat" (sushi voice, links to the published trial form) or use the site's "Get started for free" verbatim everywhere?
3. **Plan nicknames.** May the four price tags carry decorative Japanese subtitles (見習い / 板前 / 大将 / おまかせ) under the real plan names, or plain names only?
4. **Jaw vent.** Canon #19 has a three-slot vent where a mouth would be; v2.1 keeps it at seam contrast with the jaw-plate motion. Keep the vent or remove it entirely?
5. **Dust spirits.** Original fuzzy design (round, white dot eyes, stick limbs), not the Ghibli drawing. Confirm.
6. **Fall-offs.** One legs-and-cuddle and one corner fall-off per visit, plus small on-plate reactions. Enough "random things falling off", or do you want a third scheduled event?
7. **Smooth-scroll lag.** "Belt first, then scene" is done with a 300 ms scroll smoothing layer (native scroll still works). Acceptable, or must the page scroll be strictly native?
8. **Mobile.** Copy stacks above each scene, hero layer drops to the room grain, games open in a modal. OK for the first release?
9. **Spend and gate.** ~$25–40 of Gemini generation; review the style master + hero with the belt (~2 days) before the other six stops (~4–5 more days)?
10. **Safari and dependencies.** One manual check on a real iPhone/Mac from you; and may I add Vitest and @playwright/test to the repo?
