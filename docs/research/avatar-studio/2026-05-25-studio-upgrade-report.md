# Avatar Studio Studio-Grade Upgrade Report
Date: 2026-05-25
Branch: claude/avatar-video-generation-mcps-JEADQ
Server: mcp-servers/avatar-studio/ v0.2.0

---

## Summary

The Avatar Studio MCP server was upgraded from a six-tool prototype to an
eight-tool broadcast-grade pipeline. Every existing tool gained new parameters.
Two new tools were added. The SKILL.md and README were fully rewritten. All
API parameters were verified against official documentation before being
implemented. No parameters were invented.

---

## New Tool Surface

| tool | status | what changed |
|---|---|---|
| `list_voices` | unchanged | No changes needed |
| `synthesize_speech` | upgraded | +voice settings, +output_format, +language_code, +seed, +text continuity, +pronunciation dicts |
| `clone_voice` | upgraded | +labels, +remove_background_noise |
| `master_audio` | NEW | Two-pass EBU R128 loudnorm + dialogue chain + music bed duck + true-peak limit |
| `lipsync` | upgraded | +quality preset routing, +resolution, +sync_mode, +estimate_cost_only |
| `restore_face` | NEW | fal-ai/codeformer face restoration + 2x upscale before lipsync |
| `generate_talking_head` | upgraded | Migrated v2 → v3 API; +resolution, +aspect_ratio, +background, +caption, +expressiveness, +engine, +voice_settings |
| `assemble_video` | upgraded | +export_preset (delivery/master), +subtitle_path burn-in, +crossfade, +reencode |

---

## Before / After: Studio Voice Engineer

| capability | before | after |
|---|---|---|
| Default TTS model | `eleven_turbo_v2_5` (deprecated) | `eleven_v3` (highest quality, 70+ languages) |
| Voice settings | stability + similarity_boost only, hardcoded | All 5 exposed: stability, similarity_boost, style, speed, use_speaker_boost |
| Output format | mp3 only, no control | Full format enum: mp3_44100_128, pcm_48000, opus_48000_192, wav_48000, etc. |
| Language control | None | language_code (ISO 639-1) |
| Determinism | None | seed param (0-4294967295) |
| Text continuity | None | previous_text + next_text |
| Pronunciation | None | pronunciation_dictionary_locators (up to 3) |
| Clone labels | None | labels object (language, accent, gender, age) |
| Clone noise removal | None | remove_background_noise flag |
| PVC | Not mentioned | Documented as UI-only; voice_id reusable via API after training |

Studio starting point: stability=0.6, similarity_boost=0.85, style=0.1,
speed=1.0, use_speaker_boost=true, output_format=pcm_48000.

---

## Before / After: Studio Audio Engineer

| capability | before | after |
|---|---|---|
| Loudness normalization | None | Two-pass EBU R128 via `master_audio`, targets: streaming=-14, podcast=-16, broadcast=-23 LUFS |
| True-peak limiting | None | alimiter at -1.0 to -1.5 dBTP per target |
| Low-freq cleanup | None | highpass(80Hz) in dialogue chain |
| Noise reduction | None | afftdn(nf=-25) in dialogue chain |
| Dialogue compression | None | acompressor(3:1) in dialogue chain |
| De-essing | None | equalizer notch at 7.5kHz in dialogue chain |
| Music bed ducking | None | sidechaincompress via music_bed_path + music_bed_level |
| Export codec | H.264 hardcoded | export_preset: delivery (H.264 CRF23, AAC 192k) or master (H.265 CRF18, AAC 320k) |
| Subtitle burn-in | None | subtitle_path param in assemble_video |

The `master_audio` tool is the core new addition. It accepts any WAV or PCM
audio file, normalizes to broadcast spec, and optionally ducks a music bed.
The ffmpegCapture helper captures stderr reliably for the two-pass loudnorm
JSON extraction regardless of FFmpeg exit behavior.

---

## Before / After: Studio Video Engineer

