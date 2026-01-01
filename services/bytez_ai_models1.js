// backend/services/ai_classification.js
import Bytez from "bytez.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();
const BYTEZ_API_KEY = process.env.BYTEZ_API_KEY;

/**
 * Runs Bytze.js AI classification on a local image to detect manipulation/fakeness.
 * @param {string} localImagePath - Path to the image file.
 * @returns {Promise<{status: string, score: number, error?: string, rawOutput?: any}>}
 */
export async function runBytezAiClassification(localImagePath) {
    if (!BYTEZ_API_KEY) {
        console.error("❌ Bytze.js API Key is missing.");
        return { status: "API_KEY_MISSING", score: 0 };
    }

    try {
        console.log("➡️ Starting Bytze.js AI classification...");
        const sdk = new Bytez(BYTEZ_API_KEY);
        const model = sdk.model("mahsharyahan/vit-ai-detection");

        const imageBuffer = fs.readFileSync(localImagePath);
        const mimeType = `data:image/${path.extname(localImagePath).slice(1) || 'png'};base64,${imageBuffer.toString("base64")}`;

        const { error, output } = await model.run(mimeType);

        if (error) {
            console.error("❌ Bytze.js Model Run Error:", error);
            return { status: "MODEL_ERROR", score: 0, error: error.message };
        }

        const aiScore = output.find(o => o.label === 'fake' || o.label === 'artificial' || o.label === 'manipulated')?.score ||
            (output.find(o => o.label === 'real' || o.label === 'authentic') ? 1 - output.find(o => o.label === 'real' || o.label === 'authentic').score : 0);

        const predictionStatus = aiScore > 0.75 ? "MANIPULATED" : "CLEAN";

        console.log(`✅ Bytze.js classification complete. Prediction: ${predictionStatus} (Score: ${aiScore.toFixed(4)})`);

        return {
            status: predictionStatus,
            score: parseFloat(aiScore.toFixed(4)),
            rawOutput: output
        };

    } catch (err) {
        console.error("❌ Bytze.js Runtime Error:", err.message);
        return { status: "RUNTIME_ERROR", score: 0, error: err.message };
    }
}