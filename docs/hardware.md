# Hardware Compatibility

The canonical per-device matrix lives on the org-wide hardware page:
[thermal-label.github.io/hardware/](https://thermal-label.github.io/hardware/).
It's generated from each driver's `data/devices/*.json5` source of truth — for
this driver, those entries live under
[`packages/core/data/devices/`](https://github.com/thermal-label/labelmanager/tree/main/packages/core/data/devices).
Got an untested device? Follow the
[verification checklist](./verification-checklist) and file a hardware
verification issue; the PID, support status, and quirks for that entry land
inline in the JSON5 file.
