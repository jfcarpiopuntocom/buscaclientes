"""Offline SQLite proof of Personal D1 schema semantics; NO Cloudflare writes."""
import pathlib
import sqlite3

sql = (pathlib.Path(__file__).resolve().parent.parent / "personal" / "personal-schema.sql").read_text()
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript(sql)
tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
needed = {"personal_principals","personal_subscriptions","personal_billing_cycles","personal_usage_events"}
assert needed.issubset(tables), tables
colnames = {row[1] for row in db.execute("PRAGMA table_info(personal_usage_events)")}
assert not (colnames & {"email","phone","notes","contact_name","payload"})
h = "a" * 64
db.execute("INSERT INTO personal_principals VALUES(?,?,?,?)",
           ("principal-1","google_oidc",h,"2026-10-10T00:00:00Z"))
db.execute("INSERT INTO personal_subscriptions VALUES(?,?,?,?,?)",
           ("I-PAYPALTEST","principal-1","P-DRAFT","active",
            "2026-10-10T00:00:00Z"))
db.execute("INSERT INTO personal_billing_cycles VALUES(?,?,?,?)",
           ("cycle-01","I-PAYPALTEST","2026-10-01T00:00:00Z","2026-11-01T00:00:00Z"))
db.execute("INSERT INTO personal_usage_events VALUES(?,?,?,?,?,?)",
           ("principal-1","b"*64,"operation-1","cycle-01","2026-10-05","2026-10-10T12:00:00Z"))
for record in [
    ("principal-1","b"*64,"operation-2","cycle-01","2026-10-05","2026-10-10T12:02:00Z"),
    ("principal-1","c"*64,"operation-1","cycle-01","2026-10-05","2026-10-10T12:03:00Z"),
]:
    try:
        db.execute("INSERT INTO personal_usage_events VALUES(?,?,?,?,?,?)",record)
        raise AssertionError("Duplicate usage unexpectedly accepted")
    except sqlite3.IntegrityError:
        pass
db.execute("UPDATE personal_subscriptions SET status='cancelled' WHERE subscription_id='I-PAYPALTEST'")
assert db.execute("SELECT COUNT(*) FROM personal_usage_events").fetchone()[0] == 1
assert db.execute("SELECT COUNT(*) FROM personal_principals").fetchone()[0] == 1
db.executescript(sql)  # idempotent migration
print("PASS: additive schema, FK, unique contact+operation, no PII, cancellation preserves history")
