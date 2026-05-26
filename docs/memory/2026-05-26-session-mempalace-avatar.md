---
date: 2026-05-26
session: avatar-video-generation-mcps
branch: claude/avatar-video-generation-mcps-JEADQ
tags: [avatar, video, mcp, mempalace, graphify, memory, legit-launch, aspect-media]
purpose: full session handoff for local Claude ingestion
---

# Session handoff: Avatar Studio + MemPalace (2026-05-26)

This file captures the full substance of the cloud Claude Code session so a local
Claude CLI session can pick up exactly where it left off. It was written in an
ephemeral cloud container, so git is the only bridge to the local machine.

## How to ingest this locally

Pick whichever fits your setup:

1. As context: keep this file in the repo. Claude Code reads `docs/memory/` and
   `CLAUDE.md` on session start, so a local session can read it directly. You can
   also `@`-mention or paste it.
2. Into MemPalace: once MemPalace is running locally (see install below), open a
   local Claude Code session and ask Claude to store the sections of this file as
   memories using the MemPalace MCP tools. Suggested palace layout: a Wing for
   "Aspect Media", a Room for "Legit Launch", Halls for "Avatar Studio",
   "MemPalace setup", and "Open questions".
3. Into graphify: graphify is the local graph layer beside MemPalace. It is not
   reachable from a cloud session. Run the graph build locally after ingesting,
   using the entities and relations listed at the bottom of this file.

## What was built this session

### Avatar Studio (avatar video generation)

- Skill: `.claude/skills/avatar-studio/SKILL.md`. Two tracks (photoreal,
  stylized), short and long-form workflows, source-photo checklist, wiring into
  the fal-ai-media, video-editing, generate-image, remotion-video-creation, and
  manim-video skills.
- MCP server: `mcp-servers/avatar-studio/` (ESM, no build step,
  `@modelcontextprotocol/sdk` 1.29.0, Zod, stdio). Six tools: `list_voices`,
  `synthesize_speech`, `clone_voice` (ElevenLabs), `lipsync` (fal.ai, default
  `veed/fabric-1.0`), `generate_talking_head` (HeyGen), `assemble_video`
  (FFmpeg).
- Status: in review on PR #65. Verified deps install clean, files pass
  `node --check`, and a live MCP handshake registers all six tools. No paid
  render ran end to end because no API keys are set in the cloud environment.
- Keys needed in the server's `~/.claude.json` block: `FAL_KEY` (required),
  `ELEVENLABS_API_KEY` (recommended), `HEYGEN_API_KEY` (optional for finals).
- Decisions: open plus commercial mix (fal.ai for drafts, HeyGen for finals).
  Stylized track (Ready Player Me, VSeeFace, Blender, Live2D) stays a manual step
  feeding `assemble_video`, not shipped as stub tools. Photoreal look is beard
  plus a warm smile, grounded in facial-trust research (Todorov, Stereotype
  Content Model, Dixson and Brooks 2013).
- Detailed note: `docs/memory/2026-05-26-avatar-studio.md`.

### Legit Launch project

- Created `projects/legit-launch/CLAUDE.md` this session.
- The avatar video pipeline feeds this launch. It is the content engine for it.
- Scope, offer, timeline, and channels are marked TBD. Nathan to confirm what
  "Legit" is launching.

## MemPalace: verified facts (web-checked 2026-05-26)

MemPalace is real, open source, MIT licensed (GitHub `MemPalace/mempalace`).
Local-first AI memory with verbatim storage plus vector embeddings, backed by
ChromaDB and SQLite with local Sentence Transformers. No API calls. Benchmarked
96.6% R@5 on LongMemEval. Exposes roughly 19 to 29 MCP tools depending on
version. Data lives under `%USERPROFILE%\.mempalace\` (write-ahead log at
`~/.mempalace/wal/write_log.jsonl`).

Install (any one):
```
uv tool install mempalace
pipx install mempalace
pip install mempalace
```
Needs Python 3.9+. First run downloads an ~80 MB embeddings model.

Register with Claude Code (stdio, preferred):
```
claude mcp add mempalace -- python -m mempalace.mcp_server
```
The MCP entry point is the module `mempalace.mcp_server`. The old skill note that
said `python -m mempalace` was wrong and has been corrected this session.

Remote / hosted endpoint: MemPalace ships an SSE transport (`--transport sse`),
so it can be a networked endpoint, not just a local stdio process. Run it in SSE
mode on an always-on machine, expose it over a private tunnel (Tailscale, not a
public ngrok URL), require an auth token, then register with
`claude mcp add --transport sse <name> <url>`. The endpoint exposes the entire
memory store, so treat it as sensitive.

Canonical source is the GitHub repo and `mempalaceofficial.com` docs. Several
lookalike domains exist (`.net`, `.tech`, `.in`); trust the repo first.

## Hosted memory MCP: the concept

Local MemPalace runs per machine over stdio with its own database, so two
machines hold two unsynced memories and a cloud session reaches neither. A hosted
memory MCP flips this: one always-on service exposes a remote MCP endpoint (HTTPS
URL plus auth token) and every client dials the same store. Two ways to get
there: self-host MemPalace in SSE mode behind a tunnel (you keep your data, you
run the ops), or use a managed product with a remote MCP endpoint (Mem0, Zep or
Graphiti, Letta or MemGPT, Supermemory, Pieces). Trade-off: hosted gives
cross-device sync and cloud reachability at the cost of an always-on server or a
SaaS bill plus a security surface; local stdio is free, offline, and private but
has no sync and is invisible to cloud sessions.

## Key constraint to remember

Cloud Claude Code sessions cannot reach a local, offline MemPalace or graphify on
the home desktop. The git repo is the bridge. To share memory live between cloud
and local, MemPalace must run as a reachable SSE endpoint (see above). Obsidian
is explicitly out of scope per Nathan's instruction; target MemPalace and
graphify only.

## Open questions and next steps

1. Define the Legit Launch scope and fill the TBD fields in
   `projects/legit-launch/CLAUDE.md`.
2. Merge PR #65 (avatar-studio).
3. Set `FAL_KEY`, then `ELEVENLABS_API_KEY`, in the avatar-studio server config.
   Run `npm install` in `mcp-servers/avatar-studio/`. Run a ten-second 9:16
   talking-head smoke test.
4. Decide MemPalace topology: local-only plus git bridge, or self-hosted SSE
   endpoint for cloud sync. If SSE, stand it up behind Tailscale with auth.
5. After ingesting this file locally, run the graphify build with the entities
   and relations below.

## Graph entities and relations (for graphify)

Entities: Nathan Spells, Aspect Media Holdings, Legit Launch, Avatar Studio,
Avatar Studio MCP Server, fal.ai, ElevenLabs, HeyGen, FFmpeg, Ready Player Me,
MemPalace, graphify, MCP, ChromaDB, SQLite, Tailscale, PR 65.

Relations:
- Avatar Studio -> feeds -> Legit Launch
- Avatar Studio MCP Server -> uses -> fal.ai, ElevenLabs, HeyGen, FFmpeg
- Legit Launch -> owned by -> Nathan Spells
- Nathan Spells -> works at -> Aspect Media Holdings
- MemPalace -> stores in -> ChromaDB, SQLite
- MemPalace -> can expose -> SSE endpoint (via Tailscale)
- graphify -> graphs -> MemPalace memories
- PR 65 -> ships -> Avatar Studio, Avatar Studio MCP Server
