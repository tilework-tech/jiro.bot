# Jiro.bot final assembly proposal

Review the [saved demo gallery](showcase/README.md) before choosing the final composition. The gallery contains four distinct sites, numbered Demo1, Demo2, Demo4, and Demo5. Martin asked to remove Demo3 because its website files matched Demo1. Demo5 is the closest working base for the final site because it already follows the seven-scene order and keeps one moving conveyor from the hero to the koi pond.

| Scene | Proposed source | Reason and next change |
| --- | --- | --- |
| Full-width bar hero | Demo5 | Keep the approved bar loop, quiet left side for copy, and belt visible from the first frame. Use Demo4 as the reference for crisp pixel edges and a restrained palette. |
| Product demonstration | Demo5 | Keep the large waist-up Jiro and clickable Slack, PR, and environment walkthrough. Replace the illustrative interaction with a recorded product example before launch. |
| Restaurant comparison | Demo4 room art with Demo5 page structure | Demo4 makes the happy diners and tables visible; Demo5 gives the two comparison panels the space Martin requested. Record real, reproducible agent runs for both panels. |
| Comparison table | Demo5 | Keep the readable menu-board layout and verify claims against the current product before launch. |
| FAQ counter | Demo5 | Keep five subtly animated sushi questions and Jiro's answer bubble. |
| Bicycle pricing | Demo5 | Keep the bicycle and straight background belt. Review the loop seam and current pricing copy. |
| Koi pond | Demo5, informed by Demo1 | Keep the empty bridge, restrained water motion, and koi eating sushi from the same conveyor. |

The scene order and visual rules follow [Martin's preserved feedback](demo5/site/docs/FEEDBACK-VERBATIM.md) and the [master prompt](demo5/site/docs/MASTER-PROMPT.md). Keep the saved demos unchanged as reconstruction references. Build the final site in a separate directory or review branch after Martin confirms the proposed source choices.

## Verified for this review

- The gallery and all four demo builds complete with Node 22.
- In headed Chromium, each gallery tab loads its page with no page errors. Demo2 renders its bar rather than a black screen. Demo1 uses its saved scene reel in this browser because its interactive experience requires WebGL2.
- The gallery server returns HTTP 200 for its root and each demo path using the session hostname as the Host header.

Safari and real phone interaction still need direct testing. The Demo5 comparison is a scripted replay, and its product walkthrough is illustrative. This proposal is a review artifact, not a production site.
