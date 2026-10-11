-- Shell 016 (draft): PRIVATE additive schema for Personal only.
-- Intended ONLY for new BuscaClientes D1 database 'buscaclientes-paypal-ledger'.
-- NEVER run on friendly-123 D1 or any other existing app.
-- Read before use: SHELL-016-GUTSY-RESEARCH.md
-- Does NOT activate accounts, payments, API authorization or premium quotas.

CREATE TABLE IF NOT EXISTS personal_principals (
  principal_id TEXT PRIMARY KEY,
  identity_provider TEXT NOT NULL CHECK(identity_provider IN ('google_oidc','passkey','email_otp')),
  subject_hash TEXT NOT NULL CHECK(length(subject_hash) = 64),
  created_at TEXT NOT NULL,
  UNIQUE(identity_provider, subject_hash)
);

-- PayPal status MUST be reconciled against PayPal's authenticated API.
-- Never elevate state from a client-provided subscription ID or a redirect URL.
CREATE TABLE IF NOT EXISTS personal_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  principal_id TEXT NOT NULL REFERENCES personal_principals(principal_id),
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','active','suspended','cancelled','expired','refunded','reversed')),
  verified_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS personal_subscriptions_principal
  ON personal_subscriptions(principal_id,status);

-- A PayPal billing cycle is a period established by the server and reconciled
-- with PayPal. Never accept start/end dates from a browser or browser timezone.
CREATE TABLE IF NOT EXISTS personal_billing_cycles (
  cycle_id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES personal_subscriptions(subscription_id),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  CHECK(starts_at < ends_at),
  UNIQUE(subscription_id,starts_at)
);
CREATE INDEX IF NOT EXISTS personal_cycles_subscription
  ON personal_billing_cycles(subscription_id,ends_at);

-- Only opaque HMAC-SHA256 digest of a canonical public contact identifier.
-- No emails, phone numbers, business names, notes, personal records or raw
-- PayPal webhook contents. User's CRM remains in the browser by default.
-- Primary key ensures saving the same contact in a future billing cycle is free.
CREATE TABLE IF NOT EXISTS personal_usage_events (
  principal_id TEXT NOT NULL REFERENCES personal_principals(principal_id),
  contact_key_hash TEXT NOT NULL CHECK(length(contact_key_hash) = 64),
  operation_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL REFERENCES personal_billing_cycles(cycle_id),
  utc_week_start TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  PRIMARY KEY(principal_id,contact_key_hash),
  UNIQUE(principal_id,operation_id)
);
CREATE INDEX IF NOT EXISTS personal_usage_week
  ON personal_usage_events(principal_id,cycle_id,utc_week_start);
CREATE INDEX IF NOT EXISTS personal_usage_cycle
  ON personal_usage_events(principal_id,cycle_id);

-- This is a schema only. Quota checks and INSERT MUST be atomic inside a
-- server-authorized transaction/SQL statement. Never authorize based on
-- plan-policy.mjs from the client, a local flag, or the URL path.
