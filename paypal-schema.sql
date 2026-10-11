-- Apply ONLY to a newly created, dedicated BuscaClientes PayPal D1 database.
CREATE TABLE IF NOT EXISTS paypal_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  received_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS paypal_events_type_time ON paypal_events(event_type, received_at);
