# Avatar Studio Studio-Grade Upgrade — Research Sources
Date: 2026-05-25

Research conducted across three studio disciplines: voice, audio, and video.
All API parameters verified against official documentation.

---

## Studio Voice Engineer Findings

### ElevenLabs Models (confirmed current)

| model_id | Quality tier | Languages | Use case |
|---|---|---|---|
| `eleven_v3` | Highest | 70+ | Audiobooks, voiceovers, studio masters |
| `eleven_multilingual_v2` | Premium | 29 | Professional content, character voices |
| `eleven_flash_v2_5` | Fast | 32 | Real-time agents, drafts, bulk |
| `eleven_flash_v2` | Fast | English only | Real-time, English-only apps |

Deprecated (migrate away): `eleven_turbo_v2_5`, `eleven_turbo_v2`, `eleven_monolingual_v1`, `eleven_multilingual_v1`.

The previous server default `eleven_turbo_v2_5` is now deprecated. Studio default is `eleven_v3`.

### Voice Settings (all configurable per-request)

| field | type | default | effect |
|---|---|---|---|
| `stability` | 0-1 | 0.5 | Higher = more consistent, lower = more expressive/variable |
| `similarity_boost` | 0-1 | 0.75 | Adherence to original voice characteristics |
| `style` | 0-1 | 0 | Style exaggeration; 0 = neutral, 1 = maximum character |
| `speed` | 0.25-4.0 | 1.0 | Speech rate; 1.0 is baseline |
| `use_speaker_boost` | bool | true | Enhanced similarity at cost of slight latency increase |

Studio recommendations: stability 0.6, similarity_boost 0.85, style 0.1, speed 1.0, use_speaker_boost true.

### TTS Endpoint Parameters

POST `/v1/text-to-speech/{voice_id}?output_format=<format>`

Body params: `text` (required), `model_id`, `voice_settings` (object), `language_code` (ISO 639-1), `seed` (0-4294967295 for deterministic output), `apply_text_normalization` (auto/on/off), `pronunciation_dictionary_locators` (array, up to 3), `previous_text`, `next_text` (continuity context).

### Output Formats

| format | use |
|---|---|
| `mp3_44100_128` | Default delivery |
| `mp3_44100_192` | Higher-quality delivery |
| `pcm_44100` | Studio master (lossless PCM, write as .wav) |
| `pcm_48000` | Broadcast master (48kHz for video post) |
| `opus_48000_192` | Streaming-optimized, small file |
| `wav_44100` | Uncompressed wav |
| `wav_48000` | Uncompressed wav at broadcast sample rate |

Studio pipeline: generate at `pcm_48000`, run through `master_audio`, deliver as `mp3_44100_128` or `opus_48000_192`.

### Instant vs Professional Voice Clone

| factor | Instant (IVC) | Professional (PVC) |
|---|---|---|
| API | `/v1/voices/add` multipart form | UI-driven, no direct API |
| Audio needed | 1-5 minutes | 30 min minimum, 2-3 hours optimal |
| Mechanism | Conditioning signal at inference | Fine-tunes model parameters |
| Quality | Good, moderate consistency | Near-indistinguishable, high consistency |
| Plan required | Any | Creator tier or higher |
| Turnaround | Immediate | Hours (training queue) |

IVC via API: `name` (required), `files[]` (required, binary), `remove_background_noise` (bool, default false), `description` (string), `labels` (object: language, accent, gender, age keys).

PVC is UI-only (elevenlabs.io dashboard). No API endpoint exists to submit a PVC training job. The resulting voice_id is usable via API once training completes.

### Clone Audio Capture Spec

- Mic: condenser or dynamic with flat response (e.g. Shure SM7B, Audio-Technica AT2020)
- Room: quiet, treated. No HVAC, no echo. Hang moving blankets if no booth.
- Format: WAV, 44.1 kHz or 48 kHz, 24-bit. MP3 at 320 kbps minimum.
- Length: 1-5 min for IVC (clean, varied sentences). 30-180 min for PVC.
- Content: varied sentences, not just one phrase repeated. Include punctuation variety.
- Level: consistent -12 to -6 dBFS peak. No clipping.

### Pronunciation and Text Control

- `pronunciation_dictionary_locators`: pass up to 3 dictionary IDs created via `/v1/pronunciation-dictionaries`. Supports phoneme rules and aliases.
- `previous_text` / `next_text`: feed surrounding context for natural flow at sentence boundaries.
- `apply_text_normalization`: "auto" handles numbers/dates/abbreviations; "on" forces it; "off" passes raw text.

