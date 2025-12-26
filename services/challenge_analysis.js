// //test.js(yandex hard coded image path )
// import fs from "fs";
// import axios from "axios";
// import imghash from "imghash";
// import dotenv from "dotenv";
// import puppeteer from "puppeteer-extra";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";

// dotenv.config();
// puppeteer.use(StealthPlugin());

// // =====================================
// // CHANGE ONLY THIS LINE ↓↓↓
// const HARDCODED_IMAGE_PATH =
//   "D:/Deepa/Internship/web app/frontend/AI/download.png";
// // =====================================

// // ================== pHASH ==================
// async function computePhash(buffer) {
//   return await imghash.hash(buffer, 16);
// }

// function hammingDistance(hash1, hash2) {
//   let dist = 0;
//   for (let i = 0; i < hash1.length; i++) {
//     if (hash1[i] !== hash2[i]) dist++;
//   }
//   return dist;
// }

// // ================== MATCH DECISION ==================
// function matchDecision(similarity) {
//   if (similarity >= 90) return { match: "YES — Strong Match", reason: "Almost identical image found" };
//   if (similarity >= 70) return { match: "YES — Moderate Match", reason: "High visual similarity" };
//   if (similarity >= 50) return { match: "POSSIBLE MATCH", reason: "Some visual similarity but not exact" };
//   return { match: "NO — Not a match", reason: "Similarity too low" };
// }

// // ================== YANDEX DIRECT FILE UPLOAD ==================
// async function yandexReverseSearchLocal(filePath) {
//   try {
//     console.log("🌍 Launching Puppeteer...");

//     const browser = await puppeteer.launch({
//       headless: "new",
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-blink-features=AutomationControlled",
//       ],
//     });

//     const page = await browser.newPage();
//     await page.setViewport({ width: 1280, height: 900 });

//     console.log("🌐 Opening Yandex Images...");
//     await page.goto("https://yandex.com/images/", { waitUntil: "networkidle2" });

//     console.log("📂 Forcing Yandex upload modal to open...");

//     await page.evaluate(() => {
//       document.querySelectorAll("input[type='file']").forEach((el) => {
//         el.style.display = "block";
//       });
//     });

//     const fileInput = await page.waitForSelector("input[type=file]", { timeout: 15000 });
//     if (!fileInput) throw new Error("❌ File input not found!");

//     await fileInput.uploadFile(filePath);

//     console.log("📤 File uploaded. Waiting for Yandex to process...");
//     await page.waitForSelector(".CbirSites-Item", { timeout: 35000 });

//     const results = await page.evaluate(() => {
//       const items = Array.from(document.querySelectorAll(".CbirSites-Item"));
//       return items.slice(0, 6).map((item) => ({
//         thumb:
//           item.querySelector("img")?.src ||
//           item.querySelector("img")?.getAttribute("data-src"),
//         pageUrl: item.querySelector("a")?.href,
//         title: item.querySelector(".CbirSites-ItemTitle")?.innerText || "",
//       }));
//     });

//     await browser.close();
//     return results;
//   } catch (err) {
//     console.error("❌ Yandex Upload Error:", err.message);
//     return [];
//   }
// }

// // ================== MAIN ==================
// async function main() {
//   console.log("\n📁 Using hard-coded image:", HARDCODED_IMAGE_PATH);

//   if (!fs.existsSync(HARDCODED_IMAGE_PATH)) {
//     console.log("❌ File not found:", HARDCODED_IMAGE_PATH);
//     return;
//   }

//   const buffer = fs.readFileSync(HARDCODED_IMAGE_PATH);

//   console.log("🧮 Computing pHash...");
//   const queryPhash = await computePhash(buffer);
//   console.log("Query pHash:", queryPhash);

//   console.log("🔍 Searching on Yandex with direct upload...");
//   const yandexResults = await yandexReverseSearchLocal(HARDCODED_IMAGE_PATH);

//   console.log(`\n🔗 Fetched ${yandexResults.length} results from Yandex.\n`);

//   const finalOutput = [];

