# Jiro hero video: learnings from the dots and Grok Bot films

Status: draft for review · Owner: Martin Stübler · Written by Jiro, 2026-10-14

## 1. Purpose

Martin shared two reference videos for the jiro.bot hero. Both were analyzed frame by frame at 0.5 s steps (317 frames). This document records what each video focuses on, its main message, how it shows the chat, how it shows the agent, and what the Jiro hero video should take from it. Section 6 turns that into requirements for the next version.

| | Video A | Video B |
|---|---|---|
| What it is | OpenAI "Introducing dots" article, with the 2:26 launch film playing inside it | xAI "Grok Bot" brand film (x.ai/bot, the site our positioning brief calls the best example) |
| Recording length | 73 s (film 00:00 to about 01:12) | 86 s (film 0:00 to 1:23 of 1:45) |
| Format | Live action, studio sets, actors, 3D mascots composited onto screens | Live action, documentary style in a real office, real product UI filmed on real devices |

Frame logs: `video/reference-analysis/` on branch `video/hero-loop-v1` in tilework-tech/jiro.bot.

## 2. Video A: OpenAI "dots"

### Focus
Personal, always-on agents that feel like characters you own. The first 15 seconds contain no product UI at all: a studio at night, 3D printers making characters, spec sheets, a woman smiling as she touches a figure. The software appears only after the character is established.

### Main message
"Dots are remarkably capable, always-on agents built to handle everything." Your dot is yours (you shape and name it), it already works for you before you ask, and it follows you across surfaces ("whether it is through ChatGPT, Slack, or Teams").

### Story structure
1. Craft and character (0 to 15 s): fast 1 s texture cuts, then one long take where rings on screens morph into characters.
2. Name it (18 to 33 s): dots change color and accessories; a name field types "Alfred".
3. It already did the work (35 s on): repeating vignettes. The agent speaks first, the person reacts, we see the work, the person steers in a few words, a smile pays it off.
   - Alfred: "I've been getting your website ready for the fall launch using your approved designs." / "Okay, perfect."
   - Felipe: "The latest consumer experience numbers came in on Teams. I've been updating your board meeting deck."
   - Jojo: "So I caught the app migration in your Google Meet notes. I've already mapped out the changes." / "Get it started, but make sure to first check every flow against the current product before…"
4. Exit (66 to 69 s): she takes the same agent with her on her phone and walks out at dusk.

### How the chat is shown
- On physical screens in the set (wall displays, a phone on a desk), filmed at an angle with shallow depth of field and blurred heads or shoulders in the foreground. Never a flat screenshot, never a device mockup.
- Extremely minimal: avatar, name, one agent message, one reply. Large rounded sans; a bubble is about a tenth of the frame height and readable at a glance.
- Two-tone bubbles: neutral grey for the agent, the agent's own color (magenta, yellow) for the person. The agent's color becomes the UI accent.
- The person's spoken reply turns into a chat bubble; typing dots and a thumbs-up pop in as acknowledgement.
- No captions. Every word on screen is UI text, and the film reads with the sound off.

### How the agent is shown
- A named, collectible 3D character: a soft blob with two dot eyes and one accessory (beret, sunglasses, halo, bow tie). Personality comes from accessories and small idle motion (bob, blink, tilt), not from a drawn face.
- One color identity per agent, carried through screens, props and UI.
- The agent has its own computer: a titled frame ("Felipe's Computer", "Jojo's Computer") with an oversized cursor and the mascot riding along as it clicks through a real website, picks a time slot, or edits a deck. Watching it move is how you see it working.
- Work shows up as small, readable state changes: a stat ticking 40% to 51% to 61%, chart bars building in, checkboxes filling.

### Pacing and craft
Hard cuts only, every 1 to 3 s. Screen shots hold about 2 s (long enough for about 20 words); reaction close-ups 1 to 1.5 s. Motion lives inside shots (slow push-ins, tracking, morphs). Warm wood and tungsten environment against saturated mascot colors.

## 3. Video B: xAI "Grok Bot"

### Focus
Agents as teammates you hire, one per person, each with a name and a job, doing specific, mundane, real work inside the company's actual tools (Gmail, Notion, Salesforce, LinkedIn, Slack, Granola).

### Main message
"We recently hired a new ~~teammate~~ teammates" (a counter races 11, 514, 1284, 2290, 3502, 4594). "Meet Grok Bot." Every person gets a bot that does real work, from triaging email to working in the cloud on its own.

### Story structure
1. Hook (0 to 4 s): one centered caption over 0.5 to 1 s office b-roll. "teammate" gets struck through, the phrase rolls like a slot machine, the counter climbs.
2. Product reveal (4.5 to 5.5 s): macro of the macOS Dock; the cursor hovers a blob icon with tooltip "Grok Bot" and clicks.
3. "Meet Heather / Yodo / Prospector / Cat", one name every 0.5 s, then a glyph scramble lands on "Meet Grok Bot" (held about 2 s).
4. Person, their bot, proof (19 s on), with capabilities escalating from volume to teachability to autonomy to proactivity to multi-agent:

| Lower third | What the proof shots show |
|---|---|
| Fiona's Bot: ● Yodo / Triages thousands of emails per day | Inbox of bot personas ("Yodo, Son of Frodo the Great", "Han Sodo, Executive Assistant") |
| Vincent's Bot: ● Louie / Learns and replicates tricky workflows | "Teach a task" turns into a red "■ 0:00" recording pill; "Got it — watching the demo and turning it into a skill." |
| Caro's Bot: ● Bobby / Works in the cloud on its own | Remote desktop "Stan's screen" with a Salesforce dashboard |
| (scheduled digest) | "Want a daily standup digest from this?" / "You're set. Every weekday at 9am PT I'll pull the Notion doc…" |
| Simon's Bot: ● Cartman / Researches like you would | Typed "Can you please navigate to my Linkedin", then "Harry's screen" with a big agent cursor on LinkedIn |
| (email at scale) | "Draft emails to all 100 lea…" cut to a monitor full of drafted emails |
| Krista's Bot: ● Olive / Contextually generates customer materials | Granola notes to a Japanese deck; "Mobile App" is replaced in place with "モバイルアプリ" |
| (multi-agent) | "Handed the words to Copywriter." / "Yep — Copywriter the page shell is ready…" |
| Emma's Bot: ● Cat / Does real work from your phone | Phone identity card, then a couch interview |

### How the chat is shown
- Filmed through a cinema lens on real laptops and phones: steep angles, very shallow focus so only one line or button is sharp, handheld drift, rack focus, fingers blurring through the foreground, bezel and camera light visible. Never screen-recorded, never a mockup.
- One idea per shot: one input box, one button, one agent message.
- Prompt, then result as a hard-cut pair: the typed prompt shows for 1 to 1.5 s and is cut before it finishes; the next shot is already the outcome, so the work feels instant.
- Payoffs land in place (the heading is translated where it sits, the email list fills the monitor).
- Agent copy is short, warm, first person and narrates progress: "Got it —", "You're set.", "I'll keep watch. Rest easy."

### How the agent is shown
- Each bot has a human first name and a colored blob avatar with eyes, introduced in a lower third tied to its owner: "Fiona's Bot: ● Yodo".
- The bot works on its own visible screen ("Stan's screen", "Harry's screen", "Notion Bot's screen") with an oversized black agent cursor and a motion trail.
- Playful personalities in names and lines add humor ("Odo-bi-Wan, Friend of Yodo").
- Multi-agent is shown as a group chat where bots hand work to each other.

### Pacing and craft
Hard cuts only; shots 0.5 to 3.5 s; caption beats about 5 to 10 s per bot. Lower thirds sit bottom left, white, no background box, name line then a grey 3 to 5 word benefit line; they fade in about 0.5 s after the cut and bridge person and product shots. Teal and mint grade on screens against warm skin and wood; a grade shift marks each new story. Real people react and laugh between product beats.

## 4. Side by side

| | A: dots | B: Grok Bot | Jiro hero v15 today |
|---|---|---|---|
| Core idea | Your own always-on agent character | Every teammate gets a bot that does real work | Jiro's first week, proactive and tasteful |
| Hook | Craft and character, no UI for 15 s | Kinetic caption with a racing counter in 4 s | "You just hired Jiro." static card |
| Agent identity | Named 3D mascot, one color | Named blob avatar plus owner in a lower third | Pixel bubble mascot, green label |
| Who speaks first | The agent, reporting work already done | The person prompts, then cut to the result | Mostly Jiro, sometimes the person |
| Chat look | Huge minimal bubbles on in-world screens | Macro of real UI, one sharp line | Full mobile chat in a phone frame |
| Agent at work | "Agent's computer" frame plus big cursor | "Stan's screen" plus big cursor | Work rows and a PR before/after |
| Text on screen | None; UI text only | Small lower thirds plus UI text | Large narration on the left |
| Pacing | Hard cuts every 1 to 3 s | Hard cuts every 0.5 to 3.5 s | Swipes, holds of 3 to 6 s |
| Humans | Actors reacting | Real employees reacting and laughing | None |

## 5. Learnings for Jiro

