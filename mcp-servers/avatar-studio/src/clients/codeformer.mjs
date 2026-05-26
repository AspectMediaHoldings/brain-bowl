import { runFalModel, extractImageUrl } from "./fal.mjs";
import { downloadTo } from "../util.mjs";

// Restore and optionally upscale a face image using CodeFormer via fal.ai.
//
// imageUrl:       Public URL of the source image (portrait or avatar frame).
// fidelity:       0.0 = maximize enhancement / detail; 1.0 = maximize identity preservation.
//                 0.5 is a balanced default. For lipsync source portraits use 0.3-0.5.
// upscaleFactor:  1–4. Default 2 (doubles resolution).
// onlyCenterFace: true = only restore the largest face (faster on multi-face images).
// faceUpscale:    true = apply upscaling pass (default true).
// seed:           integer for reproducibility.
//
// Returns the local output path.
export async function restoreFace({ imageUrl, outPath, fidelity = 0.5, upscaleFactor = 2, onlyCenterFace = false, faceUpscale = true, seed }) {
  const input = {
    image_url: imageUrl,
    fidelity,
    upscale_factor: upscaleFactor,
    only_center_face: onlyCenterFace,
    face_upscale: faceUpscale,
  };
  if (seed !== undefined) input.seed = seed;

  const result = await runFalModel("fal-ai/codeformer", input);
  const url = extractImageUrl(result);
  if (!url) {
    throw new Error(`CodeFormer returned no image URL: ${JSON.stringify(result).slice(0, 400)}`);
  }
  return downloadTo(url, outPath);
}
