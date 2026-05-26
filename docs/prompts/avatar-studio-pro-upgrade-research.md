# Avatar Studio — Studio-Grade Upgrade (deep research + full implementation)

How to run this on your local machine:
1. Pull the branch: `git checkout claude/avatar-video-generation-mcps-JEADQ && git pull`
2. From the repo root, start Claude Code and paste everything below the line, or run
   `claude -p "$(cat docs/prompts/avatar-studio-pro-upgrade-research.md)"`.
3. Optional: copy this into `.claude/commands/avatar-studio-pro.md` to get a
   reusable `/avatar-studio-pro` slash command.

You will need `FAL_KEY`, `ELEVENLABS_API_KEY`, and (for finals) `HEYGEN_API_KEY`
set to run the smoke tests at the end. The research and code changes do not need
keys; only the live verification does.

---

# PROMPT

## Mission

You are a three-person studio team brought in to take this repository's **Avatar
Studio** from a working prototype to **broadcast / studio-grade** quality. Your
job has two halves: (1) run a deep research project into current professional
practice and the latest provider capabilities, then (2) ship a full, working
update to the skill and the MCP server so the system performs like professionals
in three disciplines.

Operate as all three of these experts, and make every recommendation and code
change defensible from their point of view:

- **Studio Voice Engineer** — voice cloning fidelity and text-to-speech direction.
  Owns ElevenLabs mastery: instant vs professional voice clones, voice settings
  (stability, similarity, style, speed, speaker boost), pronunciation
  dictionaries, SSML and pause control, emotional delivery and pacing, output
  format and sample rate choices, multilingual and dubbing, and the recording
  spec for capturing clean clone source audio.
- **Studio Audio Engineer** — audio post and mastering. Owns loudness standards
  (for example streaming around -14 LUFS, podcasts around -16 LUFS, broadcast
  EBU R128 / ATSC A/85 around -23 to -24 LUFS), true-peak limiting, noise
  reduction, de-essing, EQ and compression for dialogue intelligibility, music
  bed ducking / sidechain, sample rate and bit depth, and clean capture specs.
- **Studio Video Engineer / Developer** — talking-head, lipsync, and render
  quality. Owns lipsync model selection and tuning across fal.ai (veed/fabric,
  musetalk, latentsync, and any newer models you find), resolution / fps /
  bitrate, codecs (H.264, H.265, ProRes for masters), color (Rec.709),
  framing and composition, HeyGen avatar tiers and quality, backgrounds and
  greenscreen, caption / subtitle burn-in, gaze and temporal consistency, face
  restoration and upscaling, aspect ratios, and per-platform delivery specs.

## Current state (read these first, do not assume)

Read the actual files before changing anything:

- Skill: `.claude/skills/avatar-studio/SKILL.md`
- MCP server: `mcp-servers/avatar-studio/` — ESM, no build step, uses
  `@modelcontextprotocol/sdk` and `zod`, stdio transport. Entry `src/index.mjs`.
  Clients in `src/clients/{elevenlabs,fal,heygen,ffmpeg}.mjs`, helpers in
  `src/util.mjs`. README in the same folder.

The six current tools and their thin spots, as a starting point for your gap
analysis (verify against the code, this list may drift):

- `list_voices` — fine.
- `synthesize_speech` — only `text`, `voice_id`, `model_id`, `output_path`. No
  voice settings, no output format / sample rate, no SSML or pause control, no
  pronunciation handling, no language or seed.
- `clone_voice` — instant clone only (`name`, `sample_paths`, `description`). No
  professional voice clone path, no labels, no quality guidance.
- `lipsync` — `audio_url`, `image_url` or `video_url`, `model`, `output_path`.
  No resolution / fps / quality control, no face restoration or upscale, no
  cost estimate gate.
- `generate_talking_head` — HeyGen: `avatar_id`, `voice_id`, `input_text`,
  `width`, `height`, `output_path`. No background, captions, avatar style, or
  emotion control.
- `assemble_video` — concat with optional re-encode. No loudness normalization,
  no true-peak limiting, no caption burn-in, no color, no transitions, no music
  ducking.

## Phase 1 — Deep research (cite everything)

Use this workspace's web tooling to research. Per the repo `CLAUDE.md`, prefer the
`/browse` skill from gstack for all web browsing; fall back to WebSearch /
WebFetch if `/browse` is unavailable. Research current (2026) material, and treat
provider APIs as moving targets — confirm parameter names and model slugs against
official docs rather than trusting any hardcoded value.

Answer these, by persona, with source URLs:

Voice engineer:
- ElevenLabs current models and when to use each. Full list of voice settings and
  their effect. Instant vs professional voice clone: quality difference, sample
  requirements, when each is worth it. Pronunciation dictionaries and SSML / break
  support. Output formats and sample rates the API offers and which to pick for a
  studio master. Multilingual / dubbing capabilities. The capture spec for clone
  source audio (mic, room, length, format).

Audio engineer:
- Target loudness and true-peak specs per delivery target (social, YouTube,
  podcast, broadcast). The FFmpeg chain to hit them (loudnorm / EBU R128 two-pass,
  alimiter, highpass, afftdn or arnndn denoise, de-ess, gentle compression). How
  to duck a music bed under dialogue (sidechaincompress). Sample rate and bit
  depth for masters vs delivery.

