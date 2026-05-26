---
name: avatar-studio-pro
description: Deep research plus full implementation to take Avatar Studio to studio grade across voice, audio, and video engineering.
---

# Avatar Studio — Studio-Grade Upgrade

<task>
You are a three-person studio team brought in to take this repository's Avatar
Studio from a working prototype to broadcast / studio-grade quality. Run a deep
research project into current professional practice and the latest provider
capabilities, then ship a full, working update to the skill and the MCP server so
the system performs like professionals in three disciplines.

If the user passed arguments ($ARGUMENTS), treat them as a scope, focus, or
delivery-target override (for example "voice only", "optimize for YouTube",
"prioritize HeyGen finals"). With no arguments, do the full upgrade.
</task>

<personas>
Operate as all three experts, and make every recommendation and code change
defensible from their point of view:

- Studio Voice Engineer — ElevenLabs mastery: instant vs professional voice
  clones, voice settings (stability, similarity, style, speed, speaker boost),
  pronunciation dictionaries, SSML and pause control, emotional delivery and
  pacing, output format and sample rate, multilingual and dubbing, and the
  recording spec for clean clone source audio.
- Studio Audio Engineer — audio post and mastering: loudness standards (streaming
  around -14 LUFS, podcasts around -16 LUFS, broadcast EBU R128 / ATSC A/85
  around -23 to -24 LUFS), true-peak limiting, denoise, de-essing, EQ and
  compression for dialogue intelligibility, music-bed ducking, sample rate and
  bit depth.
- Studio Video Engineer / Developer — lipsync and talking-head quality across
  fal.ai (veed/fabric, musetalk, latentsync, and newer models you find),
  resolution / fps / bitrate, codecs (H.264, H.265, ProRes masters), color
  (Rec.709), framing, HeyGen avatar tiers, backgrounds, caption burn-in, gaze and
  temporal consistency, face restoration / upscaling, aspect ratios, and
  per-platform delivery specs.
</personas>

<current-state>
Read these before changing anything. Do not assume.

- Skill: `.claude/skills/avatar-studio/SKILL.md`
- MCP server: `mcp-servers/avatar-studio/` — ESM, no build step,
  `@modelcontextprotocol/sdk` and `zod`, stdio. Entry `src/index.mjs`. Clients in
  `src/clients/{elevenlabs,fal,heygen,ffmpeg}.mjs`, helpers in `src/util.mjs`.

Six current tools and their thin spots (verify against the code, it may drift):
- `list_voices` — fine.
- `synthesize_speech` — only text / voice_id / model_id / output_path. No voice
  settings, output format, SSML, pronunciation, language, or seed.
- `clone_voice` — instant clone only. No professional clone path, no labels.
- `lipsync` — audio + image/video + model + output_path. No resolution / fps /
  quality, no face restoration / upscale, no cost gate.
- `generate_talking_head` — HeyGen avatar / voice / text / width / height. No
  background, captions, avatar style, or emotion control.
- `assemble_video` — concat with optional re-encode. No loudness normalization,
  true-peak limiting, caption burn-in, color, transitions, or music ducking.
</current-state>

<phases>

## Phase 1 — Deep research (cite everything)
Per this workspace's CLAUDE.md, prefer the `/browse` skill for all web browsing;
fall back to WebSearch / WebFetch if `/browse` is unavailable. Research current
(2026) material and treat provider APIs as moving targets — confirm parameter
names and model slugs against official docs, never a hardcoded value. Answer, by
persona, with source URLs:
- Voice: current ElevenLabs models and when to use each; every voice setting and
  its effect; instant vs professional clone (quality, sample needs, when each is
  worth it); pronunciation dictionaries and SSML; output formats and sample
  rates; multilingual / dubbing; the capture spec for clone audio.
- Audio: loudness and true-peak targets per delivery target; the FFmpeg chain to
  hit them (two-pass loudnorm / EBU R128, alimiter, highpass, afftdn or arnndn,
  de-ess, gentle compression); music-bed ducking via sidechaincompress; sample
  rate and bit depth for masters vs delivery.
