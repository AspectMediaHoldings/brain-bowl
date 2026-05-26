---
name: avatar-studio
description: Create a photoreal talking-head avatar of yourself and produce studio-grade short-form and long-form video. Covers the full pipeline: ElevenLabs voice cloning and synthesis, FFmpeg audio mastering (EBU R128), fal.ai lipsync (veed/fabric-1.0, musetalk, latentsync, sync-lipsync), CodeFormer face restoration, and HeyGen polished finals. Use when the user says "make an avatar", "talking-head video", "lipsync", "clone my voice", "put my face in a video", or needs broadcast-ready talking-head content.
---

# Avatar Studio

Studio-grade talking-head video from portrait image and voice. The pipeline
covers source prep, voice synthesis, audio mastering, lipsync, and assembly.
Two tracks: photoreal (your real face and voice) and stylized (3D or 2D persona).

## When to Activate

- User wants a talking-head of themselves
- User wants to clone their voice and have it speak a script
- User wants to lipsync a portrait or existing video to new audio
- User wants broadcast-quality audio on existing video
- User says "talking-head", "lipsync", "clone my voice", "avatar video", "digital twin"

## Pick a Track

Ask which track before generating anything.

- **Track A — Photoreal**: real face and voice. Best for narration, ads, and
  explainers where personal presence matters. Uses the MCP server tools.
- **Track B — Stylized**: 3D or 2D persona. Best for a branded character that
  does not need to be your literal face. Stays manual (see below).

## Prerequisites

The unified MCP server at `mcp-servers/avatar-studio/` exposes all Track A
tools. Install it once:

```bash
cd mcp-servers/avatar-studio
npm install
```

Register it in `~/.claude.json`:

```json
"avatar-studio": {
  "command": "node",
  "args": ["/path/to/claude-workspace/mcp-servers/avatar-studio/src/index.mjs"],
  "env": {
    "FAL_KEY": "YOUR_FAL_KEY",
    "ELEVENLABS_API_KEY": "YOUR_ELEVENLABS_KEY",
    "HEYGEN_API_KEY": "YOUR_HEYGEN_KEY"
  }
}
```

ffmpeg must be on PATH for `master_audio` and `assemble_video`.

## Quality Presets

Every tool that accepts a `quality` param uses these tiers:

| preset | voice model | audio format | lipsync (image) | lipsync (video) | cost |
|---|---|---|---|---|---|
| `draft` | eleven_flash_v2_5 | mp3_44100_128 | veed/fabric-1.0 480p | musetalk | cheapest |
| `final` | eleven_v3 | pcm_48000 | veed/fabric-1.0 720p | latentsync | balanced |
| `studio` | eleven_v3 | pcm_48000 | veed/fabric-1.0 720p | sync-lipsync-2-pro | best |

Always draft first. Spend on studio for the final render only.

## Track A: Studio Workflow

### Step 0 — Source portrait

The talking-head quality is ceiling-limited by the source image.

- Front-facing, both eyes open, straight at the lens.
- Even soft light (face a window). No harsh shadows, no mixed light.
- Plain background.
- Lips together or barely parted. The lipsync model animates the mouth — do
  not start with a wide-open smile.
- Fill the frame with head and top of shoulders.
- Higher resolution is better. Run `restore_face` if the source is compressed or low-res.

### Step 1 — Restore and upscale the portrait (optional, recommended)

```
restore_face(
  image_url: "<uploaded or hosted portrait URL>",
  output_path: "/output/portrait-restored.png",
  fidelity: 0.5,       # 0=maximize detail, 1=maximize identity
  upscale_factor: 2
)
```

Use `restore_face` when the source image is under 512px wide, shows JPEG
compression, or was taken in poor light. The CodeFormer model on fal.ai costs
$0.0021/megapixel — essentially free for a single portrait.

### Step 2 — Clone or select a voice

**Instant Voice Clone (IVC)** — immediate, API-accessible:

```
clone_voice(
  name: "Nathan Studio",
  sample_paths: ["/recordings/sample1.wav", "/recordings/sample2.wav"],
  remove_background_noise: true,   # enable if samples are not studio-clean
  labels: { language: "en", accent: "American", gender: "male" }
)
# Returns voice_id — save this. Reuse it on every script.
```

