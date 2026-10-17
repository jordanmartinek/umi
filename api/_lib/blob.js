/**
 * Vercel Blob upload helper — stores product photos and returns public URLs.
 *
 * Uses the @vercel/blob SDK's put() (server upload). Authenticated by the
 * BLOB_READ_WRITE_TOKEN env var, which Vercel adds automatically when you
 * create a Blob store and connect it to the project.
 *
 * Server uploads are limited to 4.5 MB per file on Vercel — fine for product
 * photos. The caller validates size and surfaces a friendly message.
 */

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Lazy-require so the app still runs locally without the package/token present.
function getPut() {
    try {
        const { put } = require('@vercel/blob');
        return put;
    } catch (e) {
        return null;
    }
}

const isConfigured = () => !!BLOB_TOKEN;

/**
 * Upload a single image (base64, no data: prefix) and return its public URL.
 * @param {string} base64   image bytes, base64-encoded
 * @param {string} mimeType e.g. "image/jpeg"
 * @param {string} nameHint optional original filename for a nicer path
 */
async function uploadImage(base64, mimeType, nameHint) {
    if (!BLOB_TOKEN) {
        const err = new Error(
            'Image uploads are not configured — add Vercel Blob storage to the ' +
            'project (Vercel → Storage → Blob) and redeploy.'
        );
        err.code = 'BLOB_NOT_CONFIGURED';
        throw err;
    }
    const put = getPut();
    if (!put) {
        const err = new Error('Image upload library is unavailable. Run npm install and redeploy.');
        err.code = 'BLOB_NOT_CONFIGURED';
        throw err;
    }

    const buffer = Buffer.from(base64, 'base64');

    // Guard the 4.5 MB server-upload limit with a clear message.
    if (buffer.length > 4.3 * 1024 * 1024) {
        const err = new Error('That image is too large (max ~4 MB). Please use a smaller photo.');
        err.code = 'BLOB_TOO_LARGE';
        throw err;
    }

    const ext = (mimeType && mimeType.split('/')[1]) || 'jpg';
    const safeHint = String(nameHint || 'photo').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 40) || 'photo';
    const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeHint}.${ext}`;

    const result = await put(key, buffer, {
        access: 'public',
        contentType: mimeType || 'image/jpeg',
        token: BLOB_TOKEN,
    });
    return result.url;
}

module.exports = { uploadImage, isConfigured };
