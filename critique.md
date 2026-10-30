# jiro.bot — cohesion and message critique

Reviewed live on **30 October 2026**, approximately **20:33–20:37 UTC**. Desktop **1440 × 1000**; mobile **390 × 844**, device scale 1. This is a read-only visual review, not an implementation proposal or a competitor fact-check.

**The page promises a discerning colleague, then sells a combative agent platform.** The largest improvement would come from making the voice, demonstrations, and visual emphasis substantiate the same promise. Changing the carousel controls alone will not do that.

## Evidence and scope

The live page was rendered in the session’s headed Chrome, controlled through the Chrome DevTools Protocol. Full-page captures and individual scrolled sections were **opened and viewed as images**. Deployed HTML/CSS were secondary checks for wording, dimensions, and interaction behavior. FAQ answers were expanded; pricing hover and all three hero examples were inspected. No signup was submitted.

- [Desktop full page](screenshots/desktop-full.png) · [annotated overview](screenshots/annotated/desktop-full.png)
- [Mobile full page at 390](screenshots/mobile-full.png) · [annotated overview](screenshots/annotated/mobile-full.png)
- Raw section captures live in `screenshots/`; annotated evidence plates live in `screenshots/annotated/`. Plates place reviewer notes beside the captured pixels; originals remain unmodified. Different captures contain different animation frames. Mid-typing text and transitional frames are not treated as defects.

The lens is **nori-design**: one accent grammar, structure without shadows, sans leading with mono accents, one clear active thing, and motion under the reader’s control. Marketing can use terminal language and window chrome. Product-interface token sizes are not imposed on this landing page.

Constraints respected: the light/dark decision belongs to **Maddy**; palette observations below are input to her decision. Hero overlays → white bottom bar, matching How-it-works tabs, `@Jiro`, and non-clickable steps are **in flight**, not permanent defects. Both customer quotes stay verbatim. Fictional Alder/Kira/Dana/Priya scenarios and the absence of “illustrative” captions are intentional. The real-product polish gap is supplied context, not something this public-page review independently verified.

Two live-version qualifications: the hero does **not** currently show “the change you would have made yourself, on a good day”; it promises quality over volume, pushback, and early warnings. The three desktop mechanism examples do have a small **“example”** label; it is absent at 390px. Neither discrepancy changes the central critique.

## Ranked findings

### 1. High — The hero and the next section behave like different brands

**What I saw.** The hero’s “The tasteful software engineer” and quality/pushback paragraph immediately give way to an enormous orange panel: “Ditch D*vin. Forget F@ctory. Stop slopping around.” The censor characters and ridicule receive nearly the hero’s typographic weight, plus a much larger saturated field. On mobile the taunt occupies four emphatic lines. [Evidence](screenshots/annotated/desktop-02-ditch.png)

**Why it hurts.** The first section asks me to trust judgment; the second asks me to join a rivalry. Those can coexist, but here the tonal turn is abrupt enough that provocation becomes the stronger personality. The small follow-up about knowing my style does not bridge the two. “Tasteful” begins to sound like a boast rather than an operating principle.

**Direction.** Keep the competitive stance, but make the attack about the cost of poor judgment and demonstrate the alternative. Let the table do the competitor naming. If the memorable “Stop slopping around” line stays, subordinate it to the craft argument rather than pairing it with two equally loud censored names. This is a voice and hierarchy decision, not a request to make all copy polite.

### 2. High — The evidence demonstrates capability more clearly than taste

**What I saw.** After the hero and taunt, the comparison emphasizes agent choice, models, context, cloud, and price. The mechanisms show shared sessions, an overnight webhook fix, and access permissions. The on-call example includes a small change, tests, and a PR; the permissions example shows a refusal based on access. Those demonstrate engineering process and boundaries. They do not show Jiro challenging a questionable product request, recognizing an unnecessary change, or choosing between plausible approaches. [Hero](screenshots/annotated/desktop-01-hero.png) · [comparison](screenshots/annotated/desktop-03-comparison.png) · [on-call](screenshots/annotated/desktop-06-how-oncall.png)

