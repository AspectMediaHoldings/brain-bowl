# Project: Legit Launch

## Overview
Legit is a digital education course that teaches print-on-demand (POD) sellers
how to set up a real business and start selling. It uses Etsy and Printify (and
other online print providers) and walks students from registering their business
all the way through standing up both an Etsy shop and a Printify shop. The course
is nine sections and 62 lessons, with freebies, worksheets, and PDF resources
throughout. Success means revenue and sales. The launch is targeted for this
month. The avatar / personal-avatar video pipeline is the content engine that
produces the launch's video creatives.

## Key contacts
- Owner: Nathan Spells (Aspect Media Holdings, LLC)
- Client: internal (Aspect Media Holdings)

## Offer and pricing
- Early-bird price: $97 for people who join the wait list.
- Standard price: $147 for people who did not join the wait list.
- The wait list is the early-bird gate, so capturing wait-list signups before
  launch is part of the funnel.

## Audience
- POD sellers, mainly women aged 25 to 44.
- Beginners setting up their first shop, so the tone is encouraging and
  step-by-step.

## Course structure
- Nine sections, 62 lessons.
- Spans business registration through Etsy shop setup and Printify shop setup.
- Includes freebies, worksheets, and PDF resources as lead magnets and in-course
  aids.

## Current status
Avatar video capability is built and merged to master: the avatar-studio skill
and MCP server (originally PR #65), plus the studio-grade upgrade tooling and
MemPalace fixes (PR #66). Course content, offer, and audience are defined. Still
to confirm: the course-hosting platform, the exact launch date, and the budget.

## Important context
- Timeline: launching this month, so the schedule is tight.
- Distribution: short-form (TikTok, Reels, Shorts), long-form (YouTube), paid
  ads, and an embedded video on the website or landing page. The avatar pipeline
  must produce both 9:16 and 16:9 cuts from the same script.
- The wait-list landing page is the primary conversion surface for the early-bird
  price. Avatar videos should drive to it.
- Avatar video pipeline lives in the `avatar-studio` skill
  (`.claude/skills/avatar-studio/`) and its MCP server
  (`mcp-servers/avatar-studio/`): fal.ai lipsync drafts, HeyGen finals,
  ElevenLabs voice, FFmpeg assembly.
- Run `/avatar-studio-pro` to take that pipeline to studio grade before producing
  the launch creatives.
- Related Aspect Media skills that fit this launch: `email-sequence` and
  `launch-strategy` (wait-list and launch funnel), `signup-flow-cro` and
  `page-cro` (landing page), `paid-ads` and `social-content` (distribution).
- Session memory: `docs/memory/2026-05-26-avatar-studio.md` and
  `docs/memory/2026-05-26-session-mempalace-avatar.md`.

## File locations
- Avatar skill: .claude/skills/avatar-studio/
- Avatar MCP server: mcp-servers/avatar-studio/
- Output: output/legit-launch/

## Constraints
- Tight timeline (this month). Favor fast iteration on fal.ai drafts and reserve
  HeyGen finals for the hero assets.
- Marketing claims: avoid income guarantees or "get rich" promises. Frame
  outcomes as a process and skills, not promised earnings.
- TBD: budget cap, course-hosting platform, and exact launch date.

## Preferred output format
Plain prose, active voice, short sentences (the workspace default). Use Smart
Brevity for launch copy where it helps.
