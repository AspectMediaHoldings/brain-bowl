#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { downloadTo } from "./util.mjs";
import { runFalModel, uploadToFal, estimateFalCost, extractVideoUrl } from "./clients/fal.mjs";
import { synthesizeSpeech, listVoices, cloneVoice } from "./clients/elevenlabs.mjs";
import { generateAvatarVideo } from "./clients/heygen.mjs";
import { assembleVideo, masterAudio } from "./clients/ffmpeg.mjs";
import { restoreFace } from "./clients/codeformer.mjs";

const ok = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const fail = (err) => ({
  content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
  isError: true,
});
const handler = (fn) => async (args) => {
  try {
    return await fn(args);
  } catch (err) {
    return fail(err);
  }
};

// Quality preset routing helpers.
// draft  = fast + cheap (iteration)
// final  = balanced quality (most production use)
// studio = best available quality (finals, broadcasts)

const LIPSYNC_MODELS = {
  // image + audio → talking head
  image: {
    draft: { model: "veed/fabric-1.0", resolution: "480p" },
    final: { model: "veed/fabric-1.0", resolution: "720p" },
    studio: { model: "veed/fabric-1.0", resolution: "720p" }, // no open model beats veed at 720p for img+audio
  },
  // video + audio → relipsync
  video: {
    draft: { model: "fal-ai/musetalk", resolution: null },
    final: { model: "fal-ai/latentsync", resolution: null },
    studio: { model: "fal-ai/sync-lipsync/v2", resolution: null, syncModel: "lipsync-2-pro" },
  },
};

const EL_MODELS = {
  draft: "eleven_flash_v2_5",
  final: "eleven_v3",
  studio: "eleven_v3",
};

const server = new McpServer({ name: "avatar-studio", version: "0.2.0" });

// ─── VOICE ──────────────────────────────────────────────────────────────────

server.registerTool(
  "list_voices",
  {
    title: "List ElevenLabs voices",
    description:
      "List voices in your ElevenLabs account. Returns voice_id, name, category, labels. Needs ELEVENLABS_API_KEY. Read-only.",
    inputSchema: {},
  },
  handler(async () => ok({ voices: await listVoices() }))
);

server.registerTool(
  "synthesize_speech",
  {
    title: "Synthesize speech (ElevenLabs)",
    description:
      "Turn a script into audio using ElevenLabs. quality preset routes to the right model and format automatically. " +
      "Expose voice settings individually for fine control. Needs ELEVENLABS_API_KEY.",
    inputSchema: {
      text: z.string().describe("Script to speak."),
      voice_id: z.string().describe("ElevenLabs voice id (see list_voices or clone_voice)."),
      output_path: z.string().describe("Absolute path to write the audio file to."),
      // Quality preset (overrides model_id and output_format if set)
      quality: z
        .enum(["draft", "final", "studio"])
        .optional()
        .describe(
          "Preset: draft=eleven_flash_v2_5+mp3_44100_128 (fast, cheap). final/studio=eleven_v3+pcm_48000 (studio master). " +
            "Overrides model_id and output_format."
        ),
      model_id: z
        .string()
        .optional()
        .describe(
          "ElevenLabs model id. Default eleven_v3. Options: eleven_v3, eleven_multilingual_v2, eleven_flash_v2_5, eleven_flash_v2."
        ),
      output_format: z
        .string()
        .optional()
        .describe(
          "Audio format. Default mp3_44100_128. Studio master: pcm_48000 (write as .wav). " +
            "Options: mp3_44100_128, mp3_44100_192, pcm_44100, pcm_48000, wav_44100, wav_48000, opus_48000_192."
        ),
      // Voice settings
      stability: z
        .number()
        .min(0).max(1).optional()
        .describe("0=most expressive/variable, 1=most consistent. Studio default: 0.6."),
      similarity_boost: z
        .number()
        .min(0).max(1).optional()
        .describe("Adherence to original voice. Studio default: 0.85."),
      style: z
        .number()
        .min(0).max(1).optional()
        .describe("Style exaggeration. 0=neutral, 1=maximum character. Studio default: 0.1."),
      speed: z
        .number()
        .min(0.25).max(4.0).optional()
        .describe("Speech rate. 1.0=baseline. Slow for emphasis, increase for energy."),
      use_speaker_boost: z
        .boolean()
        .optional()
        .describe("Enhances voice similarity at slight latency cost. Default true."),
      // Text control
      language_code: z
        .string()
        .optional()
        .describe("ISO 639-1 language code (e.g. 'es', 'fr') to force language and prevent mid-sentence switching."),
      seed: z
        .number()
        .int().min(0).max(4294967295).optional()
        .describe("Integer seed for reproducible output. Same seed + same params = same take."),
      apply_text_normalization: z
        .enum(["auto", "on", "off"])
        .optional()
        .describe("Handle numbers, dates, abbreviations. Default auto."),
      previous_text: z
        .string()
        .optional()
        .describe("Text that precedes this segment. Improves prosody at sentence boundaries in multi-segment scripts."),
      next_text: z
        .string()
        .optional()
        .describe("Text that follows this segment. Same purpose as previous_text."),
      pronunciation_dictionary_locators: z
        .array(z.object({ pronunciation_dictionary_id: z.string(), version_id: z.string() }))
        .optional()
        .describe("Up to 3 pronunciation dictionary references for brand names and acronyms."),
    },
  },
  handler(async ({
    text, voice_id, output_path, quality,
    model_id, output_format,
    stability, similarity_boost, style, speed, use_speaker_boost,
    language_code, seed, apply_text_normalization,
    previous_text, next_text, pronunciation_dictionary_locators,
  }) => {
    let resolvedModel = model_id ?? "eleven_v3";
    let resolvedFormat = output_format ?? "mp3_44100_128";
    if (quality === "draft") {
      resolvedModel = model_id ?? EL_MODELS.draft;
      resolvedFormat = output_format ?? "mp3_44100_128";
    } else if (quality === "final" || quality === "studio") {
      resolvedModel = model_id ?? EL_MODELS.studio;
      resolvedFormat = output_format ?? "pcm_48000";
    }
    const path = await synthesizeSpeech({
      text,
      voiceId: voice_id,
      modelId: resolvedModel,
      outPath: output_path,
      outputFormat: resolvedFormat,
      stability,
      similarityBoost: similarity_boost,
      style,
      speed,
      useSpeakerBoost: use_speaker_boost,
      languageCode: language_code,
      seed,
      applyTextNormalization: apply_text_normalization,
      previousText: previous_text,
      nextText: next_text,
      pronunciationDictionaryLocators: pronunciation_dictionary_locators,
    });
    return ok({ audio_path: path, model: resolvedModel, format: resolvedFormat });
  })
);

