-- The owner is not in this table: the owner's code is the OWNER_CODE secret.
CREATE TABLE people (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  can_delete INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  image TEXT
);
-- Each person has their own counts, so the ranking differs per person.
CREATE TABLE stats (
  person TEXT NOT NULL,
  card TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (person, card)
) WITHOUT ROWID;
CREATE INDEX stats_card ON stats (card);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
