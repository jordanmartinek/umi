const { getAuth } = require('../../_lib/auth');
const { readData, writeData } = require('../../_lib/db');

module.exports = (req, res) => {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.query;

    if (req.method === 'PUT') {
        const orders = readData('orders.json');
        const index = orders.findIndex(o => o.id === id);
        if (index === -1) return res.status(404).json({ error: 'Order not found' });

        const { status, fulfilledAt } = req.body || {};
        if (status) orders[index].status = status;
        if (fulfilledAt) orders[index].fulfilledAt = fulfilledAt;

        // Auto-set fulfilled timestamp
        if (status === 'fulfilled' && !orders[index].fulfilledAt) {
            orders[index].fulfilledAt = new Date().toISOString();
        }

        writeData('orders.json', orders);
        return res.status(200).json(orders[index]);
    }

    res.status(405).json({ error: 'Method not allowed' });
};