1. Make the agent a character before showing software. Both films introduce a named mascot first; the UI is the proof, not the subject.
2. The agent speaks first and reports work already done. "I've already mapped out the changes" is the dots formula and maps directly onto Jiro's proactive positioning. The person only steers.
3. One idea per shot, readable at hero size. Crop to the single line that matters and let everything else blur. This fixes the "my eyes glaze over" feedback on v13 and later.
4. Prompt, cut, result. Never play typing to the end; cut to the outcome so the work feels instant.
5. Give the agent its own screen and cursor. "Jiro's screen" with the mascot driving a cursor makes autonomy visible without explanation.
6. One plain claim per beat in a lower third. B's "Name's Bot: ● Name / benefit" formula is clearer and quieter than our big narration.
7. Show outcomes as small, satisfying state changes: a counter ticking, a heading replaced in place, a check landing. Our green checks are on the right track.
8. Specific, mundane, real tasks beat abstract claims. Name real tools (GitHub, Linear, Slack, CI) and real artifacts (a PR number, a file path).
9. Hard cuts with motion inside shots, not swipes. Both films use only hard cuts plus slow push-ins.
10. Humans make it warm. Reaction shots carry emotion in both films. Without footage we can partly substitute with the mascot reacting, but live action is the only way to match it fully.
11. It must work muted. Neither film depends on audio; ours should not either.
12. Do not copy what the recordings show by accident: player chrome, the recorder's cursor, and the paused dark frame at the end.

## 6. Requirements for the next Jiro hero video (v16)

### Goals
- A visitor understands in the first 5 seconds that Jiro is an engineer you hire who works on its own.
- Every beat is readable at the real hero size (about 580 × 465 CSS px on jiro.bot).
- Jiro reads as a character, with the positioning brief's qualities: tasteful, proactive, pushes back, quality over volume.

### Non-goals
- A live-action shoot (see open questions).
- Explaining pricing, integrations list, or setup steps.

### Requirements
| ID | Priority | Requirement |
|---|---|---|
| V1 | Must | 1200 × 960, 5:4, seamless loop of 25 to 35 s, works muted |
| V2 | Must | Hook in the first 4 s using kinetic type (for example "You hired one engineer." with a counter of PRs reviewed, landing on "Meet Jiro.") |
| V3 | Must | Jiro is introduced as a character with the pixel bubble mascot before any UI |
| V4 | Must | Every shot shows one idea, cropped so its key line is at least about 16 CSS px at hero size; everything else blurred or cropped out |
| V5 | Must | Jiro speaks first in each beat, reporting work already done or a problem it found |
| V6 | Must | Prompt, cut, result: typing is cut before it finishes |
| V7 | Must | Lower thirds per beat in the "● Jiro / benefit" format, bottom left, no box |
| V8 | Must | Hard cuts with slow push-ins; no swipes or whooshes |
| V9 | Should | "Jiro's screen": a framed panel where the mascot drives a large cursor (opens the PR, edits AGENTS.md) |
| V10 | Should | Screens framed as filmed objects: slight perspective tilt, depth of field, soft reflections |
| V11 | Should | Visible outcomes per beat: in-place edits, a counter, a green check |
| V12 | Should | Slack and CLI appear as their own close-ups, each with one sharp line |
| V13 | Could | Mascot reactions (blink, bounce) standing in for human reaction shots |
| V14 | Could | A version with stock or filmed human reactions if we decide to shoot |

### Proposed beats (about 30 s)
| Time | Shot | Lower third |
|---|---|---|
| 0 to 4 s | Kinetic hook over the mascot; counter races; lands on "Meet Jiro." | none |
| 4 to 9 s | Jiro: "I read all 1,284 files. payments/ and billing/ do one job. Want two small PRs instead of one big one?" (one line sharp) | ● Jiro / Reads your whole codebase |
| 9 to 14 s | Close-ups: Slack "agree, split it", CLI "+1. Keep tests/ at the root, CI looks there." | ● Jiro / Pushes back on messy plans |
| 14 to 19 s | "Jiro's screen": mascot cursor opens PR #412; folders strike through and regroup; "+412 −1,980" | ● Jiro / Ships small, clean PRs |
| 19 to 24 s | Jiro: "Orders retry twice. Bug or on purpose?" cut to the doc line appearing in place; check | ● Jiro / Asks what your docs don't say |
| 24 to 30 s | 4:21 AM alert, cut to the draft PR with a check, cut to 8:02 "…oh nice." | ● Jiro / Handles the 4 AM alert |

### Acceptance
- Five people who have not seen it can each say in one sentence what Jiro does after one viewing at hero size.
- Every on-screen line can be read on a laptop at the real embed size.
- The first and last frames match.

### Open questions
- Do we shoot any live footage (people reacting), use stock, or stay fully animated?
- Who signs off on the mascot: the Gemini pixel version or a designer-drawn final?
- Should the hero include a human name for Jiro's owner, like "Fiona's Bot", or stay "your Jiro"?
