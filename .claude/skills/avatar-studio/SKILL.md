---
name: avatar-studio
description: Create a digital avatar of yourself (photoreal talking-head or stylized character) and turn it into short-form and long-form video. Covers fal.ai lipsync models (VEED, MuseTalk, LatentSync), HeyGen for polished renders, ElevenLabs voice cloning, and Ready Player Me / VRM characters. Wires into fal-ai-media, video-editing, generate-image, remotion-video-creation, and manim-video. Use when the user says "make an avatar", "talking-head video", "lipsync", "clone my voice", "VTuber", or "put my face in a video".
---

# Avatar Studio

Build an avatar that represents the user, then drive it into video. Two tracks:
photoreal talking-head of the user's real face and voice, and a stylized 3D or
2D character. Both feed the existing video pipeline in this workspace.

## When to Activate

- User wants a talking-head avatar of themselves
- User wants to clone their voice and have an avatar speak a script
- User wants a stylized character or VTuber persona
- User wants to lipsync an existing portrait or character to audio
- User says "make an avatar", "talking-head", "lipsync", "clone my voice", "VTuber", "digital twin"

## Decide the Track First

Ask which track the task needs before generating anything.

- **Photoreal** (Track A): the user's real face and voice, speaking scripts. Best for narration, ads, explainers with a personal presence.
- **Stylized** (Track B): a 3D or 2D persona. Best for a consistent character that does not need to be the user's literal face.

A project can use both. Photoreal for talking segments, stylized for branding.

## Prerequisites

### fal.ai MCP (open and draft track, highest leverage)

The fal.ai MCP server unlocks the open lipsync models plus all video generation.
Add it to `~/.claude.json` (same config the `fal-ai-media` skill uses):

```json
"fal-ai": {
  "command": "npx",
  "args": ["-y", "fal-ai-mcp-server"],
  "env": { "FAL_KEY": "YOUR_FAL_KEY_HERE" }
}
```

Get a key at fal.ai. The MCP exposes `search`, `find`, `generate`, `result`,
`status`, `estimate_cost`, and `upload`. Model slugs change, so discover current
ones with `search(query: "lipsync")` or `search(query: "avatar")` rather than
trusting a hardcoded name.

### HeyGen remote MCP (commercial, final renders)

HeyGen ships a hosted remote MCP. It uses OAuth, not an API key, and bills the
credits on the user's existing HeyGen plan. There is nothing to run locally.
Connect it as a remote MCP server and authenticate once in the browser. Any
avatars and voices in the user's HeyGen account become available as tools. Use
this for polished final renders, not cheap iteration.

### ElevenLabs (voice)

Voice cloning uses `ELEVENLABS_API_KEY`. The `video-editing` skill already
references this key. Clone the user's voice once, then reuse the voice id.

## Track A: Photoreal Talking-Head

Pipeline: source portrait or clip, plus voice audio, run through a lipsync model.

### Verified fal.ai lipsync models (confirmed mid-2026)

| Model slug | Input | Notes |
|---|---|---|
| `veed/fabric-1.0` | one image plus audio | Talking video for social. ~$0.08/s at 480p, ~$0.15/s at 720p. Clips up to 5 minutes. |
| `veed/lipsync` | video plus audio | Relips an existing video to new audio. |
| `fal-ai/musetalk` | video plus audio | Tencent real-time lipsync, 30+ fps on GPU, fast and cheap for drafts. |
| LatentSync (search `latentsync`) | video plus audio | Diffusion-based, high-resolution mouth motion. |

Confirm slugs at runtime with `search(query: "lipsync")` then `find(...)`.

### Generate a draft talking-head (fal MCP)

```
# 1. Make or pick a source portrait (use generate-image, or upload a real photo)
upload(file_path: "/path/to/your_portrait.png")

# 2. Generate or clone the voice audio (ElevenLabs clone, or fal CSM-1B draft)
upload(file_path: "/path/to/voice.mp3")

# 3. Lipsync them together
generate(
  app_id: "veed/fabric-1.0",
  input_data: {
    "image_url": "<uploaded_portrait_url>",
    "audio_url": "<uploaded_voice_url>"
  }
)
```

Always run `estimate_cost` before a long clip. Iterate cheaply on `fal-ai/musetalk`,
then render the final on `veed/fabric-1.0` or HeyGen.

### Final render (HeyGen MCP)

Once the script and voice are locked, call the HeyGen MCP tools to render with a
HeyGen avatar trained on the user. This is the polished, presentation-grade path.

## Track B: Stylized 3D or 2D Character

These steps are mostly desktop apps, so the skill guides the user through them
and then hands the rendered character into the video pipeline.

1. **Create the avatar.** Ready Player Me builds a 3D avatar from a selfie and
   exports VRM (a portable open 3D avatar format). Free tier. For a fully custom
   character, model and rig it in Blender (open-source).
2. **Drive it.** VSeeFace or VTube Studio animate the VRM from a webcam. They use
   MediaPipe-style face tracking (open-source) to map the user's expressions.
   Live2D is the 2D alternative.
3. **Voice.** Same as Track A. ElevenLabs clone or fal CSM-1B.
4. **Capture.** Record the driven character as footage, then treat it as b-roll
   or a presenter layer in the video pipeline below.

## Voice

- **ElevenLabs clone** (best): clone the user's voice once from a few minutes of
  clean audio, reuse the voice id for every script. Needs `ELEVENLABS_API_KEY`.
- **fal CSM-1B** (drafts): cheap text-to-speech while iterating. Run via the fal
  MCP. Swap in the ElevenLabs clone for finals.

The voice audio is the lipsync source for both tracks. Generate voice before the
avatar step.

## Workflow: Short-Form (9:16, TikTok, Reels, Shorts)

1. Script the hook and beats in Claude.
2. Generate voice. Draft with fal CSM-1B, final with the ElevenLabs clone.
3. Generate the talking-head. Iterate on `fal-ai/musetalk`, final on
   `veed/fabric-1.0` or HeyGen.
4. Assemble and caption with the `video-editing` skill or CapCut.
5. Export 1080x1920.

## Workflow: Long-Form (16:9, YouTube, Explainers)

1. Script and scene plan in Claude.
2. Render talking-head segments. HeyGen for polish.
3. Generate b-roll. Use `fal-ai-media` (Veo 3, Kling) for live action,
   `generate-image` for stills, and `manim-video` or `remotion-video-creation`
   for diagrams and overlays.
4. Stitch, add voiceover, and color-correct with `video-editing` (FFmpeg into
   Descript).
5. Export 1920x1080.

## Cost Notes

- fal lipsync is cheap per second. `veed/fabric-1.0` is about $0.08 to $0.15 per
  second depending on resolution. Always `estimate_cost` before long renders.
- HeyGen draws from the user's plan credits, not per-call billing.
- ElevenLabs draws from its own character or minute quota.
- Iterate on the cheapest path (MuseTalk plus fal CSM-1B), spend on finals only.

## Verification (smoke test)

Prove the pipeline before scaling: generate one 10-second 9:16 talking-head clip
end to end. Source portrait via `generate-image` or a real photo, voice via the
ElevenLabs clone, lipsync via `veed/fabric-1.0`, caption in `video-editing`.
Requires `FAL_KEY` and `ELEVENLABS_API_KEY` to be set.

## Related Skills

- `fal-ai-media` — the MCP and models this skill drives for lipsync, video, TTS
- `video-editing` — assemble, caption, color, and stitch the final cut
- `generate-image` — make source portraits and assets
- `remotion-video-creation` — programmatic overlays and captions
- `manim-video` — technical explainer b-roll
- `aspect-media-content-video` — short-form social and POD distribution
- `ai-video-platform-evaluation` — compare platforms on budget

## Unified Avatar Studio MCP Server

A built server lives at `mcp-servers/avatar-studio/`. It unifies the photoreal
pipeline behind one MCP, so you call clean tools instead of juggling providers.

Tools: `list_voices`, `synthesize_speech`, `clone_voice` (ElevenLabs),
`lipsync` (fal.ai open/draft track, default `veed/fabric-1.0`),
`generate_talking_head` (HeyGen final track), and `assemble_video` (FFmpeg).

Setup: `cd mcp-servers/avatar-studio && npm install`, then register it in
`~/.claude.json` with your keys. See that folder's `README.md` for the config
block and the recommended call sequence.

The stylized character track stays manual (Ready Player Me, VSeeFace, Blender,
Live2D have no clean API). Capture that character as footage and feed it into
`assemble_video`.
