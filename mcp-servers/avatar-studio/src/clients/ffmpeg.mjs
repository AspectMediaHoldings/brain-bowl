import { execFile } from "node:child_process";
import { mkdir, writeFile, rm, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

const run = promisify(execFile);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Concatenate clips into one video.
// Default uses the concat demuxer with stream copy (fast, lossless) and assumes
// the clips share codec, resolution, and fps. Set reencode to normalize mixed
// inputs to a common H.264/AAC spec (requires each clip to have an audio track).
export async function assembleVideo({ clips, outPath, reencode = false, width, height, fps = 30 }) {
  for (const clip of clips) {
    if (!(await exists(clip))) throw new Error(`Clip not found: ${clip}`);
  }
  await mkdir(dirname(outPath), { recursive: true });

  if (!reencode) {
    const listPath = join(tmpdir(), `avatar-studio-concat-${Date.now()}.txt`);
    const listBody = clips.map((c) => `file '${c.replace(/'/g, "'\\''")}'`).join("\n");
    await writeFile(listPath, listBody);
    try {
      await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outPath]);
    } finally {
      await rm(listPath, { force: true });
    }
    return outPath;
  }

  if (!width || !height) {
    throw new Error("reencode requires width and height for a common output resolution.");
  }
  const args = ["-y"];
  for (const clip of clips) args.push("-i", clip);
  const scale = clips
    .map(
      (_, i) =>
        `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}[v${i}];`
    )
    .join("");
  const streams = clips.map((_, i) => `[v${i}][${i}:a]`).join("");
  const filter = `${scale}${streams}concat=n=${clips.length}:v=1:a=1[v][a]`;
  args.push("-filter_complex", filter, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-c:a", "aac", outPath);
  await run("ffmpeg", args);
  return outPath;
}