server.registerTool(
  "clone_voice",
  {
    title: "Clone a voice (ElevenLabs IVC)",
    description:
      "Create an Instant Voice Clone from local audio samples. " +
      "IVC is immediate but conditioned, not fine-tuned. For Professional Voice Clone (PVC, 30-180 min audio, " +
      "near-indistinguishable quality) use the ElevenLabs dashboard — no API endpoint exists. " +
      "Needs ELEVENLABS_API_KEY.",
    inputSchema: {
      name: z.string().describe("Label for the cloned voice (shown in your account)."),
      sample_paths: z
        .array(z.string())
        .min(1)
        .describe(
          "Absolute paths to clean audio samples. 1-5 min of 24-bit WAV at 44.1/48kHz works best. " +
            "No background noise, no reverb. More samples = better clone."
        ),
      description: z.string().optional().describe("Optional voice description."),
      labels: z
        .object({
          language: z.string().optional(),
          accent: z.string().optional(),
          gender: z.string().optional(),
          age: z.string().optional(),
        })
        .optional()
        .describe("Metadata tags (language, accent, gender, age) for voice discovery."),
      remove_background_noise: z
        .boolean()
        .optional()
        .describe(
          "Run ElevenLabs audio isolation on samples before cloning. Enable if samples have background noise. Default false."
        ),
    },
  },
  handler(async ({ name, sample_paths, description, labels, remove_background_noise }) => {
    const voiceId = await cloneVoice({
      name,
      samplePaths: sample_paths,
      description,
      labels,
      removeBackgroundNoise: remove_background_noise ?? false,
    });
    return ok({ voice_id: voiceId });
  })
);

// ─── AUDIO POST ─────────────────────────────────────────────────────────────