Capture spec for IVC samples:
- 1-5 minutes of clean audio.
- WAV 44.1/48 kHz, 24-bit (or MP3 320 kbps minimum).
- No background noise, no reverb. Level -12 to -6 dBFS.
- Varied sentences — different punctuation, pace, and length.

**Professional Voice Clone (PVC)** — highest quality, UI-only:
PVC fine-tunes the model on 30-180 minutes of audio. It is not accessible via
API. Go to elevenlabs.io dashboard, create a PVC voice there, and use the
resulting voice_id here. Requires Creator plan or higher.

### Step 3 — Synthesize speech

```
synthesize_speech(
  text: "Welcome to the product. Here is what you need to know.",
  voice_id: "<from clone_voice or list_voices>",
  output_path: "/output/narration-master.wav",
  quality: "studio",       # eleven_v3 + pcm_48000 for lossless master
  stability: 0.6,
  similarity_boost: 0.85,
  style: 0.1,
  language_code: "en"      # force English; prevents mid-sentence language switching
)
```

For multi-segment scripts, pass `previous_text` and `next_text` to get natural
prosody at sentence boundaries.

### Step 4 — Master the audio

```
master_audio(
  input_path: "/output/narration-master.wav",
  output_path: "/output/narration-mastered.wav",
  delivery_target: "podcast",    # -16 LUFS / -1.5 dBTP (versatile default)
  dialogue_chain: true           # highpass + denoise + compression + de-ess
)
```

Loudness targets:
- `streaming`: -14 LUFS, -1.0 dBTP (YouTube, Spotify)
- `podcast`: -16 LUFS, -1.5 dBTP (best versatile default for talking-head video)
- `broadcast`: -23 LUFS, -1.0 dBTP (EBU R128)

Add a music bed that ducks under dialogue:
```
master_audio(
  ...,
  music_bed_path: "/assets/background-music.mp3",
  music_bed_level: -22   # pre-duck music level in dBFS
)
```

### Step 5 — Lipsync (draft and final)

Upload the mastered audio to a public URL first (use the fal MCP `upload` tool
or any hosting you have access to). Then:

**Draft (iterate cheaply):**

For a talking head from a still portrait:
```
lipsync(
  audio_url: "<mastered audio URL>",
  image_url: "<restored portrait URL>",
  quality: "draft",
  output_path: "/output/draft.mp4"
)
```

For relipsync of an existing video:
```
lipsync(
  audio_url: "<mastered audio URL>",
  video_url: "<source video URL>",
  quality: "draft",
  output_path: "/output/draft.mp4"
)
```

**Final (studio quality for video relipsync):**
```
lipsync(
  audio_url: "<mastered audio URL>",
  video_url: "<source video URL>",
  quality: "studio",         # sync-lipsync-2-pro, $5/min
  sync_mode: "cut_off",
  output_path: "/output/final-lipsync.mp4"
)
```

Check cost before long renders:
```
lipsync(
  ...,
  estimate_cost_only: true
)
```

### Step 5b — Polished final via HeyGen (optional, uses plan credits)

Use HeyGen when the script is locked and you need the cleanest possible result.
Never iterate on HeyGen — draft with fal first.

```
generate_talking_head(
  avatar_id: "<your HeyGen avatar id>",
  voice_id: "<your HeyGen voice id>",
  input_text: "Welcome to the product...",
  output_path: "/output/heygen-final.mp4",
  resolution: "1080p",
  aspect_ratio: "16:9",
  background_type: "color",
  background_value: "#1a1a2e",
  caption: true,           # burns captions into video + returns sidecar SRT
  expressiveness: "medium",
  voice_speed: 1.0
)
```

For Reels / Shorts / TikTok: `resolution="1080p"`, `aspect_ratio="9:16"`.
For YouTube: `resolution="1080p"` or `"4k"`, `aspect_ratio="16:9"`.

### Step 6 — Assemble

```
assemble_video(
  clips: ["/output/heygen-final.mp4", "/output/broll-1.mp4"],
  output_path: "/output/final-delivery.mp4",
  reencode: true,
  width: 1920, height: 1080,
  export_preset: "delivery",   # H.264 CRF 23, AAC 192k (platform delivery)
  subtitle_path: "/output/captions.srt"   # optional burn-in
)
```

