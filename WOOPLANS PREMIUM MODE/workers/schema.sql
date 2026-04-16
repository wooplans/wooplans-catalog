-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  pin_code TEXT UNIQUE NOT NULL,
  is_premium INTEGER DEFAULT 0,
  premium_expires_at TEXT,
  chariow_customer_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  surface REAL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  floors INTEGER DEFAULT 1,
  thumbnail_key TEXT NOT NULL,
  distribution_key TEXT NOT NULL,
  quote_key TEXT NOT NULL,
  full_pdf_key TEXT,
  gallery_3d TEXT DEFAULT '[]',
  price REAL,
  views INTEGER DEFAULT 0,
  is_premium INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Plan orders (WhatsApp)
CREATE TABLE IF NOT EXISTS plan_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  plan_id TEXT REFERENCES plans(id),
  status TEXT DEFAULT 'pending',
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  payment_method TEXT,
  amount REAL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  paid_at TEXT,
  delivered_at TEXT
);

-- Admin sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Index
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_pin ON users(pin_code);
CREATE INDEX IF NOT EXISTS idx_plans_slug ON plans(slug);
CREATE INDEX IF NOT EXISTS idx_plans_category ON plans(category);
CREATE INDEX IF NOT EXISTS idx_orders_status ON plan_orders(status);
