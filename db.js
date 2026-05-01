const Database = require('better-sqlite3');

const db = new Database('database.db');

db.prepare(`
CREATE TABLE IF NOT EXISTS users(
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT,
email TEXT UNIQUE,
password TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS sensor_data(
id INTEGER PRIMARY KEY AUTOINCREMENT,
temperature REAL,
humidity REAL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

module.exports = db;