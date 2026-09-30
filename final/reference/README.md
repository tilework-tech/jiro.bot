# Video and image reference archive

This folder makes the ten attached Slack recordings inspectable without the original thread. `videos/video-NN.mp4` are H.264 review transcodes of the MOV attachments, retaining native dimensions and frame rate but removing no-audio tracks. `contact/video-NN.jpg` samples those review videos at 0.5-second intervals, ordered left to right and top to bottom in five columns. The matching timestamped observation logs live in `../research/video-NN.md`.

The exact original Slack file IDs, labels, durations, byte counts and SHA-256 digests are in `../research/SOURCES.md`. The original MOV bytes were downloaded for analysis but are not committed to avoid adding over 300 MB of redundant media to the repository. Recover each original through its Slack file ID and verify it against the manifest. The review MP4 files and contact sheets are committed with the implementation so the source visual material remains available to reconstruct the design.

The source clips include captured Safari, gallery and page controls. Those surrounds are evidence of the review process, not art to reproduce in the final website. Every observation log distinguishes visible facts from implementation requirements.
