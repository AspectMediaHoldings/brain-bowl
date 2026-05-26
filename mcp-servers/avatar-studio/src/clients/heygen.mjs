import { requireEnv, fetchJson, pollUntil } from "../util.mjs";

const BASE = "https://api.heygen.com";

// Render a talking-head video from a HeyGen avatar speaking the given text.
// Submits the job, polls status, and returns the finished video URL.
// Note: this uses the HeyGen REST API (HEYGEN_API_KEY). The hosted HeyGen
// remote MCP authenticates via OAuth instead; this server takes the key path
// so it can run unattended.
export async function generateAvatarVideo({
  avatarId,
  voiceId,
  inputText,
  width = 1280,
  height = 720,
  pollIntervalMs = 5000,
  timeoutMs = 900000,
}) {
  const key = requireEnv("HEYGEN_API_KEY");
  const headers = { "X-Api-Key": key, "Content-Type": "application/json" };

  const submit = await fetchJson(`${BASE}/v2/video/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      video_inputs: [
        {
          character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
          voice: { type: "text", input_text: inputText, voice_id: voiceId },
        },
      ],
      dimension: { width, height },
    }),
  });

  const videoId = submit?.data?.video_id;
  if (!videoId) {
    throw new Error(`Unexpected HeyGen response: ${JSON.stringify(submit).slice(0, 400)}`);
  }

  const videoUrl = await pollUntil(
    async () => {
      const status = await fetchJson(`${BASE}/v1/video_status.get?video_id=${videoId}`, {
        headers: { "X-Api-Key": key },
      });
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
