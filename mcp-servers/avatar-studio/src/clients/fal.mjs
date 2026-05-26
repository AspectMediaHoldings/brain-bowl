import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { requireEnv, fetchJson, pollUntil } from "../util.mjs";

const FAL_QUEUE = "https://queue.fal.run";
const FAL_UPLOAD = "https://rest.fal.run/storage/upload/file";

// Submit a fal.ai model to the queue, poll until done, return the result JSON.
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

// Upload a local file to fal storage and return the public URL.
// Use this to make local audio/image files accessible to fal models.
export async function uploadToFal(localPath) {
  const key = requireEnv("FAL_KEY");
  const buf = await readFile(localPath);
  const name = basename(localPath);

  const res = await fetch(`${FAL_UPLOAD}?file_name=${encodeURIComponent(name)}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/octet-stream",
      "X-Fal-File-Name": name,
    },
    body: buf,
  });
  if (!res.ok) {
    throw new Error(`fal upload failed: HTTP ${res.status} ${(await res.text()).slice(0, 400)}`);
  }
  const data = await res.json();
  return data.url ?? data.access_url;
}

// Get a rough cost estimate for a fal model run (dollars).
// Not all models expose cost estimates; returns null if unavailable.
export async function estimateFalCost(model, input) {
  const key = requireEnv("FAL_KEY");
  try {
    const data = await fetchJson(`https://rest.fal.run/${model}/estimate`, {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return data.cost_usd ?? data.estimated_cost ?? null;
  } catch {
    return null;
  }
}

// Pull the first video URL from the varying shapes fal models return.
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

// Pull the first image URL from a fal result.
export function extractImageUrl(result) {
  return (
    result?.image?.url ||
    result?.image_url ||
    result?.output?.url ||
    (Array.isArray(result?.images) && result.images[0]?.url) ||
    null
  );
}