| capability | before | after |
|---|---|---|
| Lipsync model selection | Single path, no guidance | Quality preset routing: draft/final/studio |
| veed/fabric-1.0 resolution | No control | resolution param: 480p (draft) or 720p (final/studio) |
| sync-lipsync-2-pro | Not available | Accessible via quality=studio, sync_mode param |
| Cost gate | None | estimate_cost_only=true before long renders |
| Face restoration | None | restore_face tool: CodeFormer via fal.ai, fidelity + upscale_factor |
| HeyGen API version | v2 (video_inputs array) | v3 (flat structure) |
| HeyGen resolution | Width/height integers | resolution enum: 720p, 1080p, 4k |
| HeyGen aspect ratio | None | aspect_ratio: 16:9, 9:16, 4:5, 1:1, auto |
| HeyGen background | None | background_type (color/image) + background_value |
| HeyGen captions | None | caption=true burns SRT into video |
| HeyGen expressiveness | None | expressiveness: high/medium/low |
| HeyGen Avatar V engine | None | engine_type: avatar_iv/avatar_v |
| HeyGen voice settings | None | voice_speed, voice_pitch, voice_volume, eleven_labs_model |

---

## Quality Presets

All tools that accept a `quality` param use these tiers:

| preset | voice model | output format | lipsync (image+audio) | lipsync (video+audio) | cost |
|---|---|---|---|---|---|
| `draft` | eleven_flash_v2_5 | mp3_44100_128 | veed/fabric-1.0 480p | fal-ai/musetalk | cheapest |
| `final` | eleven_v3 | pcm_48000 | veed/fabric-1.0 720p | fal-ai/latentsync | balanced |
| `studio` | eleven_v3 | pcm_48000 | veed/fabric-1.0 720p | fal-ai/sync-lipsync/v2 pro | best quality |

Always run `draft` first. Commit credits to `studio` only on the final locked script.

---

## Loudness and Delivery Targets

| delivery_target | integrated LUFS | true peak dBTP | use for |
|---|---|---|---|
| `streaming` | -14 LUFS | -1.0 dBTP | YouTube, Spotify, social |
| `podcast` | -16 LUFS | -1.5 dBTP | podcast, online video (default) |
| `broadcast` | -23 LUFS | -1.0 dBTP | EBU R128 broadcast |

Default is `podcast` (-16 LUFS). It leaves headroom for YouTube's -14 LUFS
normalization without pumping and matches common podcast delivery standards.

---

## Per-Platform Delivery Specs

| platform | resolution | aspect | codec | audio |
|---|---|---|---|---|
| YouTube (long-form) | 1920x1080 | 16:9 | H.264 | AAC 192k, -14 LUFS |
| Reels / Shorts / TikTok | 1080x1920 | 9:16 | H.264 | AAC 192k, -14 LUFS |
| Podcast video | 1280x720 | 16:9 | H.264 | AAC 192k, -16 LUFS |
| Edit master | 1920x1080 | any | H.265 CRF 18 | AAC 320k |

Use `export_preset=delivery` in `assemble_video` for H.264 platform cuts.
Use `export_preset=master` for H.265 archival and editorial handoff.

---

## New Keys and Dependencies

No new API keys beyond the existing three:
- `ELEVENLABS_API_KEY` — TTS, voice cloning (required for voice tools)
- `FAL_KEY` — lipsync, face restoration (required for fal tools)
- `HEYGEN_API_KEY` — talking-head finals (required for generate_talking_head)

New runtime dependency: `ffmpeg` must be on PATH for `master_audio` and
`assemble_video`. Install via:
- Windows: `winget install Gyan.FFmpeg`
- macOS: `brew install ffmpeg`
- Linux: `apt install ffmpeg`

No new npm packages. The server uses only `@modelcontextprotocol/sdk` and `zod`.

---

## Smoke Test Status

