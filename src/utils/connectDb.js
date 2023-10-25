const sqlite3 = require('sqlite3').verbose();

require('dotenv').config();
const path = require('path');

if (!process.env.DATABASE_URL) {
  throw new Error('DB_PATH environment variable is not set');
}
// If you want to use a particular database file in the parent directory, you can do this:
const dbPath = path.resolve(process.env.DATABASE_URL, 'test.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err.message);
  } else {
    console.log('Connected to database');
  }
});

db.serialize(() => {
  // Create addresses table
  db.run(
    `CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT UNIQUE
    );`,
    (err) => {
      if (err) {
        console.error('Could not create addresses table', err.message);
      }
    },
  );

  // Create loans table
  db.run(
    `CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id TEXT UNIQUE,
      address_id TEXT,
      loan_duration INTEGER,
      loan_start_time INTEGER,
      nft_contract TEXT,
      nft_id TEXT,
      loan_amount BIGINT,
      loan_currency TEXT,
      loan_repay_amount BIGINT,
      loan_active BOOL,
      loan_foreclosed BOOL,
      loan_actual_repaid BIGINT,
      FOREIGN KEY (address_id) REFERENCES addresses(address)
    );`,
    (err) => {
      if (err) {
        console.error('Could not create loans table', err.message);
      }
    },
  );
});

module.exports = db;
