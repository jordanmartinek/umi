const { getAuth } = require('../_lib/auth');

module.exports = (req, res) => {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    res.status(200).json({ authenticated: true });
};
