---
'@thermal-label/labelmanager-core': major
'@thermal-label/labelmanager-node': major
'@thermal-label/labelmanager-web': major
---

D1 protocol audit: trim the encoder to one path, scrub hallucinated opcodes from docs.

Bench-validated 2026-05-08 against a connected LabelManager PnP. Several long-standing claims about the D1 wire protocol turned out to be invented or mis-attributed; this release brings the encoder and the docs back in line with what labelle and the firmware actually do.

**Breaking — `@thermal-label/labelmanager-core` public API removals.** The HID-style report-framing path is gone; `buildPrinterStream` is the only encoder entry point. The driver shipped both shapes from day one based on a misreading of upstream prior art, but the device only ever needed one contiguous byte stream — chunking is a transport concern (the node and web printers already chunk to `wMaxPacketSize`). Removed exports:

- `encodeLabel` — emitted `ESC @` (`1B 40`) as the first byte. ESC @ is **not** a D1 opcode; it corrupts the firmware parser and the device prints garbage until power-cycled. Cribbed from generic ESC/POS receipt-printer convention. Dangerous to keep around.
- `buildResetSequence` — emitted `ESC @` (poison) plus `ESC e` density (never bench-validated, not in labelle's vocabulary).
- `buildBitmapRows` — built 64-byte HID-shaped reports for an output shape the device doesn't require.
- `buildFormFeed` — emitted `ESC G` as a "form-feed / advance"; bench-tested no-op on D1 firmware in every form (single, repeated, count-byte).

**Breaking — `LabelManagerPrintOptions.density` field removed.** Was only consumed by the deleted `buildResetSequence`; never reached the wire on the bulk-stream path. `density: 'high' | 'normal'` callers should drop the option — firmware defaults are correct for canonical D1 cassettes.

**MLF skip-lines for tape advance.** `forcedTrailingFeedMm` (and `printableArea.leading`) now emit as `ESC D 0 + N × SYN` — the MLF skip-line pattern from labelle's `_skip_lines` helper. Bare `0x16` bytes feed one dot row each with no payload, so 16 mm of trailing advance costs 113 bytes instead of the previous 113 × 9 = 1017 bytes of padded blank rows. Same physical advance, ~9× lighter on the wire. The `padBitmap`-based trailing-pad approach is gone.

**Doc accuracy pass.** `docs/protocol.md` rewritten to drop a layer of hallucinated opcodes and mis-attributed transport claims:

- The complete D1 vocabulary is `ESC A` through `ESC E` plus `SYN`. Anything else is unrecognised; some unrecognised opcodes (notably `ESC @`) corrupt the parser. Sections describing `ESC @`, `ESC G`, and `ESC e` removed.
- `ESC A` description fixed: it's a status query — does **not** cut, advance, or flush. Earlier docs claimed it triggered the cutter on D1 hardware; that was wrong.
- HID interface (Interface 2, interrupt EP 1 OUT) is documented as a viable alternative transport. The earlier "writes to HID poison the device" claim was a misattribution: the poison was the `ESC @` opcode, not the HID transport. With a clean labelle-compatible byte stream, the HID interface prints D1 data correctly. The driver still defaults to Printer Class (IF 0, EP 5 OUT) because no kernel-driver detach is needed and the udev story is conventional.
- "LabelWriter Duo divergence" callout removed. The D1 protocol is shared between LabelManager and LabelWriter Duo; the only known divergence is the status reply length on Duo (longer, with additional cassette fields).
- `docs/core.md` "Why we don't use the HID interface" section replaced with the bench-validated story.

**LabelManager 280 back in scope.** `HARDWARE.md` previously claimed LM 280 was "out of scope" — leftover from the HID-required era. LM 280 has been in `data/devices/LM_280.json5` (status `untested`) and the data-driven `docs/hardware.md` table all along; the hand-maintained matrix in `HARDWARE.md` is now consistent.

**README + udev doc-rot scrub.** Drops "USB HID" / "WebHID" / "HID command set" framing across `HARDWARE.md`, the per-package `README.md` files, and `udev.ts` rule headers. The `hidraw` udev rule itself stays — it grants access to the HID interface, which is now a documented alternative transport.

**Bench scripts** (`scripts/compare-advance.mjs`, `scripts/test-hid-clean.mjs`) committed alongside as reproducible verifications: `compare-advance.mjs` validates the bitmap-pad → MLF skip-lines refactor produces equivalent strips on a connected printer; `test-hid-clean.mjs` ships a labelle-compatible stream over the HID interrupt OUT to confirm the transport works.
