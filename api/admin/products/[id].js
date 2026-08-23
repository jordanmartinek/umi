const { getAuth } = require('../../_lib/auth');
const { readData, writeData } = require('../../_lib/db');

module.exports = (req, res) => {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.query;

    if (req.method === 'PUT') {
        const products = readData('products.json');
        const index = products.findIndex(p => p.id === id);
        if (index === -1) return res.status(404).json({ error: 'Product not found' });

        const { name, description, price, category, badge, gradient, emoji, active, image } = req.body || {};

        products[index] = {
            ...products[index],
            name: name || products[index].name,
            description: description !== undefined ? description : products[index].description,
            price: price ? parseFloat(price) : products[index].price,
            category: category !== undefined ? category : products[index].category,
            badge: badge !== undefined ? badge : products[index].badge,
            gradient: gradient || products[index].gradient,
            emoji: emoji !== undefined ? emoji : products[index].emoji,
            active: active !== undefined ? (active !== 'false' && active !== false) : products[index].active,
            image: image !== undefined ? image : products[index].image,
        };

        writeData('products.json', products);
        return res.status(200).json(products[index]);
    }

    if (req.method === 'DELETE') {
        let products = readData('products.json');
        if (!products.find(p => p.id === id)) {
            return res.status(404).json({ error: 'Product not found' });
        }
        products = products.filter(p => p.id !== id);
        writeData('products.json', products);
        return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
};
