import { requireEnv, fetchJson, pollUntil } from "../util.mjs";

const FAL_QUEUE = "https://queue.fal.run";

// Submit a fal.ai model to the queue, poll until done, and return the result JSON.
// model is a slug like "veed/fabric-1.0" or "fal-ai/musetalk".
export async function runFalModel(model, input, { pollIntervalMs = 3000, timeoutMs = 600000 } = {}) {
  const key = requireEnv("FAL_KEY");
  const authHeaders = { Authorization: `Key ${key}` };

  const submit = await fetchJson(`${FAL_QUEUE}/${model}`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const statusUrl = submit.status_url;
  const responseUrl = submit.response_url;
  if (!statusUrl || !responseUrl) {
    throw new Error(`Unexpected fal submit response: ${JSON.stringify(submit).slice(0, 400)}`);
  }

  await pollUntil(
    async () => {
      const status = await fetchJson(statusUrl, { headers: authHeaders });
      if (status.status === "COMPLETED") return true;
      if (status.status === "FAILED" || status.status === "ERROR") {
        throw new Error(`fal job failed: ${JSON.stringify(status).slice(0, 400)}`);
      }
      return false;
    },
    { intervalMs: pollIntervalMs, timeoutMs }
  );

  return fetchJson(responseUrl, { headers: authHeaders });
}

// fal video models return varying shapes. Pull the first video URL we can find.
export function extractVideoUrl(result) {
  return (
    result?.video?.url ||
    result?.video_url ||
    result?.output?.url ||
    result?.url ||
    (Array.isArray(result?.videos) && result.videos[0]?.url) ||
    null
  );
}