Export presets:
- `delivery`: H.264 CRF 23, AAC 192k, 48kHz. For platform upload.
- `master`: H.265 CRF 18, AAC 320k, 48kHz. For archival and editorial handoff.

## Platform Delivery Specs

| platform | resolution | aspect | loudness |
|---|---|---|---|
| YouTube (long-form) | 1920x1080 | 16:9 | -14 LUFS |
| Reels / Shorts / TikTok | 1080x1920 | 9:16 | -14 LUFS |
| Podcast video | 1280x720 | 16:9 | -16 LUFS |
| Broadcast | any | any | -23 LUFS EBU R128 |

## ElevenLabs Models

| model_id | quality | languages | use |
|---|---|---|---|
| `eleven_v3` | highest | 70+ | Studio masters |
| `eleven_multilingual_v2` | premium | 29 | Multilingual content |
| `eleven_flash_v2_5` | fast | 32 | Drafts, bulk |
| `eleven_flash_v2` | fast | English | English real-time |

`eleven_turbo_v2_5` is deprecated — do not use it.

## fal.ai Lipsync Models

| model | input | cost | best for |
|---|---|---|---|
| `veed/fabric-1.0` | image + audio | $0.08-0.15/s | Still portrait to talking head |
| `fal-ai/musetalk` | video + audio | cheap | Fast draft relipsync |
| `fal-ai/latentsync` | video + audio | $0.20 ≤40s | High-quality relipsync |
| `fal-ai/sync-lipsync/v2` | video + audio | $3-5/min | Studio relipsync |

## Voice Settings Reference

| setting | range | effect |
|---|---|---|
| `stability` | 0-1 | Higher = more consistent, lower = more expressive |
| `similarity_boost` | 0-1 | Higher = more like the original voice |
| `style` | 0-1 | Higher = more character and exaggeration |
| `speed` | 0.25-4.0 | Speech rate (1.0 = baseline) |
| `use_speaker_boost` | bool | Stronger similarity at slight latency cost |

Studio starting point: stability=0.6, similarity_boost=0.85, style=0.1, speed=1.0.

## Track B: Stylized Character

Stylized tracks have no API. Guide the user through desktop tools:

1. **Build the avatar.** Ready Player Me generates a 3D avatar (VRM) from a
   selfie. Free tier. Blender for fully custom characters.
2. **Animate it.** VSeeFace or VTube Studio drive the VRM from webcam using
   face tracking. Live2D for 2D characters.
3. **Voice.** Same as Track A. ElevenLabs clone or fal TTS.
4. **Capture.** Record the driven character as screen footage, then treat it as
   footage in `assemble_video`.

## Smoke Test

Prove the pipeline before scaling:

1. Pick a 512px+ front-facing portrait.
2. `restore_face` to clean and 2x upscale it.
3. `synthesize_speech` with any voice to produce a 10-second clip (quality=studio).
4. `master_audio` with delivery_target=podcast.
5. Upload portrait and audio to fal storage (use fal MCP upload tool).
6. `lipsync` at quality=final (veed/fabric-1.0 720p).
7. `assemble_video` with reencode=true and export_preset=delivery.

Needs: FAL_KEY, ELEVENLABS_API_KEY, and ffmpeg on PATH.

## Cost Notes

- fal lipsync: veed/fabric-1.0 is $0.08/s (480p) or $0.15/s (720p). A
  10-second 720p clip costs $1.50. Always `estimate_cost_only=true` before
  clips over 30 seconds.
- sync-lipsync-2-pro: $5/min. A 60-second clip costs $5.
- CodeFormer: $0.0021/megapixel. A 1024x1024 portrait costs $0.002.
- HeyGen: plan credits. Test your script with fal before committing.
- ElevenLabs: character quota. `eleven_v3` costs 1 credit/character.
  `eleven_flash_v2_5` costs 1 credit/2 characters.

## Related Skills

- `fal-ai-media` — raw fal MCP tools for search, upload, and generation
- `video-editing` — FFmpeg and Descript for full editorial assembly
- `generate-image` — source portraits and scene assets
- `remotion-video-creation` — programmatic overlays, captions, and motion graphics
- `manim-video` — technical explainer b-roll and diagrams
- `aspect-media-content-video` — short-form social and POD distribution
