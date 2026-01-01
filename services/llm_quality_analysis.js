// // backend/services/llm_analysis.js
// import axios from "axios";
// import fs from "fs";
// import sharp from "sharp";
// import dotenv from "dotenv";

// dotenv.config();
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// /**
//  * Analyzes an image for authenticity using the Gemini API.
//  * @param {string} localImagePath - Path to the image file.
//  * @returns {Promise<object>} The parsed JSON analysis result from Gemini.
//  */
// export async function analyzeImageWithGemini(localImagePath) {
//     try {
//         if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY in environment.");
//         console.log("➡️ Starting Gemini (LLM) analysis...");

//         const imageData = fs.readFileSync(localImagePath, { encoding: "base64" });
//         let mimeType = 'image/jpeg';
//         try {
//             const metadata = await sharp(localImagePath).metadata();
//             mimeType = `image/${metadata.format}`;
//         } catch (e) {
//             console.warn("Could not determine MIME type with sharp, falling back to image/jpeg.");
//         }

//         // --- Prompt Definition ---
//         const prompt = `
// You are a forensic digital image authenticity classifier.
// The image can be a painting , photography also so come to conclusion accordingly.

// + Today's date is: ${new Date().toISOString().split("T")[0]}
// + This is the ONLY valid present date. Do not assume a different date.
// + If an image timestamp is later than today's date, it must be flagged as suspicious.
// + Future timestamps should reduce confidence of originality unless strongly justified.

// Your task is to evaluate the authenticity of an uploaded image using visual clues,
// metadata indicators, similarity metrics, and possible manipulation traces.

// Consider:
// • Visual integrity (noise patterns, lighting, texture realism)
// • Editing anomalies (blending artifacts, unnatural edges, AI patterns)
// • Plagiarism signs (stock-like composition, overly generic image structure)
// • Metadata consistency (camera model, timestamps, missing EXIF)
// • Reverse image similarity (if prior matches exist)
// • Internal similarity with previous submissions

// Classification Rules:
// • ORIGINAL → no signs of plagiarism or editing, natural metadata or camera source
// • MODIFIED → digitally altered, retouched, or AI-generated indicators present
// • COPIED  → matches/resembles stock images, internet sources, or internal duplicates
// • UNKNOWN  → insufficient evidence to classify confidently

// You MUST return output strictly in JSON format:

// {
//   "verdict": "ORIGINAL | MODIFIED | COPIED | UNKNOWN",
//   "confidence": <0.00 to 1.00>,
//   "notes": "short final conclusion in one or two lines"
// }
// `;

//         const payload = {
//             model: "gemini-2.5-flash",
//             contents: [{
//                 parts: [{ text: prompt }, {
//                     inline_data: {
//                         mime_type: mimeType,
//                         data: imageData,
//                     },
//                 },],
//             },],
//             generationConfig: {
//                 temperature: 0.1,
//             }
//         };

//         const response = await axios.post(
//             "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
//             payload, {
//             params: {
//                 key: GEMINI_API_KEY
//             }
//         }
//         );
//         console.log("✅ Gemini analysis complete. Raw response received.");

//         const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
//         let parsedResponse;
//         try {
//             parsedResponse = JSON.parse(rawText);
//         } catch (parseErr) {
//             const match = rawText.match(/\{[\s\S]*\}/);
//             if (match) {
//                 try {
//                     parsedResponse = JSON.parse(match[0]);
//                 } catch {
//                     parsedResponse = {
//                         verdict: "UNKNOWN",
//                         confidence: 0,
//                         explanation: rawText
//                     };
//                 }
//             } else {
//                 parsedResponse = {
//                     verdict: "UNKNOWN",
//                     confidence: 0,
//                     explanation: rawText
//                 };
//             }
//         }

//         parsedResponse.status = parsedResponse.verdict === "UNKNOWN" ? "LLM_FAILED" : "LLM_COMPLETE";
//         return parsedResponse;

