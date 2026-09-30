# Video and image reference archive

This folder makes the ten attached Slack recordings inspectable without the original thread. `videos/video-NN.mp4` are H.264 review transcodes of the MOV attachments, retaining native dimensions and frame rate but removing no-audio tracks. `contact/video-NN.jpg` samples those review videos at 0.5-second intervals, ordered left to right and top to bottom in five columns. The matching timestamped observation logs live in `../research/video-NN.md`.

The exact original Slack file IDs, labels, durations, byte counts and SHA-256 digests are in `../research/SOURCES.md`. The original MOV bytes were downloaded for analysis but are not committed to avoid adding over 300 MB of redundant media to the repository. Recover each original through its Slack file ID and verify it against the manifest. The review MP4 files and contact sheets are committed with the implementation so the source visual material remains available to reconstruct the design.

The source clips include captured Safari, gallery and page controls. Those surrounds are evidence of the review process, not art to reproduce in the final website. Every observation log distinguishes visible facts from implementation requirements.

## Review copy checksums

| Copy | Bytes | SHA-256 |
| --- | ---: | --- |
| `video-01.mp4` | 3,474,951 | `00191b29b69dee8fa531d1888b34d7d5750c3c240cf9028fa670a2679f164f63` |
| `video-02.mp4` | 2,298,014 | `c0ce8dce0b5d0dc8586cf45e5f49aeb342ea0c3bf1818834d1cb28d7aac00b4c` |
| `video-03.mp4` | 6,083,560 | `809130fea1ac9e09ce6e805040ea2cdead0d31c7a05cc73a431e044f5abda5a8` |
| `video-04.mp4` | 5,822,431 | `2ff34affc9661799b16db5b9a4e9f198e4255696b62d74f3b7be2bc1c9bd4d27` |
| `video-05.mp4` | 1,643,597 | `d1c4d67dd7ed1ff6952a029cc30b40df09d7898c18169eb5cce5d7256b7da7a7` |
| `video-06.mp4` | 2,882,234 | `daade942dd1f1a6138801de1aba917af238b15278f79085a9505df3352c3d07f` |
| `video-07.mp4` | 3,314,763 | `96f740be1628a1cf7d709ef6c43ad3b75ffbebe4379dd7132b6913ecb969a22e` |
| `video-08.mp4` | 2,542,914 | `31b60b00f91092de972fffb986e8918abfa7114d978fbb5cc4d5780f035776a8` |
| `video-09.mp4` | 2,077,101 | `877ebf6c4fea439364d9d4565f3e8ea28cb9dccf93f2e1a343a95dde7782d694` |
| `video-10.mp4` | 30,450,241 | `03afedddb7790cb34c0d06cd7a8fd45195a7cb2c2bc93ab344683f3529ea06d9` |
