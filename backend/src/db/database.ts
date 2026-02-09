import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';

const dbPath = path.join(__dirname, '../../database.sqlite');
let dbPromise: Promise<Database> | null = null;

function getSqlJsPath(filename: string) {
  return path.join(__dirname, '../../node_modules/sql.js/dist', filename);
}

export async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: getSqlJsPath
      });

      if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        return new SQL.Database(new Uint8Array(fileBuffer));
      }

      return new SQL.Database();
    })();
  }

  return dbPromise;
}

export async function initializeDatabase() {
  const db = await getDb();

  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');

  // Create accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      account_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT NOT NULL,
      segment TEXT NOT NULL
    );
  `);

  // Create reps table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reps (
      rep_id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );
  `);

  // Create deals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS deals (
      deal_id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      rep_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      amount REAL,
      created_at TEXT NOT NULL,
      closed_at TEXT,
      FOREIGN KEY (account_id) REFERENCES accounts(account_id),
      FOREIGN KEY (rep_id) REFERENCES reps(rep_id)
    );
  `);

  // Create activities table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      activity_id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL,
      type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (deal_id) REFERENCES deals(deal_id)
    );
  `);

  // Create targets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS targets (
      month TEXT PRIMARY KEY,
      target REAL NOT NULL
    );
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_deals_closed_at ON deals(closed_at);
    CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
    CREATE INDEX IF NOT EXISTS idx_deals_rep_id ON deals(rep_id);
    CREATE INDEX IF NOT EXISTS idx_deals_account_id ON deals(account_id);
    CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON activities(deal_id);
    CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);
  `);

  console.log('✅ Database schema initialized');
}

export async function saveDbToFile() {
  const db = await getDb();
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export async function queryGet<T>(sql: string, params: Array<string | number | null> = []): Promise<T> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? (stmt.getAsObject() as T) : ({} as T);
  stmt.free();
  return row;
}

export async function queryAll<T>(sql: string, params: Array<string | number | null> = []): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export async function execute(sql: string) {
  const db = await getDb();
  db.exec(sql);
}
