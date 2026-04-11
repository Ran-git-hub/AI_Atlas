import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

const DB_DIR = path.join(process.cwd(), "data")
const DB_PATH = path.join(DB_DIR, "weekly-reports.db")

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
  }

  _db = new Database(DB_PATH)
  _db.pragma("journal_mode = WAL")
  _db.pragma("foreign_keys = ON")

  initSchema(_db)

  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS weekly_reports (
      id TEXT PRIMARY KEY,
      week_start TEXT NOT NULL,
      week_end TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      related_case_ids TEXT NOT NULL DEFAULT '[]',
      new_use_cases_count INTEGER NOT NULL DEFAULT 0,
      new_companies_count INTEGER NOT NULL DEFAULT 0,
      countries_count INTEGER NOT NULL DEFAULT 0,
      industries_count INTEGER NOT NULL DEFAULT 0,
      data_sources TEXT NOT NULL DEFAULT '{}',
      published_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_reports_week_start ON weekly_reports(week_start);
    CREATE INDEX IF NOT EXISTS idx_weekly_reports_published_at ON weekly_reports(published_at DESC);
  `)
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function nowString(): string {
  return new Date().toISOString()
}
