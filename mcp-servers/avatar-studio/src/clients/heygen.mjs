import { requireEnv, fetchJson, pollUntil } from "../util.mjs";

// HeyGen v3 API. v2 is supported until October 31 2026 but lacks resolution enum,
// voice_settings, expressiveness, engine selection, and caption burn-in.
// v3 docs: https://developers.heygen.com/reference/create-video

const BASE = "https://api.heygen.com";

// Render a talking-head video via HeyGen. Returns { videoId, videoUrl }.
//
// resolution:      "720p" | "1080p" | "4k"
// aspectRatio:     "16:9" | "9:16" | "4:5" | "5:4" | "1:1" | "auto"
// backgroundType:  "color" | "image"
// backgroundValue: hex color (e.g. "#0a0a0a") for color; image URL for image
// removeBackground: true returns webm with alpha; rejects backgroundType
// captionBurn:     true burns captions into video via caption.style="default"
// expressiveness:  "high" | "medium" | "low" (photo avatars with Avatar IV/V)
// engineType:      "avatar_iv" | "avatar_v"
// voiceSpeed:      0.5–1.5
// voicePitch:      -50 to +50 (semitones)
// voiceVolume:     0.0–1.0
// elevenLabsModel: pass an ElevenLabs model_id to use via HeyGen's engine passthrough
export async function generateAvatarVideo({
  avatarId,
  voiceId,
  inputText,
  resolution = "1080p",
  aspectRatio = "16:9",
  backgroundType,
  backgroundValue,
  removeBackground = false,
  captionBurn = false,
  expressiveness,
  engineType,
  voiceSpeed,
  voicePitch,
  voiceVolume,
  elevenLabsModel,
  pollIntervalMs = 5000,
  timeoutMs = 900000,
}) {
  const key = requireEnv("HEYGEN_API_KEY");
  const headers = { "X-Api-Key": key, "Content-Type": "application/json" };

  const body = {
    type: "avatar",
    avatar_id: avatarId,
    script: inputText,
    voice_id: voiceId,
    resolution,
    aspect_ratio: aspectRatio,
  };

  // Background
  if (removeBackground) {
    body.remove_background = true;
    body.output_format = "webm";
  } else if (backgroundType) {
    body.background = { type: backgroundType };
    if (backgroundType === "color" && backgroundValue) body.background.value = backgroundValue;
    if (backgroundType === "image" && backgroundValue) body.background.url = backgroundValue;
  }

  // Captions (sidecar SRT always generated; style=default burns into video)
  if (captionBurn) {
    body.caption = { style: "default", file_format: "srt" };
  }

  // Avatar behaviour
  if (expressiveness) body.expressiveness = expressiveness;
  if (engineType) body.engine = { type: engineType };

  // Voice settings
  const vs = {};
  if (voiceSpeed !== undefined) vs.speed = voiceSpeed;
  if (voicePitch !== undefined) vs.pitch = voicePitch;
  if (voiceVolume !== undefined) vs.volume = voiceVolume;
  if (elevenLabsModel) {
    vs.engine_settings = { engine_type: "elevenlabs", model: elevenLabsModel };
  }
  if (Object.keys(vs).length) body.voice_settings = vs;

  const submit = await fetchJson(`${BASE}/v3/videos`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const videoId = submit?.data?.video_id;
  if (!videoId) {
    throw new Error(`Unexpected HeyGen v3 response: ${JSON.stringify(submit).slice(0, 400)}`);
  }

  const videoUrl = await pollUntil(
    async () => {
      const status = await fetchJson(`${BASE}/v3/videos/${videoId}`, { headers: { "X-Api-Key": key } });
      const state = status?.data?.status;
      if (state === "completed") return status.data.video_url;
      if (state === "failed") {
        throw new Error(`HeyGen render failed: ${JSON.stringify(status.data).slice(0, 400)}`);
      }
      return false;
    },
    { intervalMs: pollIntervalMs, timeoutMs }
  );

  return { videoId, videoUrl };
}
