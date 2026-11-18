-- LifeSavers Elite: initial D1 schema (replaces the Google Sheets tabs).

CREATE TABLE users (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  role                 TEXT NOT NULL CHECK (role IN ('LIFESAVER','AGENT','ADMIN')),
  email                TEXT NOT NULL UNIQUE,
  password_hash        TEXT,
  status               TEXT NOT NULL DEFAULT 'ACTIVE',
  tier                 TEXT,
  assigned_agent_email TEXT,
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE lifesaver_applications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  current_carrier TEXT,
  details_json    TEXT,
  status          TEXT NOT NULL DEFAULT 'NEW'
);

CREATE TABLE agent_applications (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  name              TEXT NOT NULL,
  agency            TEXT,
  email             TEXT NOT NULL,
  phone             TEXT,
  license           TEXT,
  states            TEXT,
  years             TEXT,
  lines             TEXT,
  payout_structure  TEXT,
  hear_about        TEXT,
  payment_method    TEXT,
  status            TEXT NOT NULL DEFAULT 'NEW'
);

CREATE TABLE leads (
  id                TEXT PRIMARY KEY,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  lead_name         TEXT NOT NULL,
  phone             TEXT,
  email             TEXT,
  city              TEXT,
  state             TEXT,
  age               INTEGER,
  beneficiaries     TEXT,
  health_rating     TEXT,
  smoking           TEXT,
  policy_interest   TEXT,
  timeline          TEXT,
  notes             TEXT,
  lifesaver_id      TEXT REFERENCES users(id),
  lifesaver_handle  TEXT,
  status            TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','DECLINED','POOL')),
  star_rating       INTEGER,
  expiry            TEXT,
  lse_fee           REAL,
  pool_source       TEXT
);
CREATE INDEX idx_leads_status_expiry ON leads(status, expiry);

CREATE TABLE transactions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  lead_id       TEXT REFERENCES leads(id),
  agent_id      TEXT REFERENCES users(id),
  type          TEXT NOT NULL,
  amount        REAL NOT NULL,
  lifesaver_id  TEXT REFERENCES users(id),
  source        TEXT
);

-- Every Stripe webhook is stored once (id is Stripe's event id), so retries are harmless.
CREATE TABLE stripe_events (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL,
  received_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  payload      TEXT NOT NULL
);