All syntax checks passed:
- `node --check src/index.mjs` — pass
- `node --check src/clients/elevenlabs.mjs` — pass
- `node --check src/clients/fal.mjs` — pass
- `node --check src/clients/heygen.mjs` — pass
- `node --check src/clients/ffmpeg.mjs` — pass
- `node --check src/clients/codeformer.mjs` — pass

MCP server started and all 8 tools registered successfully (verified via
`tools/list` protocol call — tool names and inputSchemas confirmed).

Live smoke test (10-second talking-head render): SKIPPED. FAL_KEY,
ELEVENLABS_API_KEY, and HEYGEN_API_KEY are not set in the current environment.
To run the smoke test, set all three keys in the MCP server env block in
`~/.claude.json` and restart Claude, then follow steps in SKILL.md Section
"Smoke Test."

---

## Files Changed

### Code

- `mcp-servers/avatar-studio/src/index.mjs` — full rewrite (v0.2.0, 8 tools)
- `mcp-servers/avatar-studio/src/clients/elevenlabs.mjs` — upgraded synthesizeSpeech + cloneVoice
- `mcp-servers/avatar-studio/src/clients/fal.mjs` — added uploadToFal, estimateFalCost, extractImageUrl
- `mcp-servers/avatar-studio/src/clients/heygen.mjs` — full rewrite (v2 → v3 API)
- `mcp-servers/avatar-studio/src/clients/ffmpeg.mjs` — added masterAudio, ffmpegCapture, updated assembleVideo
- `mcp-servers/avatar-studio/src/clients/codeformer.mjs` — NEW
- `mcp-servers/avatar-studio/src/util.mjs` — unchanged

### Documentation

- `mcp-servers/avatar-studio/README.md` — full rewrite
- `mcp-servers/avatar-studio/.env.example` — updated with ffmpeg install notes
- `.claude/skills/avatar-studio/SKILL.md` — full rewrite

### Research

- `docs/research/avatar-studio/2026-05-25-studio-upgrade-sources.md` — NEW
- `docs/research/avatar-studio/2026-05-25-gap-analysis.md` — NEW
- `docs/research/avatar-studio/2026-05-25-studio-upgrade-report.md` — this file

---

## Source List

1. ElevenLabs TTS API reference — https://elevenlabs.io/docs/api-reference/text-to-speech/convert
2. ElevenLabs Models overview — https://elevenlabs.io/docs/overview/models
3. ElevenLabs IVC create — https://elevenlabs.io/docs/api-reference/voices/ivc/create
4. ElevenLabs IVC guide — https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/instant-voice-cloning
5. ElevenLabs voice cloning concepts — https://elevenlabs.io/docs/eleven-api/concepts/voice-cloning
6. ElevenLabs PVC product guide — https://elevenlabs.io/docs/product-guides/voices/voice-cloning/professional-voice-cloning
7. veed/fabric-1.0 API — https://fal.ai/models/veed/fabric-1.0/api
8. fal-ai/musetalk API — https://fal.ai/models/fal-ai/musetalk/api
9. fal-ai/latentsync model — https://fal.ai/models/fal-ai/latentsync
10. fal-ai/sync-lipsync v2 API — https://fal.ai/models/fal-ai/sync-lipsync/v2/api
11. fal-ai/codeformer API — https://fal.ai/models/fal-ai/codeformer/api
12. HeyGen v3 create-video reference — https://developers.heygen.com/reference/create-video
13. HeyGen customize background — https://docs.heygen.com/docs/customize-video-background
14. HeyGen v2 avatar video — https://docs.heygen.com/reference/create-an-avatar-video-v2
15. FFmpeg loudnorm filter — https://ffmpeg.org/ffmpeg-filters.html#loudnorm
16. FFmpeg audio normalization guide — https://32blog.com/en/ffmpeg/ffmpeg-audio-normalization-loudnorm
17. ElevenLabs model comparison — https://help.elevenlabs.io/hc/en-us/articles/17883183930129
18. MuseTalk paper — https://arxiv.org/html/2410.10122v1
19. sync.labs lipsync v2 — https://fal.ai/models/fal-ai/sync-lipsync/v2
