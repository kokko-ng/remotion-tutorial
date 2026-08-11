# System Design in Azure

- Preset: `terminal` (dark systems look, karaoke subtitles)
- Length: about 87 seconds, 4 scenes, 1 chapter
- Audience: interview preparation
- Through-line: store, move, remember.

Storyboard:

1. `S01_Title` - mono title card, "design a URL shortener" prompt spoken.
2. `S02_Skeleton` - Front Door, App Service, Cosmos DB nodes snap in left to
   right as each is named, with pulsing request arrows.
3. `S03_Scale` - the skeleton rebuilds quickly, then Redis appears at
   "Redis", the queue at "queue" with a drain arrow up to Cosmos, and a
   CodePanel shows a 6-line document with the partitionKey line highlighted
   exactly when "partition" is spoken.
4. `S04_Recall` - plain recap boxes: store (Cosmos DB), move (Front Door +
   queue), remember (Redis + partition key).

Grounding: Front Door, App Service, Cosmos DB partitioning, Cache for Redis,
and Storage queues semantics per Microsoft Learn documentation. Service names
rendered as plain labeled boxes; no logos or reproduced diagrams.