//     } catch (err) {
//         const errorMessage = err.response?.data?.error?.message || err.message;
//         console.error("❌ Gemini API ERROR:", errorMessage);
//         return {
//             verdict: "ERROR",
//             confidence: 0,
//             explanation: "LLM processing failed: " + errorMessage,
//             status: "LLM_ERROR"
//         };
//     }
// }








// backend/services/llm_analysis.js
import Groq from "groq-sdk";
import fs from "fs";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function groqRetry(request, retries = 3) {
    let wait = 800;
    for (let i = 0; i < retries; i++) {
        try {
            return await request();
        } catch (err) {
            if (err.name === "AbortError") {
                console.warn(`⏱ Groq timeout. Retry ${i + 1}/${retries}`);
            } else if (err.status === 429) {
                console.warn(`⚠ Rate limit. Retry ${i + 1}/${retries}`);
            } else {
                throw err;
            }
            await new Promise(r => setTimeout(r, wait));
            wait *= 2;
        }
    }
    throw new Error("Groq failed after retries");
}

export async function analyzeImageWithGroq(localImagePath, challengeDescription = "") {
    try {
        console.log("➡️ Starting Quality & Fidelity Analysis...");

        const imageBase64 = fs.readFileSync(localImagePath, { encoding: "base64" });

        const prompt = `
You are an expert Artistic & Technical Judge. Your role is to assess the EXECUTION and QUALITY of the user's work.
Be a mentor: appreciate the effort, but provide an accurate technical score.

CHALLENGE CONTEXT:
"${challengeDescription}"

SCORING PHILOSOPHY:
1. RESPECTFUL BASELINE (0.3 - 0.5): If the user made a clear, honest attempt at the challenge, never score below 0.3. Respect their effort.
2. TECHNICAL EXECUTION (0.6 - 0.8): Award this if the work shows good technique, composition, or skill-specific traits (e.g., steady lines in drawing, good lighting 
in photography).
3. MASTERY (0.85 - 1.0): Award for exceptional work that shows professional-level care, detail, or creative flair.
4. QUALITY VERDICT:
   - EXCELLENT: High level of skill/effort (0.85+)
   - GOOD: Competent and satisfying work (0.65 - 0.84)
   - AVERAGE: Standard attempt, hits the basics (0.45 - 0.64)
   - IMPROVING: The user is trying, but needs more practice (< 0.45)

REQUIRED JSON FORMAT:
{
  "qualityScore": float (0.0 to 1.0),
  "qualityVerdict": "EXCELLENT | GOOD | AVERAGE | IMPROVING",
  "explanation": "Start with a technical compliment, then one specific suggestion for improvement.",
  "perceivedMedium": "e.g., Digital Art, Pencil Sketch, Macro Photo",
  "requirementsMet": true
}

Respond ONLY with valid JSON.
`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000); // ⏱ 12s

        const response = await groqRetry(() =>
            client.chat.completions.create(
                {
                    model: "meta-llama/llama-4-scout-17b-16e-instruct",
                    temperature: 0.1,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: prompt },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:image/jpeg;base64,${imageBase64}`
                                    }
                                }
                            ]
                        }
                    ]
                },
                { signal: controller.signal }
            )
        );

        clearTimeout(timeout);

        const raw = response.choices?.[0]?.message?.content || "";
        console.log("🧠 LLM Quality Raw Output:", raw);

        // --- Robust JSON extraction ---
        const firstBrace = raw.indexOf("{");
        const lastBrace = raw.lastIndexOf("}");

        if (firstBrace === -1 || lastBrace === -1) {
            throw new Error("No JSON found in LLM output");
        }

        const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));

        return {
            qualityScore: Number(parsed.qualityScore) || 0,
            qualityVerdict: parsed.qualityVerdict || "ERROR",
            explanation: parsed.explanation || "No explanation",
            perceivedMedium: parsed.perceivedMedium || "Unknown",
            requirementsMet: Boolean(parsed.requirementsMet)
        };

    } catch (err) {
        console.error("❌ Quality Scoring Error:", err.message);
        return {
            qualityScore: 0,
            qualityVerdict: "ERROR",
            explanation: err.message,
            requirementsMet: false
        };
    }
}













