---
'@thermal-label/labelmanager-web': patch
---

Drop the hard-coded `STATUS_READ_LENGTH` bulk-IN read padding.

`getStatus()` padded its status read to 64 bytes so Chromium's WebUSB
wouldn't stall on a sub-packet `transferIn`. With `@thermal-label/transport`'s
`WebUsbTransport.read()` now rounding every read up to the IN endpoint's
real `wMaxPacketSize`, that guess is dead weight: `getStatus()` reads the
exact 1-byte D1 status again.

The read also gains a `STATUS_READ_TIMEOUT_MS` deadline — a non-responsive
LabelManager now throws a timeout instead of hanging the `onStatus` poll
loop forever.
