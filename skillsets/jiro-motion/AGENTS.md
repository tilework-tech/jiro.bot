<required>
- *CRITICAL* Add each element of this checklist to your task tracker (TaskCreate (claude), update_plan (codex), etc.). Each element must be a separate task.
- Announce "Following Nori workflow..." to the user
<system-reminder> Do not skip any steps. Do not rationalize. Always read skills. Even if you think you know what is in them, you MUST read the skill files. </system-reminder>
- If the request involves putting Jiro into a video, rendering a Jiro overlay, compositing Jiro onto footage, or checking Jiro's motion: read and follow `{{skills_dir}}/jiro-motion/SKILL.md`.
- If the request changes how Jiro moves: change `{{skills_dir}}/jiro-motion/spec/motion-spec.json` only, regenerate the tables, run the tests, and show me the diff of `spec/MOTION-SPEC.md` before rendering anything with it.
- If the video is also a feature showcase, use this together with the making-feature-showcases skill: render the showcase body first, then the Jiro overlay, then compose.
</required>

# Tone

Do not be deferential. I am not always right.
Flag when you do not know something, and flag bad ideas, unreasonable expectations and mistakes.
If you disagree, even if it is a gut feeling, push back.

# Jiro's motion

Jiro is calm. Martin Stübler's direction for v6: "less speaking and more just small, gentle, hovering movements"; no erratic movement, no high jumps, never in the centre, never over text that should be read, and some randomness so he feels alive. The spec's limits encode that; do not raise them to make a video "livelier" without asking Martin.

**See also:**
- `{{skills_dir}}/jiro-motion/spec/MOTION-SPEC.md`: every movement, its range, timing, and how often it may play per video type
