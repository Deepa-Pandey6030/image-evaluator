
// // reverse_image_search.js
// import puppeteer from "puppeteer-extra";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";
// import axios from "axios";
// import imghash from "imghash";
// import * as cheerio from "cheerio";
// import UserAgent from "user-agents";
// import { HttpsProxyAgent } from "https-proxy-agent";
// import fs from "fs";
// import path from "path";

// puppeteer.use(StealthPlugin());

// // ----------------------------------------------------
// // ✅ RESOLVE SYSTEM CHROME (CACHE-INDEPENDENT FIX)
// // ----------------------------------------------------
// const chromeCandidates = [
//     "C:/Program Files/Google/Chrome/Application/chrome.exe",
//     "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
//     path.join(process.env.LOCALAPPDATA || "", "Google/Chrome/Application/chrome.exe"),
// ];

// const executablePath = chromeCandidates.find(p => fs.existsSync(p));

// if (!executablePath) {
//     throw new Error("❌ Chrome not found on system. Please install Google Chrome.");
// }

// console.log("✅ Puppeteer will use Chrome at:", executablePath);

// // ----------------------------------------------------
// // 🌐 GLOBAL BROWSER SINGLETON
// // ----------------------------------------------------
// let browserInstance = null;

// async function getBrowser() {
//     if (!browserInstance || !browserInstance.isConnected()) {
//         console.log("🌐 Launching new Singleton Browser instance...");
//         browserInstance = await puppeteer.launch({
//             headless: "new",
//             executablePath,   // 🔥 CRITICAL FIX
//             args: [
//                 "--no-sandbox",
//                 "--disable-setuid-sandbox",
//                 "--disable-blink-features=AutomationControlled",
//                 "--disable-dev-shm-usage",
//                 "--disable-gpu",
//             ],
//         });
//     }
//     return browserInstance;
// }

// // ----------------------------------------------------
// // P H A S H   &   S I M I L A R I T Y   H E L P E R S
// // ----------------------------------------------------
// export async function computePhash(filePath) {
//     return await imghash.hash(filePath, 16);
// }

// function hammingDistance(hash1, hash2) {
//     let dist = 0;
//     for (let i = 0; i < hash1.length; i++) {
//         if (hash1[i] !== hash2[i]) dist++;
//     }
//     return dist;
// }

// function matchDecision(similarity) {
//     if (similarity >= 90) return { match: "YES — Strong Match", reason: "Almost identical image found" };
//     if (similarity >= 70) return { match: "YES — Moderate Match", reason: "High visual similarity" };
//     if (similarity >= 50) return { match: "POSSIBLE MATCH", reason: "Some visual similarity but not exact" };
//     return { match: "NO — Not a match", reason: "Similarity too low" };
// }

// // ----------------------------------------------------
// // P R O X Y   F E T C H E R
// // ----------------------------------------------------
// async function getFreshEliteProxy() {
//     try {
//         console.log("🔄 Fetching fresh elite proxies from free-proxy-list.net...");
//         const { data } = await axios.get("https://free-proxy-list.net/");
//         const $ = cheerio.load(data);
//         const proxies = [];

//         $("table.table-striped tbody tr").each((i, el) => {
//             const tds = $(el).find("td");
//             if ($(tds[4]).text().includes("elite") && $(tds[6]).text() === "yes") {
//                 proxies.push(`http://${$(tds[0]).text()}:${$(tds[1]).text()}`);
//             }
//         });

//         return proxies.length ? proxies[Math.floor(Math.random() * proxies.length)] : null;
//     } catch (err) {
//         console.error("❌ Failed to fetch proxies:", err.message);
//         return null;
//     }
// }

// // ----------------------------------------------------
// // Y A N D E X   R E V E R S E   S E A R C H
// // ----------------------------------------------------
// export async function yandexReverseSearch(filePath, queryPhash, useProxy = false, attempt = 1) {
//     const maxRetries = 3;
//     let context = null;
//     let page = null;
//     let currentProxy = null;
//     let targetBrowser = null;
//     let isTemporaryBrowser = false;

//     try {
//         const singletonBrowser = await getBrowser();
//         const ua = new UserAgent({ deviceCategory: "desktop" }).toString();

//         if (useProxy) {
//             currentProxy = await getFreshEliteProxy();
//             console.log(`\n🌐 Attempt ${attempt}: Using Proxy -> ${currentProxy}`);

//             targetBrowser = await puppeteer.launch({
//                 headless: "new",
//                 executablePath,   // 🔥 SAME FIX FOR PROXY BROWSER
//                 args: [
//                     "--no-sandbox",
//                     `--proxy-server=${currentProxy}`,
//                     "--disable-blink-features=AutomationControlled",
//                 ],
//             });
//             isTemporaryBrowser = true;
//         } else {
//             console.log(`\n🏠 Attempt ${attempt}: Using Local IP address`);
//             targetBrowser = singletonBrowser;
//         }

