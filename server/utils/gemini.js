require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model fallback chain
const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];

// Per-model cooldown: modelName → unblocks-at ms timestamp
const modelCooldown = {};

function getModel(name, jsonMode = false) {
  return genAI.getGenerativeModel({
    model: name,
    generationConfig: jsonMode
      ? { temperature: 0.3, maxOutputTokens: 1024, responseMimeType: 'application/json' }
      : { temperature: 0.7, maxOutputTokens: 1024 },
  });
}

function isModelAvailable(name) {
  return !modelCooldown[name] || Date.now() > modelCooldown[name];
}

function blockModel(name, ms) {
  modelCooldown[name] = Date.now() + ms;
  const secs = Math.round(ms / 1000);
  console.warn(`[Gemini] ${name} blocked for ${secs}s`);
}

function allModelsCoolingDown() {
  const now = Date.now();
  return MODEL_CHAIN.every(m => modelCooldown[m] && now < modelCooldown[m]);
}

function soonestAvailableMs() {
  const now = Date.now();
  const times = MODEL_CHAIN.map(m => Math.max(0, (modelCooldown[m] || 0) - now));
  return Math.min(...times);
}

/**
 * Smart retry with per-model exponential-backoff cooldown.
 * - Short retry delays (< 60s) → per-minute rate limit → block that model briefly, try next
 * - Long retry delays (≥ 60s)  → daily quota exhausted → block model for that duration
 * - If ALL models cooling down  → fail fast with wait-time hint instead of hammering
 */
async function callWithRetry(prompt, jsonMode = false) {
  // Fast-fail if all models are cooling down right now
  if (allModelsCoolingDown()) {
    const waitSec = Math.ceil(soonestAvailableMs() / 1000);
    throw new Error(`AI rate-limited — retry in ~${waitSec}s`);
  }

  for (const modelName of MODEL_CHAIN) {
    if (!isModelAvailable(modelName)) {
      console.log(`[Gemini] Skipping ${modelName} (cooling down)`);
      continue;
    }

    const model = getModel(modelName, jsonMode);
    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      const is429 = err?.status === 429
        || err?.message?.includes('429')
        || err?.message?.includes('quota')
        || err?.message?.includes('RESOURCE_EXHAUSTED');

      if (is429) {
        // Parse suggested retry delay from Google's error JSON
        const retrySecMatch = err?.message?.match(/"retryDelay":"(\d+)s"/);
        const retrySec = retrySecMatch ? parseInt(retrySecMatch[1]) : 15;
        // Add 3s buffer; cap at 5 min for safety
        const blockMs = Math.min((retrySec + 3) * 1000, 5 * 60 * 1000);
        blockModel(modelName, blockMs);
        continue; // try next model immediately
      }

      // Non-quota error (bad request, network, etc.)
      throw err;
    }
  }

  // All models tried, all blocked
  const waitSec = Math.ceil(soonestAvailableMs() / 1000);
  throw new Error(`AI rate-limited — retry in ~${waitSec}s`);
}

async function generateText(prompt) {
  return callWithRetry(prompt, false);
}

async function generateJSON(prompt) {
  const text = await callWithRetry(prompt, true);
  const clean = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(clean);
}

module.exports = { generateText, generateJSON };
