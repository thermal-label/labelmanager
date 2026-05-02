---
'@thermal-label/labelmanager-core': major
'@thermal-label/labelmanager-node': major
'@thermal-label/labelmanager-web': major
---

Migrate to the contracts 0.3 device & media shape.

- `DEVICES` now ships entries conforming to the contracts `DeviceEntry`
  shape (`transports` keyed object, required `engines[]`, inline
  `support` block). The previous flat `vid`/`pid`/`supportedTapes`/`experimental`
  fields are gone — read VID/PID from `device.transports.usb`, tape
  compatibility from the engine's `mediaCompatibility` and
  `MediaDescriptor.targetModels`, and verification status from `support.status`.
- Registry keys renamed to the contracts-style short form
  (`LABELMANAGER_PNP` → `LM_PNP`, etc.).
- Source of truth moved to per-device JSON5 under
  `packages/core/data/devices/` plus `packages/core/data/media.json5`.
  `scripts/compile-data.mjs` aggregates them at build time into
  `data/devices.json` (published artifact) and matching generated TS
  modules consumed by the runtime.
- PID corrections: `LM_PC` `0x1002` → `0x0011` (was a copy-paste from
  the PnP entry); `LABELPOINT_350` `0x1003` → `0x0015` (was the LM 420P
  mass-storage decoy).
- New entries: `LM_280` (`0x1006`) and `LM_400` (`0x0013`), both at
  `support.status: 'untested'`.
- `MOBILE_LABELER` now lands at `support.status: 'broken'` (labelle
  reports no success driving it over USB).
- `docs/hardware-status.yaml` removed — verification reports fold inline
  into each device's `support` block. `docs/hardware.md` reduced to a
  pointer to the org-wide hardware page.
- `validate-hardware-status.mjs` rewritten to validate the entire
  `DeviceEntry` shape against the contracts conventions; runs on the
  JSON5 sources directly.
- `DEFAULT_FILTERS` in `@thermal-label/labelmanager-web` and
  `@thermal-label/labelmanager-node` now derives WebUSB filters from
  `transports.usb` instead of via the (still-on-0.2) shared
  `buildUsbFilters` helper from `@thermal-label/transport`.
- D1 cartridge registry expanded from 4 generic per-width entries to
  21 SKU-keyed entries (every 6/9/12/19 mm cartridge from the
  labelwriter D1 worksheet). Each entry carries its `skus[]`, `material`
  (`standard` / `permanent-polyester` / `flexible-nylon` / `durable`),
  and named `text` / `background` colours for picker UX. The 24 mm
  entries are deferred — the rasterizer caps at 64 head dots and
  cannot drive them today. The four-key `MEDIA.TAPE_*MM` shape is
  replaced by top-level `TAPE_6MM` / `TAPE_9MM` / `TAPE_12MM` /
  `TAPE_19MM` constants (each pointing at the canonical Black-on-White
  cartridge for that width); the full id-keyed registry lives on
  `MEDIA[id]` and `MEDIA_LIST[]`.