### Multilingual and Dubbing

`eleven_v3` and `eleven_multilingual_v2` support multilingual generation. Set `language_code` to force a specific language (e.g., "es" for Spanish) and prevent the model from switching mid-sentence. `eleven_flash_v2_5` covers 32 languages. All models accept standard ISO 639-1 codes.

---

## Studio Audio Engineer Findings

### Loudness Targets by Delivery Platform

| platform | integrated LUFS | true peak dBTP | standard |
|---|---|---|---|
| YouTube / social streaming | -14 LUFS | -1.0 dBTP | YouTube spec |
| Spotify / Apple Music | -14 LUFS | -1.0 dBTP | streaming normalization |
| Podcast | -16 LUFS | -1.0 dBTP | common podcast standard |
| Broadcast (EBU R128) | -23 LUFS | -1.0 dBTP | EBU R128 |
| Broadcast (ATSC A/85) | -24 LUFS | -2.0 dBTP | US broadcast |
| Online video master | -16 LUFS | -1.5 dBTP | versatile default |

Most versatile default for talking-head avatar video: -16 LUFS, -1.5 dBTP (podcast spec). This leaves headroom for YouTube's normalization to -14 without pumping.

### FFmpeg Loudnorm Two-Pass EBU R128

Pass 1 (measure):
```
ffmpeg -y -i input.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" \
  -f null -
```
Parse the JSON printed to stderr: `input_i`, `input_lra`, `input_tp`, `input_thresh`, `target_offset`.

Pass 2 (apply):
```
ffmpeg -y -i input.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:\
    measured_I=<input_i>:measured_LRA=<input_lra>:\
    measured_TP=<input_tp>:measured_thresh=<input_thresh>:\
    offset=<target_offset>:linear=true" \
  -ar 48000 output.wav
```
`linear=true` enables linear gain adjustment for accuracy when gain change is small.

### Dialogue Intelligibility Chain

Order matters. Apply before loudnorm:

1. `highpass=f=80` — cut sub-80Hz rumble (HVAC, handling noise)
2. `afftdn=nf=-25` — FFT denoiser, nf=-25 is gentle (less artifact than -30)
3. `acompressor=threshold=-18dB:ratio=3:attack=10:release=80:makeup=1` — gentle dialogue compression, 3:1 ratio
4. De-ess simulation: `equalizer=f=7500:width_type=o:width=2:g=-3` — notch ~7.5kHz by 3dB to tame sibilance
5. Loudnorm two-pass (described above)
6. `alimiter=limit=0.891:attack=5:release=50` — true-peak limit at -1.0 dBTP (0.891 ≈ 10^(-1/20))

### Music Bed Ducking (sidechaincompress)

```
ffmpeg -y -i voice.wav -i music.wav \
  -filter_complex \
    "[0:a]<dialogue_chain>[voice];\
     [1:a]volume=-18dB[music];\
     [music][voice]sidechaincompress=threshold=0.05:ratio=8:attack=10:release=100:makeup=1[ducked];\
     [voice][ducked]amix=inputs=2:duration=longest[out]" \
  -map "[out]" -ar 48000 output.wav
```
The sidechain compresses music (first input to sidechaincompress) when voice (second input, the key) crosses threshold. Ratio 8:1 achieves ~12-15dB of ducking. Release 100ms gives natural re-emergence.

### Sample Rate and Bit Depth

- Master: 48kHz, 32-bit float or 24-bit PCM (video post standard)
- Delivery: 48kHz, 16-bit PCM (audio) or 44.1kHz, 16-bit for music-only
- Never downsample before processing. Upsample at export only.
- ElevenLabs PCM output: use `pcm_48000` for video post masters.

---

## Studio Video Engineer Findings

### fal.ai Lipsync and Talking-Head Models (confirmed 2026)

| model slug | input | resolution | pricing | best for |
|---|---|---|---|---|
| `veed/fabric-1.0` | image + audio | 480p ($0.08/s), 720p ($0.15/s) | per second | Photoreal talking-head from still, up to 5 min |
| `fal-ai/musetalk` | video + audio | inherits source | low | Fast drafts, relipsync existing video |
| `fal-ai/latentsync` | video + audio | inherits source | $0.20 ≤40s, $0.005/s >40s | High-quality relipsync, ByteDance diffusion |
| `fal-ai/sync-lipsync/v2` | video + audio | inherits source | $3/min (standard), $5/min (pro) | Studio relipsync, highest open-source quality |