server.registerTool(
  "master_audio",
  {
    title: "Master audio (FFmpeg EBU R128)",
    description:
      "Loudness-normalize an audio file for broadcast-quality delivery. " +
      "Two-pass EBU R128 loudnorm + dialogue intelligibility chain (highpass, denoise, gentle compression, de-ess) " +
      "+ true-peak limiting. Optional music bed ducking. Requires ffmpeg on PATH.",
    inputSchema: {
      input_path: z.string().describe("Absolute path to the source audio file (MP3, WAV, FLAC, AAC, etc.)."),
      output_path: z.string().describe("Absolute path to write the mastered WAV (48kHz, 16-bit)."),
      delivery_target: z
        .enum(["streaming", "podcast", "broadcast"])
        .optional()
        .describe(
          "Loudness target: streaming=-14 LUFS/-1.0 dBTP (YouTube/Spotify). " +
            "podcast=-16 LUFS/-1.5 dBTP (versatile default). " +
            "broadcast=-23 LUFS/-1.0 dBTP (EBU R128)."
        ),
      dialogue_chain: z
        .boolean()
        .optional()
        .describe(
          "Apply highpass(80Hz) + afftdn denoise + gentle compression + 7.5kHz de-ess before loudnorm. " +
            "Default true. Disable only for music-only content."
        ),
      music_bed_path: z
        .string()
        .optional()
        .describe("Absolute path to a music bed file. Will be sidechain-compressed under dialogue."),
      music_bed_level: z
        .number()
        .optional()
        .describe("Pre-duck level for music bed in dBFS. Default -18. Lower = quieter bed."),
    },
  },
  handler(async ({ input_path, output_path, delivery_target, dialogue_chain, music_bed_path, music_bed_level }) => {
    const path = await masterAudio({
      inputPath: input_path,
      outputPath: output_path,
      deliveryTarget: delivery_target ?? "podcast",
      dialogueChain: dialogue_chain ?? true,
      musicBedPath: music_bed_path,
      musicBedLevel: music_bed_level ?? -18,
    });
    return ok({ audio_path: path, delivery_target: delivery_target ?? "podcast" });
  })
);

// ─── LIPSYNC ─────────────────────────────────────────────────────────────────

server.registerTool(
  "lipsync",
  {
    title: "Lipsync via fal.ai",
    description:
      "Drive a portrait image or video with audio. " +
      "quality=draft routes to musetalk (fast, cheap, needs video input). " +
      "quality=final routes to veed/fabric-1.0 720p (image or video, default). " +
      "quality=studio routes to sync-lipsync-2-pro (highest open quality, needs video input). " +
      "Needs FAL_KEY.",
    inputSchema: {
      audio_url: z.string().describe("Public URL of the source audio. Upload local files with fal MCP upload tool first."),
      image_url: z.string().optional().describe("Portrait image URL. Used by veed/fabric-1.0 (image+audio → talking head)."),
      video_url: z.string().optional().describe("Source video URL. Used by musetalk, latentsync, sync-lipsync (video+audio → relipsync)."),
      output_path: z.string().describe("Absolute path to write the result .mp4 to."),
      quality: z
        .enum(["draft", "final", "studio"])
        .optional()
        .describe(
          "draft=musetalk (video only, fast). final=veed/fabric-1.0 720p (default). studio=sync-lipsync-2-pro (video only, highest quality)."
        ),
      model: z
        .string()
        .optional()
        .describe(
          "Override model slug directly (ignores quality). " +
            "Options: veed/fabric-1.0, fal-ai/musetalk, fal-ai/latentsync, fal-ai/sync-lipsync/v2."
        ),
      resolution: z
        .enum(["480p", "720p"])
        .optional()
        .describe("Resolution for veed/fabric-1.0. 480p=$0.08/s, 720p=$0.15/s. Default 720p."),
      sync_mode: z
        .enum(["cut_off", "loop", "bounce", "silence", "remap"])
        .optional()
        .describe("Duration handling for sync-lipsync models when audio and video lengths differ. Default cut_off."),
      estimate_cost_only: z
        .boolean()
        .optional()
        .describe("Return a cost estimate without running the job. Not all models support this."),
    },
  },
  handler(async ({
    audio_url, image_url, video_url, output_path,
    quality = "final", model, resolution, sync_mode, estimate_cost_only,
  }) => {
    if (!image_url && !video_url) {
      throw new Error("Provide image_url (for veed/fabric-1.0) or video_url (for musetalk / latentsync / sync-lipsync).");
    }

    // Resolve model from quality preset if no explicit override.
    let resolvedModel = model;
    let resolvedResolution = resolution ?? "720p";
    let syncModel;

    if (!resolvedModel) {
      const inputType = image_url ? "image" : "video";
      const preset = LIPSYNC_MODELS[inputType][quality] ?? LIPSYNC_MODELS[inputType].final;
      resolvedModel = preset.model;
      if (preset.resolution) resolvedResolution = resolution ?? preset.resolution;
      if (preset.syncModel) syncModel = preset.syncModel;
    }

    // Build model input.
    const input = { audio_url };
    if (resolvedModel === "veed/fabric-1.0") {
      if (!image_url) throw new Error("veed/fabric-1.0 requires image_url (image+audio → talking head).");
      input.image_url = image_url;
      input.resolution = resolvedResolution;
    } else if (resolvedModel === "fal-ai/musetalk") {
      if (!video_url) throw new Error("fal-ai/musetalk requires video_url.");
      input.source_video_url = video_url;
    } else if (resolvedModel === "fal-ai/sync-lipsync/v2") {
      if (!video_url) throw new Error("fal-ai/sync-lipsync/v2 requires video_url.");
      input.video_url = video_url;
      input.model = syncModel ?? "lipsync-2-pro";
      input.sync_mode = sync_mode ?? "cut_off";
    } else {
      // latentsync and others use video_url + audio_url
      if (video_url) input.video_url = video_url;
      if (image_url) input.image_url = image_url;
      if (sync_mode) input.sync_mode = sync_mode;
    }

    if (estimate_cost_only) {
      const cost = await estimateFalCost(resolvedModel, input);
      return ok({ model: resolvedModel, resolution: resolvedResolution, estimated_cost_usd: cost });
    }

    const result = await runFalModel(resolvedModel, input);
    const url = extractVideoUrl(result);
    if (!url) throw new Error(`No video URL in fal result: ${JSON.stringify(result).slice(0, 400)}`);
    const path = await downloadTo(url, output_path);
    return ok({ video_path: path, source_url: url, model: resolvedModel, resolution: resolvedResolution });
  })
);

