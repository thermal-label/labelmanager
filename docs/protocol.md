# D1 Tape Protocol

This page documents the wire protocol of DYMO LabelManager / LabelPoint
D1-tape printers (`engine.protocol === 'd1-tape'`). It is written for
developers porting the driver to new languages, debugging hardware
issues, or extending the package.

::: tip Related pages
- [Core](./core) — TypeScript API (`buildPrinterStream`, `parseStatus`,
  …) that generates the byte streams described here.
- [Hardware](./hardware) — supported devices, USB IDs, tape widths.
:::

::: info Cousin protocol
The DYMO LabelWriter Duo's tape engine uses a closely related variant
(SYN-row framing, the same `ESC C` / `ESC D` opcodes) but diverges on
the cut command and the status reply shape. See
[LabelWriter Duo tape protocol](https://thermal-label.github.io/labelwriter/protocol/duo-tape).
:::

## USB topology

All supported devices share Vendor ID **`0x0922`** (DYMO-CoStar Corp.).
After mode-switch (see below), each enumerates as a composite USB
device with a Printer-class interface:

```
Configuration 1
  Interface 0  —  Printer class  (bInterfaceClass 0x07)
    Endpoint 0x05  OUT   Bulk    (print data)
    Endpoint 0x85  IN    Bulk    (1-byte status responses)
  Interface 1+ —  HID  (used by the device's keyboard/feature buttons)
```

Print data is sent **directly to the Printer-class interface** via raw
USB bulk transfers — *not* via the HID interface. The HID interface
exists for the on-device keyboard input and is not used for printing.

The Node driver chunks writes at **64 bytes** with a 5 ms delay between
chunks. The chunking matches the device's internal report-size
expectation observed during reverse engineering; smaller chunks work,
larger ones risk truncation on some firmware revisions.

### Mode-switch (Linux only)

Several models present as USB Mass Storage on first connect (the
"PLite" / setup partition that ships the Windows installer). To switch
to the printer interface:

1. The host sends a 3-byte vendor-specific message: `1B 5A 01`
   (`ESC Z 01`).
2. The device re-enumerates under its printer-class PID.

| Model            | Mass-storage PID | Printer PID |
| ---------------- | ---------------- | ----------- |
| LabelManager PnP | `0x1001`         | `0x1002`    |
| LabelManager 280 | `0x1005`         | `0x1006`    |

On Linux, this is handled by `usb_modeswitch` plus a udev rule (the
package ships generators for both — see
[Getting started](./getting-started)). macOS and Windows automatically
switch to printer mode when the OS driver loads, so no host-side action
is needed.

::: warning Do not send `ESC @`
Do **not** send the generic reset opcode `1B 40` (`ESC @`) to the
Printer-class interface — it corrupts D1 firmware's parser state and
the next job will print garbage until the device is power-cycled.
The driver uses the LabelWriter-style `ESC @` only on LabelWriter
devices, never on LabelManager.
:::

## Status request and response

Send the single-byte command `1B 41` (`ESC A`) to the OUT endpoint.
The printer replies with **one byte** on the IN endpoint:

| Bit | Set means              |
| --: | ---------------------- |
|   0 | Printer busy / not ready |
|   1 | No tape inserted       |
|   2 | Tape supply low        |

All other bits are reserved and observed as zero.

The status request is also used as a job-flush at the end of a print
stream — see [Print job structure](#print-job-structure). LabelManager
does **not** report the loaded tape width over the wire; callers must
always pass `media` explicitly to `print()` (or rely on the
`DEFAULT_MEDIA` 12 mm fallback for previews).

## Tape width and head geometry

The print head is a fixed 64-pin column; the printable region depends
on the loaded tape width:

| Tape width | Printable dots | Top margin (pins) | Bottom margin (pins) |
| ---------- | -------------- | ----------------- | -------------------- |
| 6 mm       | 32             | 16                | 16                   |
| 9 mm       | 48             | 8                 | 8                    |
| 12 mm      | 64             | 0                 | 0                    |
| 19 mm      | 64             | 0                 | 0                    |

19 mm tape uses the same 64-pin head as 12 mm; the wider tape simply
has more inactive border outside the print area. The encoder centres
the bitmap by padding the head-perpendicular axis to the head-dot count
before emitting columns. See `prepareForEmission()` in
`packages/core/src/protocol.ts`.

A leading and trailing **8 mm blank-feed** (~57 px at 180 DPI) is
prepended and appended to every job so the cutter can divide the
printed region cleanly on both edges.

## Print job structure

A complete job is a single byte stream sent to EP `0x05` OUT, repeated
once per copy:

```
[per copy]
  ESC C 0           — set media type to "tape"
  ESC D N           — set bytes-per-line (N = ceil(headDots / 8))
  [for each row]
    SYN row...      — one column of pixel data
  ESC A             — flush / status request (printer replies on IN)
```

All values are hexadecimal. Each command is described below.

### `ESC C 0` — set media type

```
1B 43 00
```

Selects D1 tape mode. Always send this **before** the bytes-per-line
command. Sent once per copy (not per row).

### `ESC D N` — set bytes-per-line

```
1B 44 N
```

`N` is the number of payload bytes that will follow the SYN opcode in
each raster row, computed as `ceil(headDots / 8)` — `4` bytes for 6 mm
tape, `6` for 9 mm, `8` for 12/19 mm.

### `SYN <row bytes>` — raster row (one column)

```
16 b0 b1 ... b(N-1)
```

`0x16` is the SYN opcode. The `N` payload bytes carry one column of
pixel data, MSB-first within each byte. Bit 7 of `b0` is the topmost
pin; bit 0 of `b(N-1)` is the bottommost pin (or one of the inactive
margin pins, depending on tape width).

D1 tape printers feed the tape **forward by one column per row** — the
"row" axis in the byte stream is along the feed direction, not across
the head. The driver rotates landscape input 90° clockwise via
`pickRotation` before emission.

### `ESC A` — flush / status request

```
1B 41
```

Terminates the job. The printer:

1. Cuts the tape (D1 cassettes have a built-in cutter; LabelManager
   models trigger it on `ESC A`).
2. Replies with a 1-byte status on the IN endpoint (see
   [Status request and response](#status-request-and-response)).

The driver does not always read this mid-stream reply; it is consumed
by the next `getStatus()` call.

## Optional commands

### `ESC e <density>` — print density

```
1B 65 nn
```

`nn = 0x00` for normal density, `0x01` for high. Affects how aggressively
the head heats each pin. Sent during the reset sequence in the HID-style
encoder path (`buildResetSequence`); the bulk-stream path
(`buildPrinterStream`) omits it because the firmware defaults are
correct for the canonical D1 cassettes.

### `ESC G` — form-feed / advance

```
1B 47
```

Advances tape without printing — useful for a manual cut in HID-driven
flows. The bulk-stream path replaces this with `ESC A` (which both
flushes and triggers the cutter on D1 hardware).

::: info LabelWriter Duo divergence
The LabelWriter Duo's tape engine uses **`ESC E` (`1B 45`)** as its
cut command instead of `ESC G` / `ESC A`. The Duo's status reply is
also longer (8 bytes vs LabelManager's 1 byte) and includes additional
fields about the loaded cassette. See
[LabelWriter Duo tape protocol](https://thermal-label.github.io/labelwriter/protocol/duo-tape).
:::

## Two transports, one protocol

The driver exposes two encoder entry points for different use cases:

| Entry point          | Output            | Used by                                       |
| -------------------- | ----------------- | --------------------------------------------- |
| `buildPrinterStream` | `Uint8Array`      | Direct USB bulk transfer (Node + WebUSB)      |
| `encodeLabel`        | `Uint8Array[]`    | HID report path (legacy / OS-paired flows)    |

The two share `prepareForEmission` (geometry pipeline) and emit the
same opcodes; the HID variant wraps each command in a 64-byte report
with the report ID prefix. New code should prefer `buildPrinterStream`
— it matches what the device actually wants on the Printer-class
interface.

## Flow control (synwait)

For long labels, the host can outrun the printer's internal buffer. The
firmware exposes a `synwait`-style flow-control loop:

1. Send `ESC A` (status query).
2. Wait for the 1-byte status response on EP `0x85` IN.
3. Send the next chunk — at most `synwait = 64` `SYN` commands.
4. Repeat.

The current Node.js driver does **not** implement synwait — it streams
the entire job with a 5 ms inter-chunk delay. In practice this works
reliably for text labels up to several hundred columns. Image labels
longer than ~200 columns can hit `LIBUSB_ERROR_TIMEOUT`; implementing
synwait would fix this. A minimal sketch:

```ts
const SYNWAIT = 64;
const STATUS_QUERY = Buffer.from([0x1b, 0x41]);

async function writeWithSynwait(stream: Uint8Array, transport: Transport) {
  let pos = 0;
  while (pos < stream.length) {
    await transport.write(STATUS_QUERY);
    await transport.read(64);

    let synCount = 0;
    let end = pos;
    while (end < stream.length && synCount < SYNWAIT) {
      if (stream[end] === 0x16) synCount++;
      end++;
    }
    await transport.write(Buffer.from(stream.subarray(pos, end)));
    pos = end;
  }
}
```

## WebUSB

The browser package uses the WebUSB API:

```ts
device.open()
  → device.selectConfiguration(1)
  → device.claimInterface(0)        // Printer class
  → device.transferOut(5, chunk)    // 64-byte chunks
  → device.transferIn(5, 1)         // 1-byte status reply
```

WebUSB requires a secure context (`https://` or `localhost`). Mode-switch
is not possible from the browser — devices stuck in mass-storage mode
are filtered out at discovery and surface a "set up via the desktop
installer first" message.

## Porting checklist

If you're implementing the protocol in another language or runtime:

- [ ] Use VID `0x0922` and the printer-class PIDs from
      [Hardware](./hardware); claim Interface 0 via `libusb` or WebUSB.
- [ ] On Linux, set up `usb_modeswitch` for models that present as
      mass storage first; do **not** send the mode-switch message
      yourself unless you've enumerated the mass-storage interface.
- [ ] Send writes to EP `0x05` OUT in **64-byte chunks** with a small
      delay between chunks (5 ms is what this driver uses).
- [ ] Per copy: `ESC C 0` → `ESC D N` → repeated `SYN <row>` columns
      → `ESC A` to flush + cut.
- [ ] Each SYN row is `1 + N` bytes where `N = ceil(headDots / 8)`;
      pixel data is MSB-first.
- [ ] Pad the head-perpendicular axis to the head-dot count (32 / 48
      / 64) by tape width; centre the bitmap with the per-tape top /
      bottom margins from the table above.
- [ ] Add 8 mm blank-feed (~57 px at 180 DPI) before and after the
      bitmap so the cutter divides cleanly.
- [ ] Read the 1-byte status reply on EP `0x85` IN — bit 0 = busy,
      bit 1 = no tape, bit 2 = low tape.
- [ ] Never send `ESC @` (`1B 40`) on the printer interface — it
      corrupts firmware state until power-cycle.

## Source references

- [`labelle`](https://github.com/labelle-org/labelle) — Python driver
  for the same hardware family. Primary reference for the bulk-stream
  command shape (`ESC C` / `ESC D` / `SYN` / `ESC A`).
- [`dymo-print` (Rust)](https://github.com/computerlyrik/dymoprint) —
  secondary cross-reference for the HID-report path and tape-width
  margin geometry.
- This driver's implementation:
  - `packages/core/src/protocol.ts` — encoder (both stream and HID
    variants).
  - `packages/core/src/status.ts` — status-byte parsing.
  - `packages/node/src/printer.ts` — chunked USB write loop.
