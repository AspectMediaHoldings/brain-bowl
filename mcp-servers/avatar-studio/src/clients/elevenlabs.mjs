import { readFile, mkdir, writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { requireEnv, fetchJson } from "../util.mjs";

const BASE = "https://api.elevenlabs.io/v1";

// Generate speech from text and write the MP3 to outPath. Returns outPath.
export async function synthesizeSpeech({ text, voiceId, modelId = "eleven_turbo_v2_5", outPath }) {
  const key = requireEnv("ELEVENLABS_API_KEY");
  const res = await fetch(`${BASE}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs TTS failed: HTTP ${res.status} ${(await res.text()).slice(0, 400)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buf);
  return outPath;
}

// List available voices so the model can discover voice ids.
export async function listVoices() {
  const key = requireEnv("ELEVENLABS_API_KEY");
  const data = await fetchJson(`${BASE}/voices`, { headers: { "xi-api-key": key } });
  return (data.voices || []).map((v) => ({ voice_id: v.voice_id, name: v.name, category: v.category }));
}

// Clone a voice from one or more local audio samples. Returns the new voice_id.
export async function cloneVoice({ name, samplePaths, description = "" }) {
  const key = requireEnv("ELEVENLABS_API_KEY");
  const form = new FormData();
  form.append("name", name);
  if (description) form.append("description", description);
  for (const path of samplePaths) {
    const buf = await readFile(path);
    form.append("files", new Blob([buf]), basename(path));
  }
  const data = await fetchJson(`${BASE}/voices/add`, {
    method: "POST",
    headers: { "xi-api-key": key },
    body: form,
  });
  return data.voice_id;
}
