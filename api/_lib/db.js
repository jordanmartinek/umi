const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');

function readData(filename) {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) return [];
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function writeData(filename, data) {
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

function readSettings() {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'settings.json'), 'utf8'));
}

function writeSettings(settings) {
    fs.writeFileSync(path.join(DATA_DIR, 'settings.json'), JSON.stringify(settings, null, 2));
}

module.exports = { readData, writeData, readSettings, writeSettings, DATA_DIR };
