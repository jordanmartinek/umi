/**
 * Gemini vision helper — analyzes a product photo and returns structured
 * catalog fields (name, Spanish name, description, Spanish description,
 * category, emoji, suggested price).
 *
 * Uses the Gemini Developer REST API directly (no SDK dependency, same raw
 * HTTPS style as paypal.js). The API key is read from GEMINI_API_KEY and is
 * never logged or returned to the client.
 */

const https = require('https');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Flash is multimodal, fast, and covered by the free tier — ideal for this.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_HOST = 'generativelanguage.googleapis.com';

function httpsRequest(options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch (e) { resolve({ status: res.statusCode, data }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

/**
 * Pull the first JSON object out of the model's text response. Gemini is asked
 * to return raw JSON, but models sometimes wrap it in ```json fences or add a
 * stray sentence, so we extract defensively.
 */
function extractJson(text) {
    if (!text) return null;
    let t = String(text).trim();
    // Strip ```json ... ``` or ``` ... ``` fences if present.
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) t = fence[1].trim();
    // Otherwise grab from the first { to the last }.
    if (t[0] !== '{') {
        const start = t.indexOf('{');
        const end = t.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);
    }
    try { return JSON.parse(t); } catch (e) { return null; }
}

/**
 * Analyze a product image.
 * @param {string} imageBase64 - base64 (no data: prefix) of the image bytes
 * @param {string} mimeType    - e.g. "image/jpeg", "image/png"
 * @param {string[]} categorySlugs - allowed category slugs to choose from
 * @returns {Promise<object>} structured product fields
 */
async function analyzeProductImage(imageBase64, mimeType, categorySlugs = []) {
    if (!GEMINI_API_KEY) {
        throw new Error(
            'AI is not configured — missing GEMINI_API_KEY. Add it in your ' +
            "Vercel project's Environment Variables and redeploy."
        );
    }

    const categoryHint = categorySlugs.length
        ? `Choose the single best "category" from EXACTLY this list (use the slug verbatim): ${categorySlugs.join(', ')}. If none fit, use "".`
        : 'Leave "category" as "".';

    const promptText =
        'You are a product copywriter for "Umi Umi", an ocean-inspired handmade ' +
        'jewelry and accessories brand (bracelets, pendants, rings, anklets, ' +
        'earrings — beaded, dainty, cheerful). Look at this product photo and ' +
        'produce catalog fields. Respond with ONLY a raw JSON object (no markdown, ' +
        'no commentary) with EXACTLY these keys:\n' +
        '{\n' +
        '  "name": "short catchy English product name (max ~4 words)",\n' +
        '  "name_es": "natural Spanish translation of the name",\n' +
        '  "description": "one warm, concise English sentence (max ~160 chars)",\n' +
        '  "description_es": "natural Spanish translation of the description",\n' +
        '  "category": "a category slug",\n' +
        '  "emoji": "one single emoji that fits the piece",\n' +
        '  "price": a number in USD (no currency symbol), a reasonable retail price for a handmade beaded accessory (typically 18-45)\n' +
        '}\n' +
        categoryHint +
        ' Keep the tone playful and on-brand. Do not invent materials you cannot see.';

    const payload = JSON.stringify({
        contents: [{
            parts: [
                { text: promptText },
                { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } },
            ],
        }],
        generationConfig: {
            temperature: 0.4,
            responseMimeType: 'application/json',
        },
    });

    const options = {
        hostname: GEMINI_HOST,
        path: `/v1beta/models/${GEMINI_MODEL}:generateContent`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Header auth avoids putting the key in the URL/logs.
            'x-goog-api-key': GEMINI_API_KEY,
            'Content-Length': Buffer.byteLength(payload),
        },
    };

    let status, data;
    try {
        ({ status, data } = await httpsRequest(options, payload));
    } catch (e) {
        throw new Error(`Could not reach the AI service: ${e.message}`);
    }

    if (status !== 200) {
        const detail = (data && data.error && data.error.message) || JSON.stringify(data);
        // Surface a clear, non-sensitive message. 400/403 usually = bad/disabled key.
        throw new Error(`AI request failed (${status}): ${detail}`);
    }

    const text = data
        && data.candidates
        && data.candidates[0]
        && data.candidates[0].content
        && data.candidates[0].content.parts
        && data.candidates[0].content.parts[0]
        && data.candidates[0].content.parts[0].text;

    const parsed = extractJson(text);
    if (!parsed) {
        throw new Error('The AI returned an unexpected response. Please try again.');
    }

    // Normalize + clamp into safe, expected shapes.
    const toStr = v => (typeof v === 'string' ? v.trim() : (v == null ? '' : String(v)));
    let price = Number(parsed.price);
    if (!isFinite(price) || price < 0) price = 0;
    price = Math.round(price * 100) / 100;

    return {
        name: toStr(parsed.name),
        name_es: toStr(parsed.name_es),
        description: toStr(parsed.description),
        description_es: toStr(parsed.description_es),
        category: toStr(parsed.category),
        emoji: toStr(parsed.emoji).slice(0, 4),
        price,
    };
}

const isConfigured = !!GEMINI_API_KEY;

module.exports = { analyzeProductImage, isConfigured };
