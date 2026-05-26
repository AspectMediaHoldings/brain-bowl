import { readFile, mkdir, writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { requireEnv, fetchJson } from "../util.mjs";

const BASE = "https://api.elevenlabs.io/v1";

// Generate speech from text and write audio to outPath.
// outputFormat: see ElevenLabs format enum (mp3_44100_128, pcm_44100, pcm_48000, wav_44100, etc.)
// Studio master path: modelId="eleven_v3", outputFormat="pcm_48000" (write as .wav)
export async function synthesizeSpeech({
  text,
  voiceId,
  modelId = "eleven_v3",
  outPath,
  outputFormat = "mp3_44100_128",
  // Voice settings (all optional — server applies ElevenLabs defaults if omitted)
  stability,
  similarityBoost,
  style,
  speed,
  useSpeakerBoost,
  // Text control
  languageCode,
  seed,
  applyTextNormalization,
  previousText,
  nextText,
  pronunciationDictionaryLocators,
}) {
  const key = requireEnv("ELEVENLABS_API_KEY");
  const url = new URL(`${BASE}/text-to-speech/${voiceId}`);
  url.searchParams.set("output_format", outputFormat);

  // Build voice_settings only if any values were supplied.
  const vs = {};
  if (stability !== undefined) vs.stability = stability;
  if (similarityBoost !== undefined) vs.similarity_boost = similarityBoost;
  if (style !== undefined) vs.style = style;
  if (speed !== undefined) vs.speed = speed;
  if (useSpeakerBoost !== undefined) vs.use_speaker_boost = useSpeakerBoost;

  const body = { text, model_id: modelId };
  if (Object.keys(vs).length) body.voice_settings = vs;
  if (languageCode) body.language_code = languageCode;
  if (seed !== undefined) body.seed = seed;
  if (applyTextNormalization) body.apply_text_normalization = applyTextNormalization;
  if (previousText) body.previous_text = previousText;
  if (nextText) body.next_text = nextText;
  if (pronunciationDictionaryLocators?.length) {
    body.pronunciation_dictionary_locators = pronunciationDictionaryLocators;
  }

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs TTS failed: HTTP ${res.status} ${(await res.text()).slice(0, 400)}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buf);
  return outPath;
}

// List available voices in the account.
export async function listVoices() {
  const key = requireEnv("ELEVENLABS_API_KEY");
  const data = await fetchJson(`${BASE}/voices`, { headers: { "xi-api-key": key } });
  return (data.voices || []).map((v) => ({
    voice_id: v.voice_id,
    name: v.name,
    category: v.category,
    labels: v.labels,
  }));
}

// Clone a voice from local audio samples (Instant Voice Clone).
// IVC creates a conditioned clone immediately from samples.
// Professional Voice Clone (PVC) is not available via API — use the ElevenLabs dashboard.
// labels: object with keys language, accent, gender, age (all optional).
export async function cloneVoice({ name, samplePaths, description = "", labels, removeBackgroundNoise = false }) {
  const key = requireEnv("ELEVENLABS_API_KEY");
  const form = new FormData();
  form.append("name", name);
  if (description) form.append("description", description);
  form.append("remove_background_noise", String(removeBackgroundNoise));
  if (labels && typeof labels === "object" && Object.keys(labels).length) {
    form.append("labels", JSON.stringify(labels));
  }
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