//         context = await targetBrowser.createBrowserContext();
//         page = await context.newPage();

//         await page.setUserAgent(ua);
//         await page.setViewport({ width: 1366, height: 768 });

//         await page.goto("https://yandex.com/images/", {
//             waitUntil: "networkidle2",
//             timeout: useProxy ? 60000 : 35000,
//         });

//         const isBlocked = await page.evaluate(() => {
//             return document.body.innerText.includes("Captcha") ||
//                 !!document.querySelector(".CheckboxCaptcha") ||
//                 document.body.innerText.includes("unusual traffic");
//         });

//         if (isBlocked) throw new Error("Blocked by Anti-Bot system");

//         await page.evaluate(() => {
//             document.querySelectorAll("input[type='file']").forEach(el => el.style.display = "block");
//         });

//         const fileInput = await page.waitForSelector("input[type=file]", { timeout: 15000 });
//         await fileInput.uploadFile(filePath);
//         console.log("📤 Image uploaded to Yandex.");

//         await page.waitForSelector(".CbirSites-Item", { timeout: 40000 });

//         const rawResults = await page.evaluate(() => {
//             const items = Array.from(document.querySelectorAll(".CbirSites-Item"));
//             return items.slice(0, 6).map(item => ({
//                 thumb: item.querySelector("img")?.src || item.querySelector("img")?.getAttribute("data-src"),
//                 pageUrl: item.querySelector("a")?.href,
//                 title: item.querySelector(".CbirSites-ItemTitle")?.innerText || "",
//             }));
//         });

//         await page.close();
//         await context.close();
//         if (isTemporaryBrowser && targetBrowser) await targetBrowser.close();

//         const finalOutput = [];
//         const axiosConfig = { responseType: "arraybuffer", timeout: 10000 };

//         if (useProxy && currentProxy) {
//             axiosConfig.httpsAgent = new HttpsProxyAgent(currentProxy);
//         }

//         for (let r of rawResults) {
//             if (!r.thumb || !r.thumb.startsWith("http")) continue;
//             try {
//                 const img = await axios.get(r.thumb, axiosConfig);
//                 const ph = await computePhash(Buffer.from(img.data));
//                 const dist = hammingDistance(queryPhash, ph);
//                 const similarity = 100 - (dist / 64) * 100;
//                 const { match, reason } = matchDecision(similarity);

//                 finalOutput.push({
//                     ...r,
//                     phash: ph,
//                     similarity: parseFloat(similarity.toFixed(2)),
//                     match,
//                     reason,
//                 });
//             } catch (err) {
//                 console.warn(`⚠️ Thumbnail Fetch Error: ${err.message}`);
//             }
//         }

//         finalOutput.sort((a, b) => b.similarity - a.similarity);
//         return { yandexResults: finalOutput, status: "SEARCH_COMPLETE" };

//     } catch (err) {
//         console.error(`❌ Attempt ${attempt} failed:`, err.message);

//         if (page) try { await page.close(); } catch {}
//         if (context) try { await context.close(); } catch {}
//         if (isTemporaryBrowser && targetBrowser) try { await targetBrowser.close(); } catch {}

//         if (attempt < maxRetries) {
//             console.log("🔄 Escalating to Proxy retry...");
//             return await yandexReverseSearch(filePath, queryPhash, true, attempt + 1);
//         }

//         return { yandexResults: [], status: "SEARCH_FAILED", error: err.message };
//     }
// }

















// reverse_image_search.js
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import axios from "axios";
import imghash from "imghash";
import * as cheerio from "cheerio";
import UserAgent from "user-agents";
import { HttpsProxyAgent } from "https-proxy-agent";
import fs from "fs";
import path from "path";

puppeteer.use(StealthPlugin());

// ----------------------------------------------------
// ✅ CHROME / CHROMIUM RESOLUTION (DOCKER + LOCAL SAFE)
// ----------------------------------------------------
const executablePath =
  process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

console.log(
  "✅ Puppeteer executable:",
  executablePath || "bundled / default"
);

// ----------------------------------------------------
// 🌐 GLOBAL BROWSER SINGLETON
// ----------------------------------------------------
let browserInstance = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log("🌐 Launching new Singleton Browser instance...");

    browserInstance = await puppeteer.launch({
      headless: "new",
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }
  return browserInstance;
}

// ----------------------------------------------------
// P H A S H   &   S I M I L A R I T Y
// ----------------------------------------------------
export async function computePhash(filePathOrBuffer) {
  return await imghash.hash(filePathOrBuffer, 16);
}

function hammingDistance(hash1, hash2) {
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
}