**Why it hurts.** The nominal sequence is coherent—promise → alternatives → comparison → social proof → mechanism → price → FAQ → action—but the argument changes midway. “Why this discerning engineer?” becomes “why this flexible agent platform?” A permissions denial is not evidence of the promised taste-based pushback. The table’s broad claims, including “Any model” and multiple cloud options, are assertions; these particular demos do not establish all of them. This review does not conclude those claims are false.

**Direction.** Make one existing demonstration show a consequential judgment: the original request, a specific objection or tradeoff, and the smaller/better reviewed result. Then use infrastructure capabilities as the conditions that let that colleague work with the team. Do not add another large section; make the current evidence carry the differentiator.

### 3. High — The demos set an experience expectation beyond the behavior they explain

**What I saw.** The hero shows carefully staged Slack/device scenes, clean identity labels, tidy PR results, and legible permission badges. The lower mechanisms package conversation, terminal output, and results into polished white application windows. Fictional names keep the story continuous, and desktop’s small “example” tags help identify the lower scenes as examples. [Hero](screenshots/desktop-01-hero.png) · [RBAC](screenshots/desktop-hero-rbac.png) · [mechanism](screenshots/annotated/desktop-05-how-multiplayer.png)

**Why it hurts.** These are effective explanations of a workflow, but their realism also makes them an implicit preview of the purchased experience. Given the **known, supplied gap** between this polish and the real product, a reader can infer more consistency and immediacy than onboarding will deliver. Fictional data is not the problem; treating an idealized presentation as proof of experience is the risk. The customer quotes immediately above the lower examples can lend those fictional scenes more evidentiary weight than intended.

**Direction.** Keep fictional data and the decided caption policy. Bring the interface details, handoffs, waiting, and visible review gates closer to the actual supported experience. Separate “this explains a workflow” from “this proves current usability” through faithful presentation and a credible product preview, not necessarily a disclaimer. Validate the complete depicted flows against the product before making them the main reason to believe.

### 4. Medium–high — The testimonials float instead of completing the argument

**What I saw.** Alex/Corvus and Danny/Miravoice appear as two large quotes in a white bordered band, with no visible heading and a deep empty top margin. Their mono attributions are much quieter than the statements. Mobile preserves roughly 170px of top padding before the first quote. The text speaks to getting urgent work done and saving time. [Desktop](screenshots/annotated/desktop-04-testimonials.png) · [mobile](screenshots/mobile-04-testimonials.png)

**Why it hurts.** The placement after the comparison is logical, but the presentation reads like an interlude. It does not clearly mark the transition from the company’s claims to customer experience, or explain how these outcomes support the hero. Neither quote directly proves superior taste, and the layout should not pretend otherwise.

**Direction.** Preserve every word of both quotes. Add a brief editorial introduction that frames the actual evidence—useful work in real team situations—and bring the attributions into a more deliberate relationship with it. Rebalance the blank top space so the quotes arrive as a proof point rather than content apparently missing a heading.

### 5. Medium — Pricing and FAQ are calmer, but the purchase story changes vocabulary

**What I saw.** “Start with a free trial” sits above $99/developer and $250/team plans, yet the buttons say “Get early access.” Capacity is “Up to 3 agents” and “5 shared agents”; the expanded billing answer instead explains **runtimes** that sleep when idle. “Bring your own subscription” is a small pricing bullet. [Pricing](screenshots/annotated/desktop-08-pricing.png) · [expanded FAQ](screenshots/desktop-10-faq-expanded.png)

**Why it hurts.** Pricing and FAQ largely return to the hero’s plain, practical register; they are not another meme-voice break. The problem is conceptual: am I starting a trial or requesting admission, and am I buying agents, seats, or runtime capacity? The practical sections should settle those questions, not introduce a second name for the unit being sold. The reader also has to infer how the stated plan price relates to their separate model subscription.

