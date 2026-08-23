const { verifyPassword, createToken } = require('../_lib/auth');
const { readSettings } = require('../_lib/db');

module.exports = (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { password } = req.body || {};
    const settings = readSettings();

    if (!verifyPassword(password || '', settings.adminPassword)) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    const token = createToken({ role: 'admin' });
    res.setHeader('Set-Cookie', `umi_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);
    res.status(200).json({ success: true });
};