function matchDecision(similarity) {
  if (similarity >= 90)
    return { match: "YES — Strong Match", reason: "Almost identical image found" };
  if (similarity >= 70)
    return { match: "YES — Moderate Match", reason: "High visual similarity" };
  if (similarity >= 50)
    return { match: "POSSIBLE MATCH", reason: "Some visual similarity but not exact" };
  return { match: "NO — Not a match", reason: "Similarity too low" };
}

// ----------------------------------------------------
// 🌐 PROXY FETCHER
// ----------------------------------------------------
async function getFreshEliteProxy() {
  try {
    console.log("🔄 Fetching fresh elite proxies...");
    const { data } = await axios.get("https://free-proxy-list.net/");
    const $ = cheerio.load(data);
    const proxies = [];

    $("table.table-striped tbody tr").each((_, el) => {
      const tds = $(el).find("td");
      if ($(tds[4]).text().includes("elite") && $(tds[6]).text() === "yes") {
        proxies.push(`http://${$(tds[0]).text()}:${$(tds[1]).text()}`);
      }
    });

    return proxies.length
      ? proxies[Math.floor(Math.random() * proxies.length)]
      : null;
  } catch (err) {
    console.error("❌ Proxy fetch failed:", err.message);
    return null;
  }
}

// ----------------------------------------------------
// 🔍 YANDEX REVERSE IMAGE SEARCH
// ----------------------------------------------------
export async function yandexReverseSearch(
  filePath,
  queryPhash,
  useProxy = false,
  attempt = 1
) {
  const maxRetries = 3;
  let context = null;
  let page = null;
  let targetBrowser = null;
  let isTempBrowser = false;
  let proxy = null;

  try {
    const ua = new UserAgent({ deviceCategory: "desktop" }).toString();

    if (useProxy) {
      proxy = await getFreshEliteProxy();
      console.log(`🌐 Proxy attempt ${attempt}: ${proxy}`);

      targetBrowser = await puppeteer.launch({
        headless: "new",
        executablePath,
        args: [
          "--no-sandbox",
          `--proxy-server=${proxy}`,
          "--disable-blink-features=AutomationControlled",
        ],
      });

      isTempBrowser = true;
    } else {
      console.log(`🏠 Attempt ${attempt}: Local IP`);
      targetBrowser = await getBrowser();
    }

    context = await targetBrowser.createBrowserContext();
    page = await context.newPage();

    await page.setUserAgent(ua);
    await page.setViewport({ width: 1366, height: 768 });

    await page.goto("https://yandex.com/images/", {
      waitUntil: "networkidle2",
      timeout: useProxy ? 60000 : 35000,
    });

    const isBlocked = await page.evaluate(() => {
      return (
        document.body.innerText.includes("Captcha") ||
        document.body.innerText.includes("unusual traffic")
      );
    });

    if (isBlocked) throw new Error("Blocked by Yandex anti-bot");

    await page.evaluate(() => {
      document
        .querySelectorAll("input[type='file']")
        .forEach(el => (el.style.display = "block"));
    });

    const input = await page.waitForSelector("input[type=file]", {
      timeout: 15000,
    });
    await input.uploadFile(filePath);
    console.log("📤 Image uploaded");

    await page.waitForSelector(".CbirSites-Item", { timeout: 40000 });

    const rawResults = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".CbirSites-Item"))
        .slice(0, 6)
        .map(item => ({
          thumb:
            item.querySelector("img")?.src ||
            item.querySelector("img")?.getAttribute("data-src"),
          pageUrl: item.querySelector("a")?.href,
          title:
            item.querySelector(".CbirSites-ItemTitle")?.innerText || "",
        }));
    });

    await page.close();
    await context.close();
    if (isTempBrowser) await targetBrowser.close();

    const results = [];
    const axiosConfig = { responseType: "arraybuffer", timeout: 10000 };
    if (proxy) axiosConfig.httpsAgent = new HttpsProxyAgent(proxy);

    for (const r of rawResults) {
      if (!r.thumb?.startsWith("http")) continue;
      try {
        const img = await axios.get(r.thumb, axiosConfig);
        const ph = await computePhash(Buffer.from(img.data));
        const dist = hammingDistance(queryPhash, ph);
        const similarity = 100 - (dist / 64) * 100;
        const verdict = matchDecision(similarity);

        results.push({
          ...r,
          phash: ph,
          similarity: Number(similarity.toFixed(2)),
          ...verdict,
        });
      } catch {
        // ignore thumb failures
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return { yandexResults: results, status: "SEARCH_COMPLETE" };

  } catch (err) {
    console.error(`❌ Attempt ${attempt} failed:`, err.message);

    try { if (page) await page.close(); } catch {}
    try { if (context) await context.close(); } catch {}
    try { if (isTempBrowser && targetBrowser) await targetBrowser.close(); } catch {}

    if (attempt < maxRetries) {
      return await yandexReverseSearch(filePath, queryPhash, true, attempt + 1);
    }

    return { yandexResults: [], status: "SEARCH_FAILED", error: err.message };
  }
}
