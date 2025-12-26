// import puppeteer from 'puppeteer-extra';
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// import path from 'path';

// puppeteer.use(StealthPlugin());

// const IMAGE_PATH = path.resolve('D:/Deepa/Internship/web app/frontend/AI/259b9bd0ca40196d5ec155e171bfffe2.jpg');

// async function runDecopyHeadless() {
//     const browser = await puppeteer.launch({
//         headless: 'new',
//         args: [
//             '--no-sandbox',
//             '--disable-setuid-sandbox',
//             '--disable-blink-features=AutomationControlled'
//         ]
//     });

//     const page = await browser.newPage();
//     await page.setViewport({ width: 1280, height: 900 });

//     // Hide webdriver flag (extra safety)
//     await page.evaluateOnNewDocument(() => {
//         Object.defineProperty(navigator, 'webdriver', { get: () => false });
//     });

//     await page.goto('https://decopy.ai/ai-image-detector/', {
//         waitUntil: 'networkidle2'
//     });

//     await page.waitForSelector('input[type="file"]');
//     await page.$eval('input[type="file"]', (el) => el.removeAttribute('multiple'));

//     const input = await page.$('input[type="file"]');
//     await input.uploadFile(IMAGE_PATH);

//     // Artificial human delay
//     await page.waitForTimeout(4000);

//     await page.waitForFunction(() => {
//         const t = document.body.innerText.toLowerCase();
//         return t.includes('ai generated') || t.includes('human') || t.includes('%');
//     }, { timeout: 90000 });

//     const text = await page.evaluate(() => document.body.innerText.toLowerCase());

//     console.log('PAGE TEXT:', text);

//     await browser.close();
// }

// runDecopyHeadless();










import Bytez from "bytez.js";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// --- CONFIGURATION ---
const BYTEZ_API_KEY = process.env.BYTEZ_API_KEY;
const MODEL_NAME = "Ateeqq/ai-vs-human-image-detector";
// --- END CONFIGURATION ---

/**
 * Runs the Bytez AI classification model on a local image file by encoding it to Base64.
 * This function is used as the fallback service in server.js.
 * * @param {string} localImagePath - The absolute path to the uploaded image file passed from server.js.
 * @returns {Promise<{status: 'AI_DETECTED' | 'CLEAN' | 'AUTO_FAILED', score: number, model: string, error?: string}>}
 */
export async function runBytezAiClassification(localImagePath) {
    console.log(`[Bytez AI] Initializing SDK...`);

    // Use the dynamic path passed to the function
    const imagePathToUse = path.resolve(localImagePath);

    // Check for API Key presence (Crucial check)
    if (!BYTEZ_API_KEY) {
        const errorMsg = "BYTEZ_API_KEY is missing from environment variables.";
        console.error(`[Bytez AI] Critical Error: ${errorMsg}`);
        return { status: "AUTO_FAILED", score: 0, model: "Bytez AI", error: errorMsg };
    }

    try {
        // 1. Check file existence and read it into a Buffer
        if (!fs.existsSync(imagePathToUse)) {
            throw new Error(`Local file not found at: ${imagePathToUse}`);
        }

        // Read file contents as a Buffer
        const imageBuffer = fs.readFileSync(imagePathToUse);

        // 2. Convert Buffer to Base64 string
        const base64Image = imageBuffer.toString('base64');

        const sdk = new Bytez(BYTEZ_API_KEY);
        const model = sdk.model(MODEL_NAME);

        console.log(`[Bytez AI] Running model using Base64 encoding for image: ${path.basename(imagePathToUse)}`);

        // 3. Pass Base64 string to model.run()
        const { error, output } = await model.run(base64Image);

        if (error) {
            console.error(`[Bytez AI] API Error: ${error}`);
            return {
                status: "AUTO_FAILED",
                score: 0,
                model: "Bytez AI",
                error: error.message || error.toString()
            };
        }

        // --- PROCESS OUTPUT ---
        const aiPrediction = Array.isArray(output)
            ? output.find(p => p.label && p.label.toLowerCase().includes('ai'))
            : null;

        if (!aiPrediction) {
            console.warn("[Bytez AI] Warning: Could not parse AI score from output.");
            return { status: "AUTO_FAILED", score: 0, model: "Bytez AI", error: "Could not parse expected AI score from output." };
        }

        const aiScore = aiPrediction.score;
        let finalStatus = aiScore > 0.8 ? 'AI_DETECTED' : 'CLEAN';

        return {
            status: finalStatus,
            score: aiScore,
            model: "Bytez AI"
        };

    } catch (e) {
        // This catches file-not-found, API errors, or any critical execution errors.
        console.error(`[Bytez AI] Critical Execution Error: ${e.message}`);
        return {
            status: "AUTO_FAILED",
            score: 0,
            model: "Bytez AI",
            error: `Critical Execution Error: ${e.message}`
        };
    }
}