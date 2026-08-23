const { getAuth, verifyPassword, hashPassword } = require('../_lib/auth');
const { readSettings, writeSettings } = require('../_lib/db');

module.exports = (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body || {};
    const settings = readSettings();

    if (!verifyPassword(currentPassword || '', settings.adminPassword)) {
        return res.status(401).json({ error: 'Current password is incorrect' });
    }

    settings.adminPassword = hashPassword(newPassword);
    writeSettings(settings);
    res.status(200).json({ success: true });
};