//   for (let r of yandexResults) {
//     try {
//       if (!r.thumb || !r.thumb.startsWith("http")) continue;

//       const img = await axios.get(r.thumb, { responseType: "arraybuffer" });
//       const ph = await computePhash(Buffer.from(img.data));

//       const dist = hammingDistance(queryPhash, ph);
//       const similarity = 100 - (dist / 64) * 100;

//       const { match, reason } = matchDecision(similarity);

//       finalOutput.push({
//         ...r,
//         phash: ph,
//         hamming: dist,
//         similarity: similarity.toFixed(2),
//         match,
//         reason,
//       });
//     } catch (err) {
//       console.log("⚠ Could not hash:", err.message);
//     }
//   }

//   finalOutput.sort((a, b) => b.similarity - a.similarity);

//   console.log("\n============== FINAL RESULTS (TOP 6) ==============\n");

//   finalOutput.forEach((r, i) => {
//     console.log(`🔥 RESULT #${i + 1}`);
//     console.log("Title       :", r.title);
//     console.log("Source URL  :", r.pageUrl);
//     console.log("Thumbnail   :", r.thumb);
//     console.log("pHash       :", r.phash);
//     console.log("Hamming     :", r.hamming);
//     console.log("Similarity  :", r.similarity + "%");
//     console.log("Match?      :", r.match);
//     console.log("Reason      :", r.reason);
//     console.log("---------------------------------\n");
//   });
// }

// main();




// test.js → AI Image Detector (Hive Moderation API)
// Run with: node test.js

// import axios from "axios";
// import fs from "fs";

// const API_KEY = "HL4QbJmdzUnbEJrs";        // put your new Hive key here
// const IMAGE_PATH = "D:/Deepa/Internship/web app/frontend/AI/download.png";            // hard-coded path of image to detect
// //
// async function detectAI() {
//   try {
//     const image = fs.createReadStream(IMAGE_PATH);

//     const res = await axios.post(
//       "https://api.thehive.ai/api/v3/moderation",
//       { media: image },
//       { headers: { Authorization: `Token ${API_KEY}` } }
//     );

//     console.log("\n===== AI IMAGE CLASSIFICATION RESULT =====\n");
//     console.log(JSON.stringify(res.data, null, 2));

//     const outputs = res?.data?.output?.result || [];

//     const ai = outputs.find(o => o.label === "ai-generated");
//     const real = outputs.find(o => o.label === "real");

//     console.log("\n==========================================");
//     if (ai && ai.confidence > real?.confidence) {
//       console.log(`🔍 Status: Likely AI-Generated (${(ai.confidence * 100).toFixed(2)}%)`);
//     } else {
//       console.log(`🟢 Status: Likely Real (${(real.confidence * 100).toFixed(2)}%)`);
//     }
//     console.log("==========================================\n");
//   } catch (error) {
//     console.error("\n❌ Error:", error.response?.data || error.message);
//   }
// }

// detectAI();



// //2wFUbPF/m+CrQuQIFAXo3A==

// //+jTXN6hOFOnzraAHFP+J2A==





/*
  npm i bytez.js || yarn add bytez.js
*/
// test.js



// import Bytez from "bytez.js";
// import fs from "fs";
// import dotenv from "dotenv";
// dotenv.config();
// const BYTEZ_API_KEY=process.env.BYTEZ_API_KEY

// const IMAGE_PATH = "D:/Deepa/Internship/web app/frontend/AI/download.png"; // <--- Your image

// (async () => {
//     try {
//         const sdk = new Bytez(BYTEZ_API_KEY);
//         const model = sdk.model("mahsharyahan/vit-ai-detection");

//         // Read local file → convert to base64
//         const imageBuffer = fs.readFileSync(IMAGE_PATH);
//         const base64Image = `data:image/png;base64,${imageBuffer.toString("base64")}`;

//         const { error, output } = await model.run(base64Image);

//         if (error) return console.error("❌ MODEL ERROR →", error);
//         console.log(output);  // ← Model result

//     } catch (err) {
//         console.error("Runtime Error:", err);
//     }
// })();












