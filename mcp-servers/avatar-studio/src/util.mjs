import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Set it in the MCP server config (env block in ~/.claude.json).`
    );
  }
  return value;
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch and parse JSON. Throws a readable error on non-2xx instead of a raw stack.
export async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}: ${text.slice(0, 600)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Download a URL to a local path, creating parent dirs. Returns the path.
export async function downloadTo(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status} from ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buf);
  return outPath;
}

// Poll an async function until it returns a truthy value or the timeout hits.
export async function pollUntil(check, { intervalMs = 3000, timeoutMs = 600000 } = {}) {
  const start = Date.now();
  for (;;) {
    const result = await check();
    if (result) return result;
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out after ${Math.round(timeoutMs / 1000)}s waiting for job to finish.`);
    }
    await sleep(intervalMs);
  }
}
