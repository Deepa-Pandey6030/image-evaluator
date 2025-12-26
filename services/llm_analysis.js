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











// backend/services/llm_analysis_groq.js
import Groq from "groq-sdk";
import fs from "fs";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function analyzeImageWithGroq(localImagePath) {
    try {
        console.log("➡️ Starting Groq Vision (LLM) analysis...");

        const imageBase64 = fs.readFileSync(localImagePath, { encoding: "base64" });

        const prompt = `
You are a forensic digital image authenticity classifier.
Analyze the uploaded image for manipulation, plagiarism, originality,
and AI-generation characteristics.

Return STRICT JSON:
{
  "verdict": "ORIGINAL | MODIFIED | COPIED | UNKNOWN",
  "confidence": 0.0,
  "notes": "very short explanation"
}
`;

        const response = await client.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                { 
                    role: "user",
                    // 👇 FIX IS HERE: Correcting the structure of the content array
                    content: [
                        {
                            type: "text", // ✅ Use 'text'
                            text: prompt
                        },
                        {
                            type: "image_url", // ✅ Use 'image_url'
                            image_url: {
                                url: `data:image/jpeg;base64,${imageBase64}`
                            }
                        }
                    ]
                }
            ],
            temperature: 0.2
        });

        const text = response.choices?.[0]?.message?.content;
        let parsed;

        try {
            parsed = JSON.parse(text);
        } catch {
            const match = text.match(/\{[\s\S]*\}/);
            parsed = match ? JSON.parse(match[0]) : {
                verdict: "UNKNOWN",
                confidence: 0,
                notes: "Invalid JSON returned by LLM."
            };
        }

        parsed.status = parsed.verdict === "UNKNOWN" ? "LLM_FAILED" : "LLM_COMPLETE";
        return parsed;

    } catch (err) {
        // ... (Error handling remains the same)
        console.error("❌ Groq LLM ERROR:", err?.response?.data || err.message);
        return {
            verdict: "ERROR",
            confidence: 0,
            notes: "LLM call failed: " + (err?.response?.data || err.message),
            status: "LLM_ERROR"
        };
    }
}