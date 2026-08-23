const { captureOrder } = require('../_lib/paypal');
const { readData, writeData } = require('../_lib/db');
const crypto = require('crypto');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { orderID, items } = req.body;

        if (!orderID) {
            return res.status(400).json({ error: 'No order ID provided' });
        }

        // Capture the payment
        const captureData = await captureOrder(orderID);

        if (captureData.status === 'COMPLETED') {
            // Save the order to our database
            const orders = readData('orders.json');
            const capture = captureData.purchase_units[0]?.payments?.captures?.[0];

            const newOrder = {
                id: `order_${crypto.randomUUID().slice(0, 8)}`,
                paypalOrderId: orderID,
                paypalCaptureId: capture?.id || null,
                status: 'paid',
                items: items || [],
                total: parseFloat(capture?.amount?.value || 0),
                currency: capture?.amount?.currency_code || 'USD',
                payer: {
                    email: captureData.payer?.email_address || '',
                    name: `${captureData.payer?.name?.given_name || ''} ${captureData.payer?.name?.surname || ''}`.trim(),
                },
                shipping: captureData.purchase_units?.[0]?.shipping || null,
                createdAt: new Date().toISOString(),
                fulfilledAt: null,
            };

            orders.push(newOrder);
            writeData('orders.json', orders);

            res.status(200).json({
                success: true,
                orderId: newOrder.id,
                status: captureData.status,
            });
        } else {
            res.status(400).json({
                success: false,
                status: captureData.status,
                error: 'Payment not completed',
            });
        }
    } catch (error) {
        console.error('Capture order error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to capture order' });
    }
};
