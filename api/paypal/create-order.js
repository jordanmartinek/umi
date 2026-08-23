const { createOrder } = require('../_lib/paypal');
const { readData } = require('../_lib/db');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'No items provided' });
        }

        // Validate items against actual products (prevent price manipulation)
        const products = readData('products.json');
        const validatedItems = items.map(item => {
            const product = products.find(p => p.name === item.name && p.active);
            if (!product) {
                throw new Error(`Product not found or inactive: ${item.name}`);
            }
            return {
                name: product.name,
                price: product.price,
                quantity: item.quantity || 1,
            };
        });

        const total = validatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const order = await createOrder(validatedItems, total);

        res.status(200).json({
            id: order.id,
            status: order.status,
        });
    } catch (error) {
        console.error('Create order error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to create order' });
    }
};
