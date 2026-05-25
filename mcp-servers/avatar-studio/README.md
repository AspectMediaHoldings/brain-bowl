# avatar-studio MCP server

A single MCP (Model Context Protocol) server that unifies the photoreal avatar
pipeline behind one set of tools: clone or synthesize a voice, lipsync a
portrait cheaply, render a polished talking-head, and stitch the result.

It pairs with the `avatar-studio` skill (`.claude/skills/avatar-studio/`). The
skill explains the workflow and when to use each track. This server makes the
API-backed steps callable as tools.

## Tools

| Tool | Backend | Needs | Use |
|---|---|---|---|
| `list_voices` | ElevenLabs | `ELEVENLABS_API_KEY` | Find a voice id. Read-only. |
| `synthesize_speech` | ElevenLabs | `ELEVENLABS_API_KEY` | Script to MP3 (the lipsync source audio). |
| `clone_voice` | ElevenLabs | `ELEVENLABS_API_KEY` | Make a cloned voice from audio samples. |
| `lipsync` | fal.ai | `FAL_KEY` | Open/draft track. Default `veed/fabric-1.0`. Cheap iteration. |
| `generate_talking_head` | HeyGen | `HEYGEN_API_KEY` | Final/polished track. Uses plan credits. |
| `assemble_video` | FFmpeg (local) | `ffmpeg` on PATH | Concatenate segments and b-roll. |

The routing is intentional: `lipsync` is the cheap open path for iteration,
`generate_talking_head` is the polished path for finals.

## Install

```bash
cd mcp-servers/avatar-studio
npm install
npm run check   # syntax check
```

## Configure in Claude

Add to `~/.claude.json` (same place the fal.ai MCP goes). Point the command at
this file and supply the keys you have. Tools whose key is missing simply error
when called, so you can start with one provider.

```json
"avatar-studio": {
  "command": "node",
  "args": ["/home/user/claude-workspace/mcp-servers/avatar-studio/src/index.mjs"],
  "env": {
    "FAL_KEY": "YOUR_FAL_KEY",
    "ELEVENLABS_API_KEY": "YOUR_ELEVENLABS_KEY",
    "HEYGEN_API_KEY": "YOUR_HEYGEN_KEY"
  }
}
```

Restart Claude so it picks up the new server.

## Recommended flow

1. `clone_voice` once from a few minutes of your clean audio. Save the `voice_id`.
2. `synthesize_speech` to turn a script into MP3 in that voice.
3. Upload the audio (and a portrait) somewhere public, or use the fal MCP
   `upload` tool, then call `lipsync` for a cheap draft (`veed/fabric-1.0` for
   image+audio, `fal-ai/musetalk` for video+audio).
4. For the final, call `generate_talking_head` (HeyGen) with your avatar and
   voice ids.
5. `assemble_video` to join talking-head segments with b-roll.

## Notes

- **Stylized character track stays manual.** Ready Player Me, VSeeFace, Blender,
  and Live2D are desktop apps with no clean API, so they are not server tools.
  Capture that character as footage and feed it into `assemble_video`. See the
  `avatar-studio` skill for the steps.
- **HeyGen auth.** This server uses the HeyGen REST API with `HEYGEN_API_KEY` so
  it can run unattended. HeyGen also offers a hosted remote MCP that
  authenticates via OAuth and needs no key. Use whichever fits.
- **Cost.** fal lipsync bills per second of output. HeyGen draws plan credits.
  ElevenLabs draws its own quota. Iterate on short drafts before final renders.
- **fal result shapes vary** by model. `lipsync` extracts the first video URL it
  finds. If a new model returns an unusual shape, the error includes the raw
  result so you can adjust.
