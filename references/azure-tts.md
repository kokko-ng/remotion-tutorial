# Azure TTS pipeline

Voiceover comes from the Azure Speech **batch synthesis** REST API, with the
key fetched at runtime via the az CLI. This path was chosen because it needs
zero Python dependencies, synthesizes a whole video in one job, and returns
word-level timestamps as clean JSON artifacts.

## Auth

`scripts/generate_voiceover.py` runs:

```bash
az cognitiveservices account keys list -n <resource> -g <rg> [--subscription <id>] --query key1 -o tsv
```

The key stays in process memory; the `SPEECH_KEY` env var overrides it (useful
in CI). Both `SpeechServices` and `AIServices` kind resources work; the
resource must have a custom subdomain (default for new resources).

## The batch job

One `PUT` per video:

```
PUT https://<resource>.cognitiveservices.azure.com/texttospeech/batchsyntheses/<jobId>?api-version=2024-04-01
Ocp-Apim-Subscription-Key: <key>
```

```json
{
  "inputKind": "PlainText",
  "synthesisConfig": {"voice": "en-US-AndrewMultilingualNeural", "rate": "-4%"},
  "inputs": [{"content": "scene 1 text"}, {"content": "scene 2 text"}],
  "properties": {
    "outputFormat": "riff-24khz-16bit-mono-pcm",
    "wordBoundaryEnabled": true,
    "sentenceBoundaryEnabled": true,
    "concatenateResult": false
  }
}
```

Inputs map to numbered outputs in order: `0001.wav`, `0001.word.json`, ...
Poll the same URL every 8 seconds until `status` is `Succeeded` (typically
10 to 120 seconds), then download the ZIP at `outputs.result` with the same
key header. `summary.json` carries `durationInMilliseconds` per input, which
the script writes into `scenes.json` as `durationSec`.

Artifacts on the service auto-delete after a few days; the script downloads
immediately, so this never matters.

## Word timestamps

`0001.word.json` entries look like `{"Text": "Hello", "AudioOffset": 100,
"Duration": 275}` with milliseconds. Punctuation arrives as its own token
(`{"Text": "."}`); the script tags these `punct: true` and `build_srt.py`
uses them as phrase-break signals. Normalized per-scene output:

```json
[{"text": "Hello", "startMs": 100, "durationMs": 275, "punct": false}]
```

Scene components consume this via `useJson` + `wordFrame(words, 'Hello')`.

## Voice notes

- Default: `en-US-AvaMultilingualNeural` at rate -4 percent (the user picked
  Ava over Andrew). About 155 wpm effective at that rate.
- Alternatives: `en-US-AndrewMultilingualNeural`, `en-US-BrianMultilingualNeural`.
- If a multilingual voice ever returns sparse word boundaries, fall back to
  `en-US-GuyNeural`.
- Regenerate a subset after script edits with `--scenes s02,s05`; only those
  files are rewritten.

## Fallback: Speech SDK

If the batch path is unavailable (rare; some sovereign clouds), use the
`azure-cognitiveservices-speech` Python package: `SpeechSynthesizer` with a
`WordBoundary` event handler, converting the event ticks (100 ns units) to
milliseconds, one synthesis call per scene. Same output file contract as the
batch script, so nothing downstream changes.