veed/fabric-1.0 confirmed schema: `image_url` (required), `audio_url` (required), `resolution` ("480p"\|"720p", required).

sync-lipsync/v2 confirmed schema: `video_url` (required), `audio_url` (required), `model` ("lipsync-2"\|"lipsync-2-pro"), `sync_mode` ("cut_off"\|"loop"\|"bounce"\|"silence"\|"remap").

musetalk confirmed schema: `source_video_url` (required), `audio_url` (required). No quality params.

latentsync confirmed schema: `video_url` (required), `audio_url` (required). $0.20 flat for ≤40s clips.

### fal.ai Face Restoration (CodeFormer)

`fal-ai/codeformer` — image restoration and upscaling:
- `image_url` (required)
- `fidelity` (float, default 0.5): 0.0 = maximize quality/detail, 1.0 = maximize identity preservation
- `upscale_factor` (float, default 2): 1x–4x upscaling
- `aligned` (bool): whether faces are already aligned
- `only_center_face` (bool): process only center face (faster)
- `face_upscale` (bool, default true): apply face upscaling
- `seed` (int): reproducibility
- Pricing: $0.0021/megapixel (very cheap for portrait restoration)
- Output: image URL

Use case: clean up source portrait before lipsync. Run CodeFormer on the source image at fidelity=0.5, 2x upscale. This removes compression artifacts and sharpens detail before veed/fabric-1.0 generates the talking head.

### HeyGen Avatar Tiers (v3 API)

The v3 API uses a flat structure at POST /v3/videos with rich options:

| field | values | notes |
|---|---|---|
| `resolution` | "720p", "1080p", "4k" | 4k is premium |
| `aspect_ratio` | "16:9", "9:16", "4:5", "5:4", "1:1", "auto" | auto detects from avatar |
| `output_format` | "mp4", "webm" | webm = transparent background |
| `background.type` | "color", "image" | |
| `background.value` | hex string | e.g. "#000000" |
| `background.url` | URL string | for image background |
| `remove_background` | bool | requires matting-enabled avatar |
| `caption.style` | "default" | burns captions into video |
| `caption.file_format` | "srt" | also generates sidecar SRT |
| `expressiveness` | "high", "medium", "low" | photo avatars, Avatar IV |
| `engine.type` | "avatar_iv", "avatar_v" | Avatar V for eligible avatars |
| `voice_settings.speed` | 0.5–1.5 | multiplier |
| `voice_settings.pitch` | -50 to +50 | semitones |
| `voice_settings.volume` | 0.0–1.0 | |
| `voice_settings.engine_settings.engine_type` | "elevenlabs", "fish", "starfish" | pass-through to TTS engine |

ElevenLabs engine_settings: `model` (eleven_v3, eleven_multilingual_v2, eleven_flash_v2_5), `similarity_boost`, `stability`, `style`, `use_speaker_boost`.

Avatar tiers: photo avatar (cheapest, IVC-quality lifelikeness), studio avatar (trained on longer recordings, significantly more lifelike), digital twin (highest fidelity, trained on video). The v3 API accepts any avatar_id regardless of tier.

### Per-Platform Delivery Specs

| platform | resolution | aspect | fps | codec | bitrate | audio |
|---|---|---|---|---|---|---|
| YouTube (long-form) | 1920x1080 | 16:9 | 30 | H.264 | 8-12 Mbps | AAC 192k, -14 LUFS |
| Reels / Shorts / TikTok | 1080x1920 | 9:16 | 30 | H.264 | 6-8 Mbps | AAC 192k, -14 LUFS |
| Podcast video | 1280x720 | 16:9 | 30 | H.264 | 4-6 Mbps | AAC 192k, -16 LUFS |
| Editable master | 1920x1080+ | any | 30 | H.265 CRF 18 | ~4-6 Mbps | PCM 48kHz 24-bit |

### Codec Guidance

- Draft/iteration: H.264 CRF 23 (default ffmpeg quality, fast encode)
- Delivery: H.264 CRF 22-23, -preset slow, yuv420p, AAC 192k at 48kHz
- Master: H.265 CRF 18, -preset medium, yuv420p, PCM or AAC 320k at 48kHz
- ProRes: use ProRes 422 HQ for editorial handoff (large files, not in this server — use video-editing skill)

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