// ─── TALKING HEAD (HeyGen) ───────────────────────────────────────────────────

server.registerTool(
  "generate_talking_head",
  {
    title: "Talking-head via HeyGen (polished finals)",
    description:
      "Render a talking-head via HeyGen v3. Best quality; uses plan credits. " +
      "Supports resolution up to 4k, 9:16 aspect ratio, background customization, " +
      "caption burn-in, and ElevenLabs voice engine passthrough. Needs HEYGEN_API_KEY.",
    inputSchema: {
      avatar_id: z.string().describe("HeyGen avatar id."),
      voice_id: z.string().describe("HeyGen voice id."),
      input_text: z.string().describe("Script the avatar will speak."),
      output_path: z.string().describe("Absolute path to write the result .mp4 (or .webm) to."),
      // Video output
      resolution: z
        .enum(["720p", "1080p", "4k"])
        .optional()
        .describe("Output resolution. Default 1080p."),
      aspect_ratio: z
        .enum(["16:9", "9:16", "4:5", "5:4", "1:1", "auto"])
        .optional()
        .describe("Aspect ratio. Use 9:16 for Reels/Shorts/TikTok. Default 16:9."),
      // Background
      background_type: z
        .enum(["color", "image"])
        .optional()
        .describe("Background type. color = solid hex. image = URL."),
      background_value: z
        .string()
        .optional()
        .describe("Hex color (e.g. '#1a1a2e') for color background, or image URL for image background."),
      remove_background: z
        .boolean()
        .optional()
        .describe("Remove background and output WebM with alpha channel. Overrides background_type."),
      // Captions
      caption: z
        .boolean()
        .optional()
        .describe("Burn captions into the video. A sidecar SRT is always generated alongside."),
      // Avatar behaviour
      expressiveness: z
        .enum(["high", "medium", "low"])
        .optional()
        .describe("Avatar expressiveness for photo avatars. Default medium."),
      engine: z
        .enum(["avatar_iv", "avatar_v"])
        .optional()
        .describe("Avatar engine. avatar_v is newest; falls back to avatar_iv if avatar is ineligible."),
      // Voice settings
      voice_speed: z
        .number()
        .min(0.5).max(1.5).optional()
        .describe("Speaking speed multiplier. 0.5=half speed, 1.5=50% faster."),
      voice_pitch: z
        .number()
        .min(-50).max(50).optional()
        .describe("Pitch shift in semitones. 0=no change."),
      voice_volume: z
        .number()
        .min(0).max(1.0).optional()
        .describe("Output volume. Default 1.0."),
      elevenlabs_model: z
        .string()
        .optional()
        .describe(
          "Use ElevenLabs TTS inside HeyGen. Pass an ElevenLabs model id (e.g. eleven_v3). " +
            "Requires that voice_id is an ElevenLabs voice usable by HeyGen."
        ),
    },
  },
  handler(async ({
    avatar_id, voice_id, input_text, output_path,
    resolution, aspect_ratio, background_type, background_value, remove_background,
    caption, expressiveness, engine, voice_speed, voice_pitch, voice_volume, elevenlabs_model,
  }) => {
    const { videoId, videoUrl } = await generateAvatarVideo({
      avatarId: avatar_id,
      voiceId: voice_id,
      inputText: input_text,
      resolution: resolution ?? "1080p",
      aspectRatio: aspect_ratio ?? "16:9",
      backgroundType: background_type,
      backgroundValue: background_value,
      removeBackground: remove_background ?? false,
      captionBurn: caption ?? false,
      expressiveness,
      engineType: engine,
      voiceSpeed: voice_speed,
      voicePitch: voice_pitch,
      voiceVolume: voice_volume,
      elevenLabsModel: elevenlabs_model,
    });
    const ext = remove_background ? ".webm" : ".mp4";
    const finalPath = output_path.endsWith(ext) ? output_path : output_path.replace(/\.[^.]+$/, ext) || output_path;
    const path = await downloadTo(videoUrl, output_path);
    return ok({ video_path: path, video_id: videoId, source_url: videoUrl });
  })
);