**Direction.** State what happens after the CTA and how the trial relates to early access. Use one customer-facing capacity term throughout, explaining runtime mechanics only where useful. Make the separate subscription relationship easy to understand at the price. This is clarification of the offer, not a recommendation to change the prices.

### 6. Medium — Orange is the apparent action color until pricing turns action green

**What I saw.** Orange identifies header, hero, and closing signup buttons, but also “tasteful,” the cursor, the competitor panel, the on-call canvas, and the footer. Green identifies the page surround, handle, Jiro comparison column, and multiplayer canvas. Pricing buttons start black; hovering a pricing CTA turns it green while its whole card becomes black. Orange also identifies active navigation. [Pricing hover](screenshots/annotated/desktop-11-pricing-hover.png) · [hero](screenshots/annotated/desktop-01-hero.png)

**Why it hurts.** There is a partial rule—orange usually means act—but the exception occurs at the moment of commercial choice. Green alternates between structure, brand, advantage, and action. The reader has to relearn emphasis, and large decorative color fields spend the attention that a primary action needs.

**Direction.** Give acquisition actions one stable treatment, including hover, and define a separate restrained treatment for the selected demo/tab. For the current page, consistent orange acquisition buttons would preserve the clearest existing cue; a house-green choice could also work if applied consistently. Maddy should resolve that choice. Do not leave orange and green as interchangeable action signals. The white bar and matching tabs can unify local selection while this larger color question remains unresolved.

### 7. Medium — The surface sequence is a color sampler, not yet a clear narrative rhythm

**What I saw.** The full page proceeds through white hero → orange manifesto → green comparison stripe → white quote band → green, orange, and forest-green feature canvases → white pricing → black closing panel → orange pixel footer. Fluorescent green gutters outline almost every section. The outer page uses square corners and strong black rules; the embedded demos use rounded windows, pale inner cards, and light borders. [Annotated full page](screenshots/annotated/desktop-full.png)

**Why it hurts.** The repeatable outer grid gives structure, but several unrelated kinds of content receive maximum color emphasis. Multiplayer, on-call, and access control have the same explanatory role yet look like separate campaign treatments. The dark-green third example seems to signal a different category or mood without the copy explaining one. The problem is the absence of an evident role for each change, not the existence of both light and dark surfaces.

**Direction.** Give Maddy a surface hierarchy tied to narrative roles: the reading ground, the demonstration ground, and the final action moment. Test whether all three examples need independent saturated backgrounds. Keep application chrome distinct from the marketing frame where it explains a real interface; do not flatten Slack into the site’s design system. Mono navigation, pixel marks, and terminal output are legitimate here. The shared structural language needs more consistency of emphasis, not generic rounded cards or added shadows.

### 8. Medium — The black closing block reads as an empty shell

**What I saw.** Beside the FAQ, a large black rectangle contains only an orange “Get early access” button. It has no concluding statement or reassurance. At 390px it becomes a roughly 337px-tall block, with about 210px of black above the button. The orange footer then repeats the action and introduces a very large pixel wordmark. [Desktop](screenshots/annotated/desktop-09-faq-black.png) · [mobile](screenshots/annotated/mobile-09-faq-black.png)

**Why it hurts.** The black field promises a concluding thought but supplies another instance of an action already available in the sticky header and pricing. On desktop it borrows height from the FAQ; on mobile that relationship disappears and the emptiness becomes literal scrolling cost. The much louder footer immediately afterward also prevents it from feeling like the single dramatic ending.

**Direction.** Either make the block a compact action band or give it one concise closing reason to act and proportion the space around that statement. Keep black if Maddy wants the contrast. Intentional drama needs a subject and a landing; repeating the same button inside an oversized container provides neither.

### 9. Lower — Section hierarchy and spacing depend too much on section-specific habits

