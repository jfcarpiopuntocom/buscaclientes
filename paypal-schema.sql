-- PRIVATE fresh D1 database for BuscaClientes ONLY. Never run against friendly-123.
-- Metadata only: intentionally do NOT store full webhook payloads, emails or names.
CREATE TABLE IF NOT EXISTS paypal_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  event_time TEXT NOT NULL,
  received_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS paypal_events_subscription ON paypal_events(subscription_id, event_time);
