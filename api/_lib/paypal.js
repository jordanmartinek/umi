const https = require('https');

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' or 'live'

const BASE_URL = PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

/**
 * Make an HTTPS request (no external deps)
 */
function httpsRequest(url, options, body) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const reqOptions = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: options.headers || {},
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

/**
 * Get PayPal OAuth2 access token
 */
async function getAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

    const { status, data } = await httpsRequest(`${BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    }, 'grant_type=client_credentials');

    if (status !== 200) {
        throw new Error(`PayPal auth failed: ${JSON.stringify(data)}`);
    }

    return data.access_token;
}

/**
 * Create a PayPal order
 */
async function createOrder(items, total, currency = 'USD') {
    const accessToken = await getAccessToken();

    // Compute the item_total from the line items so the breakdown always
    // reconciles with amount.value — PayPal rejects orders where it doesn't.
    const itemTotal = items.reduce(
        (sum, item) => sum + Number(item.price) * (parseInt(item.quantity, 10) || 1),
        0
    );
    const amountValue = (typeof total === 'number' ? total : itemTotal).toFixed(2);

    const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: currency,
                value: amountValue,
                breakdown: {
                    item_total: {
                        currency_code: currency,
                        value: itemTotal.toFixed(2),
                    }
                }
            },
            items: items.map(item => ({
                name: item.name,
                unit_amount: {
                    currency_code: currency,
                    value: Number(item.price).toFixed(2),
                },
                quantity: String(parseInt(item.quantity, 10) || 1),
            })),
        }],
    };

    const { status, data } = await httpsRequest(`${BASE_URL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    }, JSON.stringify(orderPayload));

    if (status !== 201) {
        throw new Error(`PayPal create order failed: ${JSON.stringify(data)}`);
    }

    return data;
}

/**
 * Capture a PayPal order (after buyer approves)
 */
async function captureOrder(orderId) {
    const accessToken = await getAccessToken();

    const { status, data } = await httpsRequest(`${BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    }, '');

    if (status !== 201 && status !== 200) {
        throw new Error(`PayPal capture failed: ${JSON.stringify(data)}`);
    }

    return data;
}

module.exports = { createOrder, captureOrder, getAccessToken, PAYPAL_CLIENT_ID, PAYPAL_MODE, BASE_URL };
