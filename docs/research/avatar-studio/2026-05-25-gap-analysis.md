# Avatar Studio Gap Analysis
Date: 2026-05-25

Matrix: capability vs studio-grade standard vs current state vs gap vs fix.

---

## Studio Voice Engineer — ElevenLabs

| capability | studio-grade standard | current state | gap | fix |
|---|---|---|---|---|
| TTS model | eleven_v3 (highest quality, 70+ languages) | eleven_turbo_v2_5 (deprecated) | Using deprecated, lower-quality model | Update default to `eleven_v3` |
| Voice settings | All 5 params exposed: stability, similarity_boost, style, speed, use_speaker_boost | Hardcoded: stability=0.5, similarity_boost=0.75 only | Cannot tune delivery, emotion, or pacing | Expose all 5 as tool params with studio defaults |
| Output format | pcm_48000 for masters; mp3_44100_128 for delivery | Always mp3 (implicit, no control) | Cannot produce lossless master for post-processing | Add output_format param with full format enum |
| Language control | language_code for forced language | None | Mixed-language content switches without warning | Add language_code param |
| Determinism | seed param for reproducible takes | None | Cannot reproduce a take | Add seed param |
| Text context | previous_text / next_text for continuity | None | Unnatural sentence boundaries in multi-segment scripts | Add previous_text / next_text params |
| IVC clone labels | labels object (language, accent, gender, age) | None | Clones untagged, hard to discover | Add labels param to clone_voice |
| IVC noise removal | remove_background_noise flag | None | Noisy samples degrade clone quality | Add remove_background_noise flag |
| PVC (professional) | 30-180 min audio, model fine-tune, near-indistinguishable | Not supported | Highest-quality clone unavailable via server | Document as UI-only limitation; guide user to dashboard |
| Pronunciation | pronunciation_dictionary_locators | None | Brand names / acronyms mispronounced | Add pronunciation_dictionary_locators param |

---

## Studio Audio Engineer — FFmpeg post-processing

| capability | studio-grade standard | current state | gap | fix |
|---|---|---|---|---|
| Loudness normalization | Two-pass EBU R128, target -14/-16/-23 LUFS per platform | None (no audio post at all) | Raw TTS audio delivered unmastered | New `master_audio` tool |
| True-peak limiting | alimiter at -1.0 to -1.5 dBTP | None | Peaks can clip in downstream encoding | Included in `master_audio` |
| Low-freq cleanup | highpass f=80 | None | Rumble and handling noise degrade intelligibility | Included in dialogue chain |
| Noise reduction | afftdn nf=-25 | None | Background noise from clone source bleeds through | Included in dialogue chain |
| Dialogue compression | acompressor 3:1 gentle | None | Loud/soft variations reduce intelligibility | Included in dialogue chain |
| De-essing | Sibilance attenuation ~7.5kHz | None | Harsh esses in close-mic recording | Included via equalizer notch |
| Music bed ducking | sidechaincompress | None | Music fights dialogue when mixed | `master_audio` optional music_bed_path |
| Assembly audio quality | Loudness-normalized across all clips | No audio processing | Level mismatch between joined segments | `assemble_video` normalize_loudness option |
| Subtitle burn-in (assembly) | ffmpeg subtitles filter from SRT | None | Captions must be added in external editor | `assemble_video` subtitle_path param |
| Export codec | H.264/H.265 per preset | H.264 hardcoded | No master vs delivery distinction | `assemble_video` export_preset param |

---

## Studio Video Engineer — fal.ai / HeyGen

| capability | studio-grade standard | current state | gap | fix |
|---|---|---|---|---|
| Lipsync quality presets | draft (musetalk, fast), final (veed 720p), studio (sync-lipsync-pro) | Single path, no presets | No guidance on model selection | `quality` param with preset routing |
| veed/fabric-1.0 resolution | 720p default, 480p for drafts | No resolution control (API default) | Always at API default (likely 480p) | `resolution` param for veed models |
| Cost gate | estimate before long renders | None | Surprise billing on long clips | `estimate_cost` mode + cost info in output |
| sync-lipsync model tier | lipsync-2-pro for studio quality | Not available | Best open-source lipsync model not accessible | Add sync-lipsync/v2 path with model param |
| sync-lipsync sync_mode | Control duration handling | Not available | Duration mismatch causes silent tail or cutoff | Add sync_mode param |
| Face restoration (source) | CodeFormer on source portrait | None | Compressed/low-res source degrades output | New `restore_face` tool (fal-ai/codeformer) |
| HeyGen resolution | 720p / 1080p / 4k | Width/height integer only | No quality enum, v2 API not resolution-aware | Migrate to v3 API with resolution enum |
| HeyGen aspect ratio | 16:9 / 9:16 / etc | Width/height only | Vertical video (9:16) requires manual dimension math | Add aspect_ratio param |
| HeyGen background | color / image / video | None (default only) | No scene context for talking head | Add background_type + background_value |
| HeyGen captions | Burned-in or sidecar SRT | None | Captions must be added externally | Add caption param (style: default = burn) |
| HeyGen expressiveness | high / medium / low | None | Flat, affectless delivery | Add expressiveness param |
| HeyGen Avatar V engine | engine_type: avatar_v | avatar_style: "normal" (v2 field) | Stuck on Avatar IV, missing newest quality tier | Add engine param for avatar_iv / avatar_v |
| HeyGen voice settings | speed, pitch, volume, ElevenLabs engine_settings | None | Cannot slow down, adjust pitch, or use eleven_v3 via HeyGen | Add voice_settings block |
| HeyGen test mode | No test mode in v3 | No test mode | Credits consumed on every development render | Note in docs; v3 has no test mode param |

---

## Cross-Cutting Gaps

| gap | fix |
|---|---|
| No studio preset wiring best choices end-to-end | Add quality preset param across all tools |
| No .env.example | Add .env.example |
| SKILL.md and README are not updated to match any future state | Full rewrite of both docs |
