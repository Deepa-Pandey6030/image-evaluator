// backend/server-evaluator.js
// Stateless Image Evaluation API (Production Version)
//docker build -t image-evaluator . && docker run -p 8100:8100 --env-file .env.docker image-evaluator 
//docker run -d --name image-evaluator-api --env-file .env.docker -p 8100:8100 image-evaluator


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import sharp from "sharp";
import fs from "fs";
import pLimit from "p-limit";
import exifpkg from "exif-reader";
import os from "os";
import path from "path";
const { extract } = exifpkg;

// ---- Services (UNCHANGED) ----
import { computePhash, yandexReverseSearch } from "./services/revesre_image_search.js";
import { runBytezAiClassification } from "./services/bytez_ai_models1.js";
import { analyzeImageWithGroq } from "./services/llm_analysis.js";
import analyzeSubmission from "./services/challenge_analysis.js";
import { calculateFinalScore } from "./services/scoring.js";

// --------------------------------

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8100;
const API_KEY = (process.env.API_KEY || "").trim();
// --------------------------------
// GLOBAL MIDDLEWARE (ORDER MATTERS)
// --------------------------------
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// --------------------------------
// AUTH MIDDLEWARE (FIXED)
// --------------------------------
app.use((req, res, next) => {
  // ✅ Allow CORS preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized (missing header)" });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!API_KEY || token !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized (invalid token)" });
  }

  next();
});

// --------------------------------
// Concurrency guard (prevents overload)
// --------------------------------
const limit = pLimit(1);

// ===================================================
// SINGLE STATELESS EVALUATION ENDPOINT
// ===================================================
app.post("/api/evaluate", async (req, res) => {
  const start = Date.now();

  const {
    user_id,
    challenge_id,
    challenge_description,
    user_description,
    image_url
  } = req.body;

  if (!image_url || !challenge_description) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  await limit(async () => {
    let tmpPath = null;

    try {
      // 1️⃣ Download image (TEMP, cross-platform)
      tmpPath = path.join(os.tmpdir(), `${Date.now()}.jpg`);

      const response = await axios.get(image_url, {
        responseType: "arraybuffer",
        timeout: 15000
      });

      fs.writeFileSync(tmpPath, response.data);

      // 2️⃣ Metadata + pHash
      const imageBuffer = await sharp(tmpPath).toBuffer();
      const metadata = await sharp(imageBuffer).metadata();
      const pHash = await computePhash(tmpPath);

      let exifData = {};
      try {
        exifData = metadata.exif ? extract(metadata.exif) : {};
      } catch {}

      const forensicFeatures = {
        resolution: `${metadata.width}x${metadata.height}`,
        fileType: metadata.format,
        pHash,
        exifStripped: !metadata.exif,
        exifData
      };

      // 3️⃣ Run all AI layers (PARALLEL)
      const [bytez, yandexRes, llm, challengeEval] = await Promise.all([
        runBytezAiClassification(tmpPath).catch(() => ({ status: "ERROR", score: 0 })),
        yandexReverseSearch(tmpPath, pHash).catch(() => ({ yandexResults: [], status: "FAILED" })),
        analyzeImageWithGroq(tmpPath).catch(() => ({ verdict: "ERROR" })),
        analyzeSubmission(tmpPath, challenge_description).catch(() => ({ match: false }))
      ]);

      // 4️⃣ Final scoring
      const finalScore = calculateFinalScore(
        bytez,
        yandexRes.yandexResults,
        llm,
        challengeEval,
        forensicFeatures
      );

      // 5️⃣ Cleanup TEMP FILE
      fs.unlinkSync(tmpPath);

      // 6️⃣ RESPONSE (STATELESS)
      return res.json({
        user_id,
        challenge_id,
        final_score: finalScore.total,
        max_score: 500,
        verdict: finalScore.verdict,
        breakdown: finalScore.breakdown,
        rationale: finalScore.rationale,
        processing_time_ms: Date.now() - start
      });

    } catch (err) {
      if (tmpPath && fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }

      console.error("Evaluation failed:", err);
      return res.status(500).json({ error: "Evaluation failed" });
    }
  });
});

// --------------------------------
// SAFETY FALLBACK
// --------------------------------
app.use((req, res) => {
  res.status(404).json({
    status: "NOT_FOUND",
    message: "API route does not exist"
  });
});

// --------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Stateless Evaluator running on port ${PORT}`);
});
