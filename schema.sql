-- SQLite schema for Cloudflare D1 / Local SQLite

CREATE TABLE IF NOT EXISTS polls (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed', 'draft'
  closes_label TEXT NOT NULL DEFAULT 'Closes today 7:00 PM',
  started_by TEXT DEFAULT 'You',
  subtitle TEXT,
  winner TEXT,
  is_tied INTEGER NOT NULL DEFAULT 0,
  allow_suggestions INTEGER NOT NULL DEFAULT 1,
  show_live_results INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS poll_options (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL,
  t TEXT NOT NULL, -- title/text
  by TEXT, -- suggested by
  v INTEGER NOT NULL DEFAULT 0, -- vote count
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(poll_id, voter_id),
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE
);

-- Seed initial polls
INSERT OR IGNORE INTO polls (id, question, status, closes_label, started_by, subtitle)
VALUES 
  ('pizza-night', 'Pizza night: what are we ordering?', 'open', 'Closes today 7:00 PM', 'Reubenson', '11 of your crew voted · last one 2 min ago'),
  ('birthday-trip', 'Where do we go for Dami’s birthday?', 'open', 'Closes Friday 9:00 PM', 'Christian', '6 votes · neck and neck'),
  ('movie-night', 'Movie night pick', 'draft', 'Draft', 'Christian', 'No options yet. Add a few to get started.');

INSERT OR IGNORE INTO poll_options (id, poll_id, t, by, v)
VALUES
  ('opt-1', 'pizza-night', 'Detroit-style from Emmy’s', 'Priya', 5),
  ('opt-2', 'pizza-night', 'Pepperoni from Slice House', NULL, 3),
  ('opt-3', 'pizza-night', 'Veggie supreme from Nino’s', 'Jonah', 2),
  ('opt-4', 'pizza-night', 'Margherita from Lupa', NULL, 1),
  ('opt-b1', 'birthday-trip', 'Karaoke at Boombox', NULL, 3),
  ('opt-b2', 'birthday-trip', 'Arcade & bowling at Lane7', NULL, 3);
