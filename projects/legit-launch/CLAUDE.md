# Project: Legit Launch

## Overview
Legit is a digital product or course launching under Aspect Media Holdings, LLC.
(One-line description of what Legit is and what it delivers: TBD, Nathan to
confirm the name and the offer.) Success means revenue and sales. The launch is
targeted for this month. The avatar / personal-avatar video pipeline is the
content engine that produces the launch's video creatives.

## Key contacts
- Owner: Nathan Spells (Aspect Media Holdings, LLC)
- Client: internal (Aspect Media Holdings)

## Current status
Avatar video capability is built and merged to master: the avatar-studio skill
and MCP server (originally PR #65), plus the studio-grade upgrade tooling and
MemPalace fixes (PR #66). Launch type, timeline, channels, and success metric are
set. The specific product name, offer, price, and audience are still to confirm.

## Important context
- Type: digital product or course. Primary success metric: revenue and sales.
- Timeline: launching this month, so the schedule is tight.
- Distribution: short-form (TikTok, Reels, Shorts), long-form (YouTube), paid
  ads, and an embedded video on the website or landing page. The avatar pipeline
  must produce both 9:16 and 16:9 cuts from the same script.
- Avatar video pipeline lives in the `avatar-studio` skill
  (`.claude/skills/avatar-studio/`) and its MCP server
  (`mcp-servers/avatar-studio/`): fal.ai lipsync drafts, HeyGen finals,
  ElevenLabs voice, FFmpeg assembly.
- Run `/avatar-studio-pro` to take that pipeline to studio grade before producing
  the launch creatives.
- Session memory: `docs/memory/2026-05-26-avatar-studio.md` and
  `docs/memory/2026-05-26-session-mempalace-avatar.md`.
- TBD: exact offer, price point, target audience, and positioning.

## File locations
- Avatar skill: .claude/skills/avatar-studio/
- Avatar MCP server: mcp-servers/avatar-studio/
- Output: output/legit-launch/

## Constraints
- Tight timeline (this month). Favor fast iteration on fal.ai drafts and reserve
  HeyGen finals for the hero assets.
- TBD: budget cap and any channel or compliance restrictions.

## Preferred output format
Plain prose, active voice, short sentences (the workspace default). Use Smart
Brevity for launch copy where it helps.