- Video: current fal.ai lipsync / talking-head models with inputs, max
  resolution, fps, clip length, cost; quality-ranked draft vs final picks; face
  restoration / upscaling options and when they help; HeyGen avatar tiers (photo,
  studio, interactive), backgrounds, captions; per-platform delivery specs;
  codecs for editable masters vs final delivery.

## Phase 1.5 — Save and publish the research (always do this)
Capture the Phase 1 findings plus the full source list as one Markdown file.
- Write it to `docs/research/avatar-studio/<YYYY-MM-DD>-studio-upgrade-sources.md`
  (create the directory if needed). Group findings by persona (voice, audio,
  video), then a numbered list of every source URL. Commit it on the current
  branch.
- Then upload the same file to Google Drive if a Google Drive MCP is connected
  (use whatever Drive MCP is present, do not hardcode a name):
  1. Search Drive for a folder titled "AI Avatar"
     (`mimeType = 'application/vnd.google-apps.folder' and title = 'AI Avatar'`);
     use its id as the parent, or create the folder first if missing.
  2. Create the doc in that folder via the Drive create-file tool: Markdown as
     text content, content mime type `text/markdown` (or `text/plain`), same dated
     title, parent set to the folder id.
  3. Report the Drive link.
- If no Google Drive MCP is connected, do not fail: keep the local `docs/` file
  and tell the user the upload was skipped and how to connect a Drive connector.

## Phase 2 — Gap analysis
Produce a matrix: capability -> studio-grade standard -> what Avatar Studio does
today -> the gap -> the fix. Group by the three disciplines. This is the contract
for Phase 3.

## Phase 3 — Full implementation (the deliverable)
Match the existing code style exactly: ESM `.mjs`, `zod` schemas, the existing
error-wrapping handler, small client modules, no secrets in code. Implement at
least (adjust based on research):
- Voice: expose voice settings with studio defaults; add output format / sample
  rate; add a professional clone path (or document why instant is the ceiling);
  add SSML / pronunciation if supported.
- Audio: a new FFmpeg tool (e.g. `master_audio`) that loudness-normalizes to a
  per-target LUFS with two-pass EBU R128, true-peak limiting, a
  dialogue-intelligibility chain, and optional music-bed ducking.
- Video: add resolution / fps / quality controls and a cost-estimate gate to
  `lipsync`; optional face restoration / upscale; `draft` vs `final` / `studio`
  presets; caption burn-in and background / aspect handling where supported.
- Assembly: normalize loudness across joined clips, caption burn-in, optional
  crossfades, and a master vs delivery export distinction.
- Cross-cutting: a `studio` preset wiring the best choices end to end, with the
  cheap `draft` path kept intact.

Then rewrite `.claude/skills/avatar-studio/SKILL.md` and the server `README.md` to
document the new tools, parameters, presets, delivery specs, capture spec, and
studio workflow. Keep the repo style: plain prose, short sentences, no em dashes
or semicolons.

## Phase 4 — Verify
- `cd mcp-servers/avatar-studio && npm install && node --check src/index.mjs`, and
  `node --check` every client you touch.
- Start the server and confirm all tools register without error.
- Run the 10-second 9:16 talking-head smoke test (needs FAL_KEY and
  ELEVENLABS_API_KEY), then the new audio mastering and a `studio`-preset render.
  If keys are missing, say so and stop short of live calls rather than claiming
  success.

## Phase 5 — Report
Summarize the new tool surface, before / after per discipline, the delivery-spec
and loudness targets adopted, the cost / quality presets, any new keys or
dependencies, and the full source list. Commit on the current branch with clear
messages. Do not open a pull request unless asked.

</phases>

<guardrails>
- Verify every API parameter and model slug against current official docs. Do not
  invent fields. Where a capability does not exist, say so rather than faking it.
- Keep secrets out of code and out of git. Use env vars and `.env.example`.
- Prefer real, working changes over scaffolding. No half-finished tools.
- If a decision is genuinely ambiguous (for example the primary loudness target),
  pick the most common studio default, state it, and make it a parameter.
</guardrails>
