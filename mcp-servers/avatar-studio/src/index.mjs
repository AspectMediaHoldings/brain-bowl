#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { downloadTo } from "./util.mjs";
import { runFalModel, extractVideoUrl } from "./clients/fal.mjs";
import { synthesizeSpeech, listVoices, cloneVoice } from "./clients/elevenlabs.mjs";
import { generateAvatarVideo } from "./clients/heygen.mjs";
import { assembleVideo } from "./clients/ffmpeg.mjs";

const ok = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const fail = (err) => ({
  content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
  isError: true,
});

// Wrap a handler so thrown errors come back as structured tool errors, not crashes.
const handler = (fn) => async (args) => {
  try {
    return await fn(args);
  } catch (err) {
    return fail(err);
  }
};

const server = new McpServer({ name: "avatar-studio", version: "0.1.0" });

server.registerTool(
  "list_voices",
  {
    title: "List ElevenLabs voices",
    description: "List the voices in your ElevenLabs account so you can pick a voice_id. Needs ELEVENLABS_API_KEY. Read-only.",
    inputSchema: {},
  },
  handler(async () => ok({ voices: await listVoices() }))
);

server.registerTool(
  "synthesize_speech",
  {
    title: "Generate speech (ElevenLabs)",
    description:
      "Turn a script into an MP3 in a chosen voice. Use this to produce the lipsync source audio. Needs ELEVENLABS_API_KEY.",
    inputSchema: {
      text: z.string().describe("The script to speak."),
      voice_id: z.string().describe("ElevenLabs voice id (see list_voices or clone_voice)."),
      model_id: z.string().optional().describe("ElevenLabs model id. Default eleven_turbo_v2_5."),
      output_path: z.string().describe("Absolute path to write the .mp3 to."),
    },
  },
  handler(async ({ text, voice_id, model_id, output_path }) => {
    const path = await synthesizeSpeech({ text, voiceId: voice_id, modelId: model_id, outPath: output_path });
    return ok({ audio_path: path });
  })
);

server.registerTool(
  "clone_voice",
  {
    title: "Clone a voice (ElevenLabs)",
    description:
      "Create a cloned voice from one or more local audio samples. Returns a voice_id to reuse in synthesize_speech. Needs ELEVENLABS_API_KEY.",
    inputSchema: {
      name: z.string().describe("A label for the cloned voice."),
      sample_paths: z.array(z.string()).min(1).describe("Absolute paths to clean audio samples of the target voice."),
      description: z.string().optional().describe("Optional description of the voice."),
    },
  },
  handler(async ({ name, sample_paths, description }) => {
    const voiceId = await cloneVoice({ name, samplePaths: sample_paths, description });
    return ok({ voice_id: voiceId });
  })
);

server.registerTool(
  "lipsync",
  {
    title: "Lipsync via fal.ai (open / draft track)",
    description:
      "Drive a portrait or video with audio using a fal.ai model. Default veed/fabric-1.0 (image + audio). Use fal-ai/musetalk or veed/lipsync for video + audio. Cheap, good for iteration. Needs FAL_KEY. Cost scales with clip length; keep drafts short.",
    inputSchema: {
      audio_url: z.string().describe("Public URL of the source audio (upload first if local)."),
      image_url: z.string().optional().describe("Portrait image URL (for image+audio models like veed/fabric-1.0)."),
      video_url: z.string().optional().describe("Source video URL (for video+audio models like fal-ai/musetalk)."),
      model: z.string().optional().describe("fal model slug. Default veed/fabric-1.0."),
      output_path: z.string().describe("Absolute path to write the result .mp4 to."),
    },
  },
  handler(async ({ audio_url, image_url, video_url, model = "veed/fabric-1.0", output_path }) => {
    if (!image_url && !video_url) {
      throw new Error("Provide image_url (for image+audio models) or video_url (for video+audio models).");
    }
    const input = { audio_url };
    if (image_url) input.image_url = image_url;
    if (video_url) input.video_url = video_url;
    const result = await runFalModel(model, input);
    const url = extractVideoUrl(result);
    if (!url) throw new Error(`No video URL in fal result: ${JSON.stringify(result).slice(0, 400)}`);
    const path = await downloadTo(url, output_path);
    return ok({ video_path: path, source_url: url, model });
  })
);

server.registerTool(
  "generate_talking_head",
  {
    title: "Talking-head via HeyGen (final / polished track)",
    description:
      "Render a polished talking-head from a HeyGen avatar speaking text. Use for final renders, not cheap iteration. Needs HEYGEN_API_KEY (the hosted HeyGen MCP uses OAuth instead). Draws on your HeyGen plan credits.",
    inputSchema: {
      avatar_id: z.string().describe("HeyGen avatar id."),
      voice_id: z.string().describe("HeyGen voice id."),
      input_text: z.string().describe("The script the avatar will speak."),
      width: z.number().optional().describe("Output width. Default 1280 (16:9). Use 720 for 9:16."),
      height: z.number().optional().describe("Output height. Default 720 (16:9). Use 1280 for 9:16."),
      output_path: z.string().describe("Absolute path to write the result .mp4 to."),
    },
  },
  handler(async ({ avatar_id, voice_id, input_text, width, height, output_path }) => {
    const { videoId, videoUrl } = await generateAvatarVideo({
      avatarId: avatar_id,
      voiceId: voice_id,
      inputText: input_text,
      width,
      height,
    });
    const path = await downloadTo(videoUrl, output_path);
    return ok({ video_path: path, video_id: videoId, source_url: videoUrl });
  })
);

server.registerTool(
  "assemble_video",
  {
    title: "Assemble clips (FFmpeg)",
    description:
      "Concatenate avatar segments and b-roll into one file. Default stream-copy assumes clips share codec/resolution/fps. Set reencode true with width/height to normalize mixed inputs (each clip must have an audio track). Requires ffmpeg on PATH. For advanced editing use the video-editing skill.",
    inputSchema: {
      clips: z.array(z.string()).min(1).describe("Absolute paths to input clips, in order."),
      output_path: z.string().describe("Absolute path to write the final .mp4 to."),
      reencode: z.boolean().optional().describe("Re-encode and normalize mixed inputs. Default false."),
      width: z.number().optional().describe("Target width when reencode is true."),
      height: z.number().optional().describe("Target height when reencode is true."),
      fps: z.number().optional().describe("Target fps when reencode is true. Default 30."),
    },
  },
  handler(async ({ clips, output_path, reencode, width, height, fps }) => {
    const path = await assembleVideo({ clips, outPath: output_path, reencode, width, height, fps });
    return ok({ video_path: path });
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
