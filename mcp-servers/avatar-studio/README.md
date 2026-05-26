# avatar-studio MCP server

Studio-grade avatar video pipeline behind one MCP: voice synthesis and cloning,
audio mastering, lipsync, face restoration, polished talking-head renders, and
clip assembly. Pairs with the `avatar-studio` skill in `.claude/skills/avatar-studio/`.

## Tools

| Tool | Backend | Key needed | Purpose |
|---|---|---|---|
| `list_voices` | ElevenLabs | `ELEVENLABS_API_KEY` | Discover voice ids. |
| `synthesize_speech` | ElevenLabs | `ELEVENLABS_API_KEY` | Script to audio with full voice-settings control. |
| `clone_voice` | ElevenLabs IVC | `ELEVENLABS_API_KEY` | Create a voice clone from samples. |
| `master_audio` | FFmpeg | ffmpeg on PATH | Loudness-normalize, dialogue chain, optional music-bed duck. |
| `lipsync` | fal.ai | `FAL_KEY` | Drive portrait or video with audio. Quality presets select the best model. |
| `restore_face` | fal.ai CodeFormer | `FAL_KEY` | Clean up and upscale source portrait before lipsync. |
| `generate_talking_head` | HeyGen v3 | `HEYGEN_API_KEY` | Polished final render: 4k, captions, background, ElevenLabs engine. |
| `assemble_video` | FFmpeg | ffmpeg on PATH | Concatenate clips, optional subtitle burn-in and export presets. |

## Install

```bash
cd mcp-servers/avatar-studio
npm install
node --check src/index.mjs   # syntax check
```

## Configure

Add to `~/.claude.json`. Supply only the keys you have — tools whose key is
missing will error when called but will not break the server.

```json
"avatar-studio": {
  "command": "node",
  "args": ["/absolute/path/to/claude-workspace/mcp-servers/avatar-studio/src/index.mjs"],
  "env": {
    "FAL_KEY": "YOUR_FAL_KEY",
    "ELEVENLABS_API_KEY": "YOUR_ELEVENLABS_KEY",
    "HEYGEN_API_KEY": "YOUR_HEYGEN_KEY"
  }
}
```

Restart Claude after adding the config.

## Quality presets

The `quality` parameter on `synthesize_speech` and `lipsync` routes to the right
model and settings automatically.

| preset | voice | lipsync (image+audio) | lipsync (video+audio) | cost |
|---|---|---|---|---|
| `draft` | eleven_flash_v2_5, mp3_44100_128 | veed/fabric-1.0 480p | fal-ai/musetalk | cheapest |
| `final` | eleven_v3, pcm_48000 | veed/fabric-1.0 720p | fal-ai/latentsync | balanced |
| `studio` | eleven_v3, pcm_48000 | veed/fabric-1.0 720p | fal-ai/sync-lipsync/v2 (pro) | best quality |

Iterate on `draft`. Spend on `studio` only for final renders.

## Loudness targets (`master_audio`)

| `delivery_target` | integrated LUFS | true peak | use for |
|---|---|---|---|
| `streaming` | -14 LUFS | -1.0 dBTP | YouTube, Spotify, social |
| `podcast` | -16 LUFS | -1.5 dBTP | podcast, online video (default) |
| `broadcast` | -23 LUFS | -1.0 dBTP | EBU R128 broadcast |

The dialogue chain (enabled by default) applies: highpass(80Hz) to cut rumble,
afftdn to denoise, gentle 3:1 compression for consistency, and a 7.5kHz notch
to reduce sibilance. Disable `dialogue_chain` for music-only content.

## Per-platform delivery specs

| platform | resolution | aspect | codec | audio |
|---|---|---|---|---|
| YouTube | 1920x1080 | 16:9 | H.264 | AAC 192k, -14 LUFS |
| Reels / Shorts / TikTok | 1080x1920 | 9:16 | H.264 | AAC 192k, -14 LUFS |
| Podcast video | 1280x720 | 16:9 | H.264 | AAC 192k, -16 LUFS |
| Edit master | 1920x1080 | any | H.265 CRF 18 | AAC 320k, PCM 48kHz |

Use `export_preset=delivery` in `assemble_video` for H.264 delivery cuts.
Use `export_preset=master` for H.265 archival masters.

## Recommended studio workflow

```
1. restore_face       — clean the source portrait (fidelity=0.5, upscale_factor=2)
2. synthesize_speech  — quality=studio generates pcm_48000 for lossless master audio
3. master_audio       — loudnorm to delivery_target=podcast, dialogue chain enabled
4. lipsync            — quality=final or studio (upload mastered audio to fal first)
5. generate_talking_head — HeyGen v3 for highest fidelity finals (1080p, captions)
6. assemble_video     — join segments, export_preset=delivery for platform upload
```

## Clone audio capture spec

For Instant Voice Clone (IVC, immediate, API-accessible):
- 1-5 minutes of clean audio works well.
- WAV 44.1 kHz or 48 kHz, 24-bit. MP3 320 kbps minimum.
- No background noise, no reverb, consistent level (-12 to -6 dBFS peak).
- Varied sentences covering a range of punctuation and pace.

For Professional Voice Clone (PVC, near-indistinguishable quality):
- 30 minutes minimum, 2-3 hours for best results.
- Same format requirements.
- PVC fine-tunes the model on your audio rather than conditioning at inference.
- PVC is created via the ElevenLabs dashboard only — no API endpoint. The
  resulting voice_id is reusable via API once training completes.
  Requires Creator plan or higher.

## ElevenLabs models

| model_id | quality | languages | use |
|---|---|---|---|
| `eleven_v3` | highest | 70+ | Studio masters, audiobooks, emotional content |
| `eleven_multilingual_v2` | premium | 29 | Professional multilingual content |
| `eleven_flash_v2_5` | fast | 32 | Drafts, real-time, bulk processing |
| `eleven_flash_v2` | fast | English | English-only real-time |

`eleven_turbo_v2_5` is deprecated — migrate to `eleven_flash_v2_5`.

## fal.ai lipsync models

| slug | input | resolution | cost | notes |
|---|---|---|---|---|
| `veed/fabric-1.0` | image + audio | 480p / 720p | $0.08-0.15/s | Image to talking head. Best open model for still portraits. |
| `fal-ai/musetalk` | video + audio | source | low | Real-time speed, good for quick drafts. |
| `fal-ai/latentsync` | video + audio | source | $0.20 ≤40s, $0.005/s | ByteDance diffusion, high quality relipsync. |
| `fal-ai/sync-lipsync/v2` | video + audio | source | $3-5/min | Highest open quality. lipsync-2-pro recommended. |

Always run `estimate_cost_only=true` before long renders.

## HeyGen v3 (generate_talking_head)

The server uses the HeyGen v3 API (`POST /v3/videos`). Key additions over the
old v2 integration: resolution enum (720p/1080p/4k), aspect ratio selection
(16:9/9:16 for vertical video), background customization (color or image URL),
caption burn-in, expressiveness control, Avatar V engine, and ElevenLabs
engine passthrough for voice settings.

No test mode exists in v3. Every render uses plan credits. Test the script
with a `draft` fal.ai lipsync before committing to a HeyGen render.

## Notes

- **Stylized characters** (Ready Player Me, VSeeFace, Blender, Live2D) have no
  clean API. Capture that character as footage and feed it into `assemble_video`.
- **HeyGen WebM** (remove_background=true) returns a video with alpha channel.
  Compose it over any background in a video editor or via FFmpeg overlay.
- **fal result shapes vary** by model. `lipsync` extracts the first video URL
  it finds. If a new model returns an unusual shape, the error includes the raw
  result for debugging.
- **ffmpeg** must be on PATH for `master_audio` and `assemble_video`. Install
  via `winget install Gyan.FFmpeg` (Windows), `brew install ffmpeg` (macOS),
  or `apt install ffmpeg` (Linux).
