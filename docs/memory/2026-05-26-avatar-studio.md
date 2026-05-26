---
date: 2026-05-26
session: avatar-video-generation-mcps
tags: [avatar, video, mcp, marketing, aspect-media, reels]
status: in-review
pr: 65
branch: claude/avatar-video-generation-mcps-JEADQ
---

# Avatar Studio session memory (2026-05-26)

Portable session note for the [[Memory Palace]]. Obsidian `[[wikilinks]]` are
included so it joins the graph on sync.

## Summary

Built a way for Nathan to make a personal [[Avatar]] and use it for short-form
and long-form [[Video]]. Closed the avatar gap: the workspace already had video
generation, but nothing produced a talking-head or character of the user.

## What was built

- **[[Avatar Studio Skill]]** at `.claude/skills/avatar-studio/SKILL.md`.
  Documents two tracks (photoreal, stylized), the short and long-form workflows,
  a source-photo checklist, and wiring into [[fal-ai-media]], [[video-editing]],
  [[generate-image]], [[remotion-video-creation]], and [[manim-video]].
- **[[Avatar Studio MCP Server]]** at `mcp-servers/avatar-studio/` (ESM, no
  build step, `@modelcontextprotocol/sdk` 1.29.0, Zod, stdio). Six tools:
  `list_voices`, `synthesize_speech`, `clone_voice` ([[ElevenLabs]]),
  `lipsync` ([[fal.ai]], default `veed/fabric-1.0`),
  `generate_talking_head` ([[HeyGen]]), `assemble_video` ([[FFmpeg]]).
  Verified: deps install clean, all files pass `node --check`, live MCP
  handshake registers all six tools.

## Decisions

- **Open plus commercial mix.** [[fal.ai]] for cheap drafts, [[HeyGen]] for
  polished finals. One `FAL_KEY` covers the most ground.
- **Stylized track stays manual.** [[Ready Player Me]], [[VSeeFace]], [[Blender]],
  [[Live2D]] have no clean API, so they are documented as a manual step feeding
  `assemble_video`, not shipped as stub tools.
- **Photoreal look:** beard plus a warm smile. Research basis: [[Todorov]] rapid
  facial-trust judgments, [[Stereotype Content Model]] (warmth plus competence,
  [[Fiske]]), [[Dixson and Brooks 2013]] on beards raising perceived competence
  and age. Age is an asset for trust, not a liability. Gray beard fits a coffee
  brand.
- **Source photo:** front-facing, even light, plain background, relaxed
  closed-mouth expression so lipsync does not distort. Consistent facial hair
  for brand recognition.

## Connectors and keys

- [[fal.ai]] `FAL_KEY` (required, the engine, pay per second).
- [[ElevenLabs]] `ELEVENLABS_API_KEY` (recommended, voice clone, ~$5/mo Starter).
- [[HeyGen]] `HEYGEN_API_KEY` or hosted OAuth MCP (optional, finals).
- [[Ready Player Me]] (optional, free, manual).
- [[FFmpeg]] (local, free, for `assemble_video`).
- [[OpenRouter]] `OPENROUTER_API_KEY` (optional, source portraits).

None are set in the cloud build environment, so no paid render ran end to end.

## Artifacts

- Pull request [[PR 65]] against `master` (no CI configured, nothing blocks merge).
- Google Drive folder "AI Avatar": two RTF docs are the source of truth
  (connector requirements, how-to guide with source-photo checklist). Older
  Google Doc versions and one superseded RTF need manual deletion (the Drive
  connector has no delete or rename tool).

## Next steps

1. Merge [[PR 65]].
2. Add `FAL_KEY`, then `ELEVENLABS_API_KEY`, to the `avatar-studio` block in
   `~/.claude.json`. Run `npm install` in `mcp-servers/avatar-studio/`.
3. Capture a clean source photo per the checklist. Clone the voice.
4. Run the smoke test: one ten-second 9:16 talking-head clip end to end.
5. Add [[HeyGen]] for finals once an avatar is trained there.
6. Clean up the superseded Drive files.

## Project link

This work feeds the [[Legit Launch]] project (`projects/legit-launch/CLAUDE.md`).
The avatar video pipeline produces the talking-head and short-form content for
that launch.

## Graph links

[[Legit Launch]] | [[Aspect Media Holdings]] | [[Dogs and Coffee]] | [[Reels]]
| [[Short-form Video]] | [[Long-form Video]] | [[Voice Cloning]] | [[Lipsync]]
| [[MCP Server]] | [[Model Context Protocol]]