**What I saw.** Comparison and Pricing have approximately 51px semibold desktop headings. Feature titles are approximately 48px regular, but their parent “How it works” heading is invisible; testimonials and FAQ also have no visible section headings. Thus nearly equal-sized text alternates between a major section title and an individual example title. The quote band has a notably deeper top inset than comparison/pricing, while the feature text floats vertically beside much denser demos. [Quotes and first feature](screenshots/annotated/desktop-04-testimonials.png) · [access and pricing](screenshots/annotated/desktop-07-how-access.png)

**Why it hurts.** The primary issue is not random font sizes: the main size families are fairly consistent. It is unclear hierarchy and uneven pacing. A scanner gets strong chapter markers for comparison and price, but must infer the transitions into proof and mechanism. Large empty areas do not consistently mean “new chapter” or “rest.”

**Direction.** Establish one recognizable section-introduction pattern, with a subordinate treatment for examples, and a repeatable spacing rhythm. Use visible labels only where they help orientation; do not mechanically add five huge headings. Preserve the expressive hero/manifesto scale if the voice decision warrants it. Align spacing to reading structure rather than to equal-sized containers alone.

### 10. Lower, but consequential on mobile — “How Jiro compares” initially hides the comparison

**What I saw.** At 390px the table viewport shows row labels, a broad green Jiro column, and a narrow sliver of the first competitor. Other competitors are offscreen. The table supports horizontal scrolling and has sticky row labels; there is no explicit swipe/scroll cue in the captured initial view. [Mobile comparison](screenshots/annotated/mobile-03-comparison.png)

**Why it hurts.** The heading promises contrast, but the first screen repeats Jiro’s capabilities. The visitor must discover lateral movement and remember columns to perform the comparison. This is a discoverability and reading-effort problem, not inaccessible content or whole-page overflow.

**Direction.** Expose a meaningful contrast immediately on mobile, or make the lateral interaction unmistakable. A compact comparison choice or a clearly signposted scrolling table could both work. Preserve the row labels; avoid shrinking all six columns into unreadable text.

### 11. Lower — The upcoming tabs need to solve reading effort as well as control styling

**What I saw.** The 390px page is about 9,006px tall; the three mechanism examples occupy roughly 3,599px. The explanatory heading and steps appear before each large nested transcript/terminal stack, so the setup and the outcome often cannot be read together. The hero already contains playing media; the lower examples explain the same three capabilities again in much denser form. [Mobile mechanism](screenshots/mobile-05-how-multiplayer.png) · [full mobile](screenshots/annotated/mobile-full.png)

**Why it hurts.** Page length alone is not a defect, and text is not universally tiny or broken. The issue is repeated effort: first decode the scene, then read a second version and carry the setup across several screens. A shared white control bar will align components, but does not by itself make the information easier to absorb. Planned autocycling also introduces a pacing decision that matching tab styling cannot solve.

**Direction.** Give hero and mechanism distinct jobs: a quick outcome above, inspectable causal detail below. In the tabbed version, keep the problem and result together at phone width and make the decisive lines easy to find. Retain a clear way to pause/hold a scene, stop automatic advancement after deliberate interaction, and honor reduced motion. Treat that as a completion criterion for the in-flight work, not a claim that today’s carousel auto-advances—it currently does not.

## Possible project references

This dated critique and its screenshot evidence could be linked as a review reference after consideration. No project-context proposal was created: these are review judgments, not new decisions from a person. The current published context was checked at revision 0.

## The three changes that would most improve the site

1. **Make the competitor section speak with the hero’s judgment.** Retain a sharp position, but stop giving the censored-name taunt equal authority to the craft promise.
2. **Make one demonstration prove taste.** Show a consequential objection or tradeoff and the better result, using presentation faithful to the actual experience. Connect the unchanged quotes to the outcomes they genuinely support.
3. **Give the page one emphasis hierarchy.** With Maddy, settle the action/selection color roles, reduce unmotivated surface changes, and resize or give meaning to the empty closing block. Carry that hierarchy through the new bar and tabs.
