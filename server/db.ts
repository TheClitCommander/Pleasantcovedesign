import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

// Use SQLite for easy local development
const sqlite = new Database('websitewizard.db');
export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
const createTables = () => {
  // Create businesses table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      business_type TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'scraped',
      website TEXT,
      notes TEXT DEFAULT '',
      score INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'medium',
      tags TEXT,
      last_contact_date DATETIME,
      scheduled_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create campaigns table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      business_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      total_contacts INTEGER NOT NULL DEFAULT 0,
      sent_count INTEGER NOT NULL DEFAULT 0,
      response_count INTEGER NOT NULL DEFAULT 0,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create activities table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      business_id INTEGER REFERENCES businesses(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create templates table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      business_type TEXT NOT NULL,
      description TEXT NOT NULL,
      usage_count INTEGER NOT NULL DEFAULT 0,
      preview_url TEXT,
      features TEXT
    )
  `);

  // Create availability_config table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS availability_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create blocked_dates table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS blocked_dates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// Initialize tables
createTables();

// Add scheduled_time column if it doesn't exist
try {
  sqlite.exec(`ALTER TABLE businesses ADD COLUMN scheduled_time DATETIME`);
} catch (e) {
  // Column already exists
}

// Add appointmentStatus column if it doesn't exist
try {
  sqlite.exec(`ALTER TABLE businesses ADD COLUMN appointment_status TEXT DEFAULT 'confirmed'`);
} catch (e) {
  // Column already exists
}

console.log('✅ SQLite database initialized at websitewizard.db');

// For compatibility with existing code
export const pool = { query: () => { throw new Error('Use db instead of pool'); } };