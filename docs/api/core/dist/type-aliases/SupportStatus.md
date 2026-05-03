[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / SupportStatus

# Type Alias: SupportStatus

> **SupportStatus** = `"verified"` \| `"partial"` \| `"broken"` \| `"untested"`

Verification status for a device, transport, or engine.

- `'verified'` — known-good against a recent reporter.
- `'partial'` — works for some operations / paths but not all.
- `'broken'` — known-broken; do not promise support.
- `'untested'` — no accepted report yet.
