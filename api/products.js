const { readData } = require('./_lib/db');

module.exports = (req, res) => {
    const products = readData('products.json').filter(p => p.active);
    res.status(200).json(products);
};