// // test.js
// import Groq from "groq-sdk";
// import fs from "fs";
// import dotenv from "dotenv";
// dotenv.config();

// // ========================
// // USER INPUT — CHANGE HERE
// // ========================
// const IMAGE_PATH = "D:/Deepa/Internship/web app/frontend/Human/53106 manipal_hospitals.jpg";   // Path to submitted image
// const CHALLENGE_DESCRIPTION = `
// Collect three different types of leaves from your surroundings. Choose one leaf and create a detailed pencil drawing of it. Focus on accurately 
// capturing its shape, veins, and edges. Pay attention to light and shadow to give the leaf form. Upload an image of your finished pencil drawing.

// `; // Replace for any challenge
// // ==================================

// const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// // Convert image to Base64
// function encodeImage(path) {
//     return fs.readFileSync(path).toString("base64");
// }

// // Automatic retry with backoff for rate limits
// async function groqRetry(request, retries = 4) {
//     let wait = 700;
//     for (let i = 0; i < retries; i++) {
//         try { return await request(); }
//         catch (err) {
//             if (err.status === 429) {
//                 console.log(`⚠ Rate limit, retrying in ${wait}ms...`);
//                 await new Promise(r => setTimeout(r, wait));
//                 wait *= 2;
//             } else throw err;
//         }
//     }
//     throw new Error("❌ Too many retries");
// }

// async function analyzeSubmission() {
//     try {
//         const imgBase64 = encodeImage(IMAGE_PATH);

//         console.log(`\n📤 Sending for evaluation...\n`);

//         // ===============================
//         // UNIVERSAL MULTI-SKILL PROMPT 🔥
//         // ===============================
//         const prompt = `
// You are a strict evaluator AI. Your job is to verify whether an uploaded image matches a challenge.

// ====================================
// CHALLENGE REQUIREMENTS (User Input)
// ${CHALLENGE_DESCRIPTION}
// ====================================

// EVALUATION STEPS (REQUIRED)
// 1. Identify what type of challenge it is (art / photography / craft / cooking / makeup / performance etc.)
// 2. Extract measurable requirements from description.
// 3. Compare the image with the extracted conditions.
// 4. Score each requirement as 1 (fulfilled) or 0 (not fulfilled).
// 5. Confidence  =  matched_conditions / total_conditions.
// 6. match = true only if confidence ≥ 0.60
// 7. Respond ONLY in JSON — no extra text.

// RETURN FORMAT STRICTLY:

// {
//  "match": true or false,
//  "confidence": number between 0 and 1,
//  "reason": "which conditions were met and which failed"
// }

// If output is not valid JSON → evaluation fails.
//         `;

//         const response = await groqRetry(() =>
//             client.chat.completions.create({
//                 model: "meta-llama/llama-4-scout-17b-16e-instruct",
//                 temperature: 0,
//                 messages: [
//                     { role: "system", content: "You evaluate image-based challenges. Respond only in JSON." },
//                     { role: "user", content: prompt },
//                     {
//                         role: "user",
//                         content: [
//                             { type: "text", text: "Here is the image for evaluation →" },
//                             {
//                                 type: "image_url",
//                                 image_url: { url: `data:image/jpeg;base64,${imgBase64}` }
//                             }
//                         ]
//                     }
//                 ]
//             })
//         );

//         console.log("\n🧠 Evaluation Result:");
//         console.log(response.choices[0].message.content); // Already valid JSON output

//     } catch (err) {
//         console.error("\n❌ ERROR\n", err);
//     }
// }

// analyzeSubmission();













// test.js

// backend/services/challenge_analysis.js — CORRECTED FOR JSON PARSING ERROR

import Groq from "groq-sdk";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

function encodeImage(path) {
    try {
        return fs.readFileSync(path).toString("base64");
    } catch (error) {
        console.error(`❌ Error reading file at path: ${path}`, error.message);
        throw new Error("File read error");
    }
}