// ─── FACE RESTORATION ───────────────────────────────────────────────────────

server.registerTool(
  "restore_face",
  {
    title: "Restore and upscale a face image (CodeFormer)",
    description:
      "Clean up a portrait image before lipsync: removes compression artifacts, " +
      "sharpens detail, optionally 2-4x upscales. Uses fal-ai/codeformer. " +
      "Run on your source portrait before feeding it to lipsync. Needs FAL_KEY.",
    inputSchema: {
      image_url: z
        .string()
        .describe("Public URL of the portrait image to restore."),
      output_path: z
        .string()
        .describe("Absolute path to write the restored image (PNG)."),
      fidelity: z
        .number()
        .min(0).max(1).optional()
        .describe(
          "0.0=maximize enhancement and detail (best for degraded images). " +
            "1.0=maximize identity preservation (best for clean images). Default 0.5."
        ),
      upscale_factor: z
        .number()
        .min(1).max(4).optional()
        .describe("Upscaling factor. 2=double resolution (default), 4=4x for very small sources."),
      only_center_face: z
        .boolean()
        .optional()
        .describe("Process only the center/largest face. Faster for single-person portraits. Default false."),
      seed: z
        .number()
        .int().optional()
        .describe("Integer seed for reproducibility."),
    },
  },
  handler(async ({ image_url, output_path, fidelity, upscale_factor, only_center_face, seed }) => {
    const path = await restoreFace({
      imageUrl: image_url,
      outPath: output_path,
      fidelity: fidelity ?? 0.5,
      upscaleFactor: upscale_factor ?? 2,
      onlyCenterFace: only_center_face ?? false,
      seed,
    });
    return ok({ image_path: path });
  })
);

// ─── ASSEMBLY ────────────────────────────────────────────────────────────────

server.registerTool(
  "assemble_video",
  {
    title: "Assemble clips (FFmpeg)",
    description:
      "Concatenate avatar segments and b-roll into one file. " +
      "Stream-copy by default (clips must share codec/res/fps). " +
      "Set reencode true to normalize mixed inputs and enable subtitles/crossfade/export presets. " +
      "Requires ffmpeg on PATH.",
    inputSchema: {
      clips: z.array(z.string()).min(1).describe("Absolute paths to input clips, in order."),
      output_path: z.string().describe("Absolute path to write the final file to."),
      reencode: z
        .boolean()
        .optional()
        .describe("Re-encode to normalize mixed inputs. Required for subtitle burn-in, crossfade, and export_preset. Default false."),
      width: z.number().optional().describe("Target width when reencode is true."),
      height: z.number().optional().describe("Target height when reencode is true."),
      fps: z.number().optional().describe("Target fps when reencode is true. Default 30."),
      export_preset: z
        .enum(["delivery", "master"])
        .optional()
        .describe(
          "delivery=H.264 CRF 23, AAC 192k (default, platform delivery). " +
            "master=H.265 CRF 18, AAC 320k (archival, edit-ready)."
        ),
      subtitle_path: z
        .string()
        .optional()
        .describe("Absolute path to an .srt subtitle file to burn into video. Requires reencode true."),
      crossfade_secs: z
        .number()
        .min(0).optional()
        .describe("Seconds of fade transition between adjacent clips. Requires reencode true. Default 0 (hard cut)."),
    },
  },
  handler(async ({ clips, output_path, reencode, width, height, fps, export_preset, subtitle_path, crossfade_secs }) => {
    const path = await assembleVideo({
      clips,
      outPath: output_path,
      reencode: reencode ?? false,
      width,
      height,
      fps,
      exportPreset: export_preset ?? "delivery",
      subtitlePath: subtitle_path,
      crossfadeSecs: crossfade_secs ?? 0,
    });
    return ok({ video_path: path });
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
