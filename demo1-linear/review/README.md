# Linear scroll review evidence

`full-scroll.mp4` is a 17-second desktop recording from the session's headed
Chromium browser at 1280 by 720. It moves continuously from the hero to the
pond and triggers the koi event at the end. `scroll-contact.jpg` summarizes
the recording. The numbered desktop and mobile stills cover all seven scenes
and the six passage midpoints at 1440 by 900 and 390 by 844.

`browser-report.json` records the visited scenes, media readiness, and errors.
All visible MP4s reached ready state 4, and no page or HTTP errors appeared.
At 1215 pixels into the page, the browser remained at that position after
1.4 seconds of rest, confirming that no snap advances the visitor. The belt
continued moving at rest and briefly advanced faster after scrolling. The koi
event ran at the pond. The site renders through DOM, MP4, and a 2D canvas,
without WebGL. Actual Safari and physical phone testing remain open.