async function groqRetry(request, retries = 4) {
    let wait = 700;
    for (let i = 0; i < retries; i++) {
        try { return await request(); }
        catch (err) {
            // Check for rate limiting error status codes or message content
            if (err.status === 429 || (err.message && err.message.includes('429'))) {
                console.log(`⚠ Rate limit, retrying in ${wait}ms... Attempt ${i + 1}/${retries}`);
                await new Promise(r => setTimeout(r, wait));
                wait *= 2;
            } else {
                // For other errors (like invalid API key, model error), throw immediately
                throw err;
            }
        }
    }
    throw new Error("❌ Too many retries");
}

/**
 * @param {string} imagePath - The file path to the submitted image.
 * @param {string} challengeDescription - The detailed requirements for the challenge.
 * @returns {object} The parsed JSON evaluation result from Groq.
 */
export async function analyzeSubmission(imagePath, challengeDescription) {
    try {
        const imgBase64 = encodeImage(imagePath);

        console.log(`\n📤 [Groq Evaluation] Sending evaluation for image: ${imagePath}\n`);


        const prompt = `
You are a strict evaluator AI. Your job is to verify whether an uploaded image matches a challenge.
Your response MUST be valid JSON. Ensure all keys and strings are properly enclosed and comma-separated.

====================================
CHALLENGE REQUIREMENTS (User Input)
${challengeDescription}
====================================

EVALUATION STEPS (REQUIRED)
1. Identify what type of challenge it is (art / photography / craft / cooking / makeup / performance etc.)
2. Extract measurable requirements from description.
3. Compare the image with the extracted conditions.
4. Score each requirement as 1 (fulfilled) or 0 (not fulfilled).
5. Confidence = matched_conditions / total_conditions.
6. match = true only if confidence ≥ 0.60
7. Respond ONLY in JSON — no extra text, no markdown fences (e.g., \`\`\`json).

RETURN FORMAT STRICTLY:

{
 "match": true or false,
 "confidence": number between 0 and 1,
 "reason": "which conditions were met and which failed"
}

If output is not valid JSON → evaluation fails.
        `;

        const response = await groqRetry(() =>
            client.chat.completions.create({
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                temperature: 0,
                messages: [
                    { role: "system", content: "You evaluate image-based challenges. Respond only in JSON format, without any markdown fences." },
                    { role: "user", content: prompt },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Here is the image for evaluation →" },
                            {
                                type: "image_url",
                                image_url: { url: `data:image/jpeg;base64,${imgBase64}` }
                            }
                        ]
                    }
                ]
            })
        );

        const rawContent = response.choices[0].message.content.trim();
        console.log("\n🧠 [Groq Evaluation] Raw Result:", rawContent);


        // --- FIX: Robust JSON Extraction and Parsing ---
        let cleanContent = rawContent;

        // 1. Aggressively strip Markdown fences/wrappers
        if (cleanContent.startsWith("```")) {
            // Find the end of the content after the language tag (e.g., ```json)
            const firstBrace = cleanContent.indexOf('{');
            const lastBrace = cleanContent.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                // Extract everything between the first and last brace
                cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
            } else {
                // If standard extraction fails, try stripping headers/footers
                cleanContent = cleanContent.replace(/```json|```|```/g, '').trim();
            }
        }

        // 2. Parse the (now hopefully clean) JSON string.
        try {
            const parsedResult = JSON.parse(cleanContent);
            console.log("✅ [Groq Evaluation] Parsed JSON successfully.");
            return parsedResult;
        } catch (parseErr) {
            console.error(`\n❌ [Groq Evaluation] Final JSON Parse Failed (Content: ${cleanContent.substring(0, 100)}...):`, parseErr.message);
            // Throw a custom error that is descriptive for the frontend/score calculation
            throw new Error(`Groq failed to return valid JSON: ${parseErr.message}`);
        }

    } catch (err) {
        console.error(`\n❌ [Groq Evaluation] CRITICAL ERROR for ${imagePath}\n`, err.message);
        // Return a structured error response for consistency in Promise.allSettled
        throw new Error(`Groq evaluation failed: ${err.message}`);
    }
}

export default analyzeSubmission;