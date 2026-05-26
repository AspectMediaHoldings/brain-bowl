import { execFile } from "node:child_process";
import { mkdir, writeFile, rm, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

const runExec = promisify(execFile);

// Capture stdout AND stderr from ffmpeg regardless of exit code.
// ffmpeg logs to stderr; exit code 0 is a successful run.
function ffmpegCapture(args, { maxBuffer = 20 * 1024 * 1024 } = {}) {
  return new Promise((resolve) => {
    execFile("ffmpeg", args, { maxBuffer }, (err, stdout, stderr) => {
      resolve({ stdout: stdout || "", stderr: stderr || "", exitCode: err?.code ?? 0 });
    });
  });
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// LUFS and true-peak targets per delivery platform.
const DELIVERY_TARGETS = {
  streaming: { lufs: -14, tp: -1.0 },   // YouTube, Spotify, Apple Music
  podcast:   { lufs: -16, tp: -1.5 },   // Podcast standard (versatile default)
  broadcast: { lufs: -23, tp: -1.0 },   // EBU R128
};

// Master an audio file to broadcast-quality loudness.
//
// deliveryTarget: "streaming" | "podcast" | "broadcast"
// dialogueChain:  true applies highpass + denoise + gentle compression + de-ess before loudnorm
// musicBedPath:   optional path to a music bed that will be ducked under dialogue
// musicBedLevel:  pre-duck level for music bed in dBFS (default -18)
//
// Output is 48kHz, 16-bit PCM (WAV). Feed the result into assemble_video or re-encode for delivery.
export async function masterAudio({
  inputPath,
  outputPath,
  deliveryTarget = "podcast",
  dialogueChain = true,
  musicBedPath,
  musicBedLevel = -18,
}) {
  if (!(await exists(inputPath))) throw new Error(`Input not found: ${inputPath}`);
  await mkdir(dirname(outputPath), { recursive: true });

  const { lufs, tp } = DELIVERY_TARGETS[deliveryTarget] ?? DELIVERY_TARGETS.podcast;

  // Pass 1: measure loudness.
  const pass1 = await ffmpegCapture([
    "-y", "-i", inputPath,
    "-af", `loudnorm=I=${lufs}:TP=${tp}:LRA=11:print_format=json`,
    "-f", "null", "-",
  ]);

  // The JSON block appears in stderr between { and }.
  const jsonMatch = pass1.stderr.match(/\{[^}]+\}/s);
  if (!jsonMatch) {
    throw new Error(`loudnorm pass 1 produced no JSON. stderr: ${pass1.stderr.slice(0, 600)}`);
  }
  let measured;
  try {
    measured = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`Could not parse loudnorm JSON: ${jsonMatch[0].slice(0, 400)}`);
  }

  // Build dialogue intelligibility chain (applied before loudnorm).
  const dialogueFilters = dialogueChain
    ? [
        "highpass=f=80",
        "afftdn=nf=-25",
        "acompressor=threshold=-18dB:ratio=3:attack=10:release=80:makeup=1",
        "equalizer=f=7500:width_type=o:width=2:g=-3",
      ]
    : [];

  // Two-pass loudnorm with measured values.
  const loudnormFilter =
    `loudnorm=I=${lufs}:TP=${tp}:LRA=11` +
    `:measured_I=${measured.input_i}` +
    `:measured_LRA=${measured.input_lra}` +
    `:measured_TP=${measured.input_tp}` +
    `:measured_thresh=${measured.input_thresh}` +
    `:offset=${measured.target_offset}` +
    `:linear=true`;

  // True-peak limiter. Convert dBTP to linear amplitude.
  const tpLinear = Math.pow(10, tp / 20).toFixed(4);
  const limiterFilter = `alimiter=limit=${tpLinear}:attack=5:release=50`;

  const mainChain = [...dialogueFilters, loudnormFilter, limiterFilter].join(",");

  // Pass 2: apply.
  let pass2;
  if (musicBedPath) {
    if (!(await exists(musicBedPath))) throw new Error(`Music bed not found: ${musicBedPath}`);
    const fc = [
      `[0:a]${mainChain}[voice]`,
      `[1:a]volume=${musicBedLevel}dB[music]`,
      `[music][voice]sidechaincompress=threshold=0.05:ratio=8:attack=10:release=100:makeup=1[ducked]`,
      `[voice][ducked]amix=inputs=2:duration=longest[out]`,
    ].join(";");
    pass2 = await ffmpegCapture([
      "-y", "-i", inputPath, "-i", musicBedPath,
      "-filter_complex", fc,
      "-map", "[out]",
      "-ar", "48000", "-sample_fmt", "s16",
      outputPath,
    ]);
  } else {
    pass2 = await ffmpegCapture([
      "-y", "-i", inputPath,
      "-af", mainChain,
      "-ar", "48000", "-sample_fmt", "s16",
      outputPath,
    ]);
  }

  if (pass2.exitCode !== 0) {
    throw new Error(`FFmpeg masterAudio pass 2 failed (exit ${pass2.exitCode}): ${pass2.stderr.slice(0, 600)}`);
  }

  return outputPath;
}

// Concatenate clips into one video.
//
// reencode:      false = concat demuxer (stream copy, clips must share codec/res/fps)
//                true  = scale + pad + re-encode to a common spec (required for mixed inputs)
// width/height:  required when reencode is true
// fps:           target fps when reencode is true (default 30)
// exportPreset:  "delivery" = H.264 CRF 23, AAC 192k (default)
//                "master"   = H.265 CRF 18, AAC 320k (archival quality)
// subtitlePath:  path to an .srt file to burn into video (requires reencode true)
// crossfadeSecs: seconds of crossfade between adjacent clips (requires reencode true, ≥2 clips)
export async function assembleVideo({
  clips,
  outPath,
  reencode = false,
  width,
  height,
  fps = 30,
  exportPreset = "delivery",
  subtitlePath,
  crossfadeSecs = 0,
}) {
  for (const clip of clips) {
    if (!(await exists(clip))) throw new Error(`Clip not found: ${clip}`);
  }
  await mkdir(dirname(outPath), { recursive: true });

  const presets = {
    delivery: { vcodec: "libx264", crf: "23", preset: "slow", acodec: "aac", abitrate: "192k" },
    master:   { vcodec: "libx265", crf: "18", preset: "medium", acodec: "aac", abitrate: "320k" },
  };
  const enc = presets[exportPreset] ?? presets.delivery;

  // Fast stream-copy path: no re-encode needed.
  if (!reencode) {
    const listPath = join(tmpdir(), `avatar-studio-concat-${Date.now()}.txt`);
    const listBody = clips.map((c) => `file '${c.replace(/'/g, "'\\''")}'`).join("\n");
    await writeFile(listPath, listBody);
    try {
      await runExec("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outPath]);
    } finally {
      await rm(listPath, { force: true });
    }
    return outPath;
  }

  if (!width || !height) throw new Error("reencode requires width and height.");

  // Build per-clip scale/pad/fps filter.
  const videoFilters = clips.map(
    (_, i) =>
      `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}[v${i}]`
  );

  // Optional crossfade between clips.
  let videoConcat;
  if (crossfadeSecs > 0 && clips.length >= 2) {
    // Chain xfade: [v0][v1]xfade=...[vx01]; [vx01][v2]xfade=...[vx012]; ...
    // For simplicity, apply crossfade sequentially.
    const chainParts = [...videoFilters];
    let prev = "v0";
    for (let i = 1; i < clips.length; i++) {
      const out = `vx${i}`;
      chainParts.push(
        `[${prev}][v${i}]xfade=transition=fade:duration=${crossfadeSecs}:offset=${i * 10 - crossfadeSecs}[${out}]`
      );
      prev = out;
    }
    videoConcat = chainParts.join(";") + `;[${prev}]copy[v]`;
  } else {
    const streamRefs = clips.map((_, i) => `[v${i}][${i}:a]`).join("");
    videoConcat = videoFilters.join(";") + `;${streamRefs}concat=n=${clips.length}:v=1:a=1[v][a]`;
  }

  // Subtitle burn-in.
  let filterComplex = videoConcat;
  if (subtitlePath) {
    const escapedSub = subtitlePath.replace(/\\/g, "/").replace(/'/g, "\\'");
    // Inject subtitle filter on the final video stream before mapping.
    filterComplex = filterComplex.replace("[v]", "[vpre]");
    filterComplex += `;[vpre]subtitles='${escapedSub}'[v]`;
  }

  const args = ["-y"];
  for (const clip of clips) args.push("-i", clip);
  args.push(
    "-filter_complex", filterComplex,
    "-map", "[v]",
    "-map", crossfadeSecs > 0 ? "0:a" : "[a]",
    "-c:v", enc.vcodec, "-crf", enc.crf, "-preset", enc.preset,
    "-c:a", enc.acodec, "-b:a", enc.abitrate,
    "-ar", "48000", "-pix_fmt", "yuv420p",
    outPath
  );

  const { exitCode, stderr } = await ffmpegCapture(args);
  if (exitCode !== 0) {
    throw new Error(`FFmpeg assembleVideo failed (exit ${exitCode}): ${stderr.slice(0, 600)}`);
  }
  return outPath;
}
