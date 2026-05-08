---
'@thermal-label/labelmanager-core': minor
---

Wire the ESC C tape-type selector and gate ESC E on autocut.

`buildPrinterStream` now derives the `ESC C n` byte from the
user-selected media's `text` / `background` colours via a new
`tapeTypeFor()` helper (LW 400 Series Tech Ref p.24 table — same
table the firmware uses on every D1 chassis). LabelManager firmware
can detect cassette **presence** but not **type**, so the host has
to declare what's loaded; the previous hardcoded `0` was a missing
declaration, harmless on black-on-white cassettes but noticeably
worse heat calibration on coloured / reverse-print substrates. When
no media (or media without `text`/`background`) is passed, `n` falls
back to `0` — same byte the encoder emitted before. Override via
`LabelManagerPrintOptions.tapeType` when bench-testing a specific
selector.

`ESC E` (cut) is now emitted before the trailing `ESC A` per copy on
engines declaring `capabilities.autocut: true`. No catalogued
LabelManager chassis sets this today (every entry is a manual-cutter
chassis), so wire output for current devices is unchanged. The gate
matters for the future shared d1-tape encoder — the LabelWriter Duo's
tape engine declares `autocut` and needs the cut to run between
copies.

Raster width resolution now prefers `media.printableDots` (the
per-cartridge constraint) over the `options.tapeWidth` lookup, and
caps at `engine.headDots`. For LM media the values coincide
(32 / 48 / 64 / 64) so wire output is unchanged; the change is the
abstraction that lets the encoder run cleanly against future heads
with different dot counts.

`buildPrinterStream`'s 4th arg type narrows from contracts
`MediaDescriptor` to `LabelManagerMedia` — every adapter call site
already passes `LabelManagerMedia`, no behaviour change.