Video engineer:
- Current fal.ai lipsync and talking-head models, their inputs, max resolution,
  fps, clip length, and cost. Quality-ranked recommendation for drafts vs finals.
  Face restoration / upscaling options (for example GFPGAN, CodeFormer, or fal
  upscalers) and when they help a generated talking head. HeyGen avatar tiers
  (photo, studio, interactive) and which yields the most lifelike result, plus
  background and caption options. Per-platform delivery specs (resolution, codec,
  bitrate, aspect) for Reels / Shorts / TikTok and YouTube. Codec choices for an
  editable master (ProRes / H.265) vs final delivery (H.264).

## Phase 1.5 — Save and publish the research (always do this)

Capture the Phase 1 findings and the full source list as one Markdown file:

- Write it to `docs/research/avatar-studio/<YYYY-MM-DD>-studio-upgrade-sources.md`
  (create the `docs/research/avatar-studio/` directory if it does not exist).
  Structure it by persona (voice, audio, video) with the key findings under each,
  then a numbered source list of every URL you used. Commit this file on the
  working branch.
- Then upload the same file to Google Drive, if a Google Drive MCP server is
  connected on this machine. Do not hardcode a server name; use whatever Drive
  MCP is present. Steps:
  1. Find the target folder. Search Drive for a folder titled "AI Avatar"
     (`mimeType = 'application/vnd.google-apps.folder' and title = 'AI Avatar'`).
     Use its id as the parent if found, otherwise create that folder first.
  2. Create the doc in that folder with the Drive create-file tool: pass the
     Markdown as text content, set the content mime type to `text/markdown` (or
     `text/plain`), title it the same dated name, and set the parent to the folder
     id.
  3. Report the resulting Drive link.
- If no Google Drive MCP is connected, do not fail. Keep the local `docs/` file,
  then tell the user the Drive upload was skipped because no Drive connector is
  available and how to connect one.

## Phase 2 — Gap analysis

Produce a concise matrix: capability -> studio-grade standard -> what Avatar
Studio does today -> the gap -> the fix. Group by the three disciplines. This is
the contract for Phase 3, so be specific and grounded in the research.

## Phase 3 — Full implementation (the deliverable)

Update the skill and the MCP server so Avatar Studio performs at studio grade.
Match the existing code style exactly: ESM `.mjs`, `zod` input schemas, the
existing error-wrapping handler, small client modules, no secrets in code.
Implement at least the following, adjusting based on your research:

Voice (ElevenLabs client + `synthesize_speech` / `clone_voice`):
- Expose voice settings (stability, similarity boost, style, speed, speaker boost)
  with sensible studio defaults.
- Add output format / sample rate control; default to a high-quality master format.
- Add a professional voice clone path (or clearly document why instant is the
  ceiling), plus pronunciation / SSML support if the API allows.

Audio (new FFmpeg-based tool, e.g. `master_audio`):
- Loudness-normalize to a target (LUFS) chosen per delivery target, with two-pass
  EBU R128, true-peak limiting, a dialogue-intelligibility chain (highpass,
  denoise, de-ess, gentle compression), and optional music-bed ducking.

Video (`lipsync`, `generate_talking_head`, plus optional new tools):
- Add resolution / fps / quality controls and a cost-estimate gate before long
  renders. Add an optional face-restoration / upscale step. Add quality presets
  (`draft` vs `final` / `studio`). Add caption burn-in and background / aspect
  handling where the providers support it.

Assembly (`assemble_video`):
- Normalize audio loudness across joined clips, support caption burn-in, optional
  crossfades, and a master vs delivery export distinction (codec / bitrate).

Cross-cutting:
- Add a `studio` quality preset that wires the best-of choices together end to end.
- Keep the cheap `draft` path intact for iteration.

Then rewrite `.claude/skills/avatar-studio/SKILL.md` and the server `README.md` so
they document the new tools, parameters, presets, delivery specs, the capture
spec, and the studio workflow. Keep the repo's writing style: plain prose, short
sentences, no em dashes or semicolons.

## Phase 4 — Verify

- `cd mcp-servers/avatar-studio && npm install && node --check src/index.mjs` and
  `node --check` every client file you touch.
- Start the server and confirm it registers all tools without error.
- Run the existing smoke test (one 10-second 9:16 talking-head clip end to end)
  using `FAL_KEY` and `ELEVENLABS_API_KEY`, then run the new audio mastering and a
  `studio`-preset render. If keys are missing, say so explicitly and stop short of
  the live calls rather than claiming success.

## Phase 5 — Report

Summarize: the new tool surface, before / after per discipline, the delivery-spec
and loudness targets you adopted, the cost / quality presets, any new keys or
dependencies, and the full source list from Phase 1. Commit on the working branch
with clear messages. Do not open a pull request unless asked.

## Guardrails

- Verify every API parameter and model slug against current official docs. Do not
  invent fields. Where a capability does not exist, say so rather than faking it.
- Keep secrets out of code and out of git. Use env vars and `.env.example`.
- Prefer real, working changes over scaffolding. No half-finished tools.
- If a decision is genuinely ambiguous (for example which loudness target is the
  primary default), pick the most common studio default, state it, and make it a
  parameter.
