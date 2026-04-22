# Core

`@thermal-label/labelmanager-core` is the shared protocol layer used by all
other packages. It contains the ESC-sequence encoder, bitmap pipeline, device
metadata, and TypeScript types. You rarely import it directly — use the
Node.js, CLI, or Web packages instead.

## Core API

| Export                             | Description                                            |
| ---------------------------------- | ------------------------------------------------------ |
| `buildPrinterStream(bitmap, opts)` | Encode a full label job as a raw USB byte stream       |
| `buildBitmapRows(bitmap, opts)`    | Encode bitmap as HID report payloads                   |
| `buildResetSequence(opts)`         | ESC reset + media type + density reports               |
| `buildFormFeed()`                  | Form-feed / cut report                                 |
| `encodeLabel(bitmap, opts)`        | Full HID report sequence for one or more copies        |
| `findDevice(devices, pid)`         | Look up a device descriptor by USB PID                 |
| `DEVICES`                          | Array of all known `DeviceDescriptor` objects          |
| `PrintOptions`                     | Shared options type (`density`, `copies`, `tapeWidth`) |
| `TapeWidth`                        | `6 \| 9 \| 12 \| 19`                                   |

---

## USB Protocol

This section documents the actual USB topology and print protocol of the DYMO
LabelManager PnP (`0922:1002`), based on hands-on reverse engineering conducted
while building this driver. It is written for developers porting the driver to
new languages, debugging hardware issues, or extending the existing packages.

::: tip Why this page exists
The original implementation plan described the device as "purely HID" and used
`node-hid` for all communication. Hardware testing revealed that this is
incorrect: HID writes fail silently on Linux and leave the printer in a broken
state. This page documents what actually works and why.
:::

## Device overview

After `usb_modeswitch` (see [Getting Started](/getting-started#linux-setup)),
the device enumerates with three USB interfaces:

```
Bus 003 Device 010: ID 0922:1002 Dymo-CoStar Corp. LabelManager PnP
```

```
Interface 0  —  Printer class  (bInterfaceClass 0x07)
Interface 1  —  Mass Storage   (bInterfaceClass 0x08)
Interface 2  —  HID            (bInterfaceClass 0x03)
```

### Interface 0 — Printer class (the printing path)

```
bInterfaceClass     7   Printer
bInterfaceSubClass  1   Printer
bInterfaceProtocol  2   Bidirectional
  Endpoint 0x05  OUT   Bulk  64 bytes  (print data)
  Endpoint 0x85  IN    Bulk  64 bytes  (status responses)
```

This is the interface `labelle` (Python) uses. It is the correct target for all
print data. You must claim this interface via `libusb` — `node-hid` cannot reach
it.

### Interface 1 — Mass Storage

Not relevant to printing. This interface exposes a small read-only filesystem
(firmware info, Windows driver stub). `usb_modeswitch` configures the device
so this interface is present alongside the Printer and HID interfaces.

### Interface 2 — HID (status only)

```
bInterfaceClass     3   HID
  Endpoint 0x01  OUT   Interrupt  8 bytes  bInterval=10ms
Report descriptor:  34 bytes
```

**This interface has no output report defined.** The 34-byte report descriptor
describes only an input report (status byte). Any attempt to write to EP 1 OUT
via `hidraw` / `node-hid` fails with `Cannot write to hid device` and leaves
the printer in a partial-command state that blocks the Printer interface too
until the device is power-cycled.

> **Symptom of using the wrong interface:** print command fails, then
> `labelle` or any other tool also fails to print until the printer is
> unplugged and reconnected.

## Why node-hid fails

`node-hid` on Linux uses the kernel `hidraw` driver, which maps directly onto
Interface 2. The write call succeeds at the syscall level (the OS delivers the
bytes to the endpoint) but the device firmware rejects the payload because no
output report is defined for that interface. The printer appears to queue the
malformed input and stalls — subsequent commands to Interface 0 (Printer class)
are also blocked until a USB reset occurs.

The root cause of the "poisoning" behaviour: the printer's command parser runs
across both interfaces at the firmware level. An unrecognised command token (the
raw `ESC @` sent as a HID report body) corrupts the parser state machine.

## The correct approach: raw USB via libusb

Claim Interface 0 directly using `libusb` (or the `usb` npm package on
Node.js). Detach any kernel driver that may be attached to Interface 0 (on
Linux this is the `usblp` printer driver; with the setup rules in this repo it
is usually not loaded, but the detach call is safe to make unconditionally).

```typescript
// packages/node/src/discovery.ts
const iface = device.interface(0); // Interface 0 — Printer class
if (process.platform === 'linux' && iface.isKernelDriverActive()) {
  iface.detachKernelDriver();
}
iface.claim();

const out = iface.endpoint(0x05) as usb.OutEndpoint; // EP 5 OUT — print data
const inp = iface.endpoint(0x85) as usb.InEndpoint; // EP 5 IN  — status
```

## Print protocol

The protocol byte stream sent to EP 5 OUT matches the `labelle` Python
implementation and was confirmed working on hardware. All values are hex.

### Sequence structure

```
┌─────────────────────┬────────────────────────────────────────────┐
│ Bytes               │ Meaning                                    │
├─────────────────────┼────────────────────────────────────────────┤
│ 1B 43 00            │ ESC C 0  — select tape/D1 media type       │
│ 1B 44 <N>           │ ESC D N  — set bytes per line              │
│ 16 <b1 … bN>        │ SYN + N bytes — one column of pixel data   │
│ 16 <b1 … bN>        │   … repeated for every label column …      │
│ 1B 41               │ ESC A    — status query / flush            │
└─────────────────────┴────────────────────────────────────────────┘
```

For multiple copies, repeat the entire sequence (the printer does not maintain
state between sequences).

### ESC C 0 — tape type

```
1B 43 00
```

Selects D1 tape mode. Always send this first. The value `0x00` means
"tape / D1 label". This command does not vary by tape width.

### ESC D N — bytes per line

```
1B 44 <N>
```

Tells the printer how many data bytes follow each `SYN` command.
`N` is derived from tape width:

| Tape width | Printable dots | Bytes per line |
| :--------: | :------------: | :------------: |
|    6 mm    |       32       |       4        |
|    9 mm    |       48       |       6        |
|   12 mm    |       64       |       8        |
|   19 mm    |       64       |       8        |

Formula: `N = ceil(printable_dots / 8)`. For 12 mm and 19 mm the print head
has 64 dots, so `N = 8` in both cases.

The printer caches this value. You only need to resend `ESC D N` when
the value changes within a single USB session. In practice, always send it
at the start of each job.

### SYN + row bytes — bitmap data

```
16 <b1 b2 … bN>
```

`0x16` is the ASCII SYN character — this is the bitmap row command prefix.
It is followed immediately by exactly `N` bytes (matching the last `ESC D N`
value). Each byte holds 8 pixels, MSB first.

**Orientation:** the printer head scans across the 64-dot (or 48/32-dot)
axis. One `SYN` command represents one _column_ of the printed label, not
one row. The full bitmap must be rotated 90° before encoding:

```
Label orientation      Printer orientation
(as seen printed)      (as stored in memory)

column 0 → column 1    row 0  (leftmost label column)
    ↓            ↓     row 1
  row 0 …             row 2
  row 1 …              …
    ↑ 64 dots          row N-1 (rightmost label column)
```

The `@mbtech-nl/bitmap` package's `rotateBitmap(bitmap, 90)` performs this
transformation. In `packages/core`, `buildPrinterStream` calls `scaleBitmap`
to fit the bitmap to the target head height, `padBitmap` to add feed margins,
then `rotateBitmap` before encoding columns.

#### Scaling for narrow tapes

For tapes narrower than 12 mm, the bitmap is scaled proportionally to fill the
available print head dots:

| Tape  | Dots used | Scale factor (vs 12 mm) |
| :---: | :-------: | :---------------------: |
| 6 mm  |    32     |          0.5×           |
| 9 mm  |    48     |          0.75×          |
| 12 mm |    64     |           1×            |

`scaleBitmap(bitmap, targetHeight)` in `packages/core/src/protocol.ts` handles
this. The label width scales proportionally so the aspect ratio is preserved.

#### Feed margins

An 8 mm blank feed is added on each side of the bitmap (≈ 57 dots at 180 DPI)
via `padBitmap`. This gives enough tape on each side to cut cleanly without
cutting into the printed area.

### ESC A — status query / flush

```
1B 41
```

Sent at the end of each print job. The printer responds with a 1-byte status
word on EP 5 IN. This response also acts as a flush acknowledgement — the
printer will not start cutting until it receives this command and the
in-flight data is fully consumed.

Status byte bit flags:

| Bit | Meaning when set         |
| :-: | ------------------------ |
|  0  | Printer busy / not ready |
|  1  | No tape inserted         |
|  2  | Label supply low         |
| 3–7 | Reserved                 |

### Commands present in earlier implementations but not used

| Command           |     Bytes     | Notes                                                                                                                                                                                       |
| ----------------- | :-----------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESC @ — Reset     |    `1B 40`    | Resets the printer state machine. **Do not send on Interface 0.** Sending `ESC @` via raw USB puts the printer into an undefined state and blocks subsequent print jobs until power-cycled. |
| ESC e — Density   | `1B 65 00/01` | Normal / high density. Not observed in confirmed-working `labelle` sessions. The device appears to use a fixed density.                                                                     |
| ESC G — Form feed |    `1B 47`    | Advances and cuts. Labelle uses `ESC A` (status query) as the print terminator instead. `ESC G` may work on some firmware revisions but was not tested.                                     |

## Flow control (synwait)

For long labels, the printer can fall behind the host. `labelle` implements a
flow control mechanism called `synwait`:

1. Before sending a chunk of data, send `ESC A` (status query).
2. Wait for the 1-byte status response on EP 5 IN.
3. Send the next chunk (up to `synwait` = 64 `SYN` commands).
4. Repeat.

The current Node.js implementation does not implement synwait. Instead it sends
the entire stream with a 5 ms inter-chunk delay (64 bytes per chunk). In
practice this works reliably for text labels up to several hundred columns. For
very long image labels (> ~200 columns) you may encounter
`LIBUSB_ERROR_TIMEOUT` — implementing synwait would fix this.

A synwait implementation would look like:

```typescript
const SYNWAIT = 64; // max SYN bytes between status checks
const STATUS_QUERY = Buffer.from([0x1b, 0x41]);

async function writeWithSynwait(stream: Uint8Array, transport: PrinterTransport) {
  let pos = 0;
  while (pos < stream.length) {
    // Send status query, wait for response
    await transport.write(STATUS_QUERY);
    await transport.read(64);

    // Find next SYNWAIT SYN characters
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

## Comparison with labelle

[labelle](https://github.com/labelle-org/labelle) is the reference Python
implementation. The key differences from this TypeScript driver:

| Aspect         | labelle                     | This driver                          |
| -------------- | --------------------------- | ------------------------------------ |
| Language       | Python                      | TypeScript / Node.js                 |
| USB library    | `pyusb` / `libusb`          | `usb` npm package                    |
| Interface      | Interface 0 (Printer class) | Interface 0 (Printer class)          |
| Protocol       | ESC C, ESC D, SYN, ESC A    | Same                                 |
| Image rotation | `ROTATE_270` (PIL)          | `rotateBitmap(bmp, 90)` (equivalent) |
| Tape scaling   | Margin calculation          | `scaleBitmap` + `padBitmap`          |
| Flow control   | synwait=64                  | Not yet implemented                  |
| Status read    | EP 5 IN                     | EP 5 IN                              |
| Multi-copy     | Not natively                | `copies` option (repeated sequence)  |

`ROTATE_270` (PIL/Pillow) and `rotateBitmap(bitmap, 90)` (`@mbtech-nl/bitmap`)
produce identical output: the label's leftmost column becomes the bitmap's
first row. Both rotate counter-clockwise by 90°.

## WebUSB (browser)

The `@thermal-label/labelmanager-web` package uses the browser
[WebUSB API](https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API)
(`navigator.usb.requestDevice`). It targets Interface 0 (Printer class,
EP 5 OUT) — the same interface as the Node.js driver and labelle.

`requestPrinter()` calls `open()` → `selectConfiguration(1)` →
`claimInterface(0)`, then wraps the device in `WebDymoPrinter`. Print data is
encoded with `buildPrinterStream` (same as the node package) and sent via
`device.transferOut(5, chunk)` in 64-byte chunks.

Status is read actively via `getStatus()` → `transferOut(ESC A)` +
`transferIn(5, 64)`, instead of passively listening to HID input reports.

WebUSB requires a secure context (`https://` or `localhost`) and is supported
in Chrome 89+ and Edge 89+. Firefox and Safari do not implement WebUSB.

## udev rules

Two separate udev rules are required because `node-hid` (if used for status
queries only) needs `hidraw` access, while `libusb` / the `usb` npm package
needs raw `usb` access:

```
# /etc/udev/rules.d/99-dymo-labelmanager.rules
SUBSYSTEM=="hidraw", ATTRS{idVendor}=="0922", MODE="0666", TAG+="uaccess"
SUBSYSTEM=="usb", ATTR{idVendor}=="0922", MODE="0666", TAG+="uaccess"
```

Both rules are generated by `dymo setup linux` (see [CLI](/cli#dymo-setup-linux)).

## Porting checklist

If you are porting this driver to another language or platform:

- [ ] Use `libusb` (or equivalent) — **not** the OS HID driver
- [ ] Target Interface 0 (Printer class), not Interface 2 (HID)
- [ ] Detach any kernel driver attached to Interface 0 before claiming
- [ ] Send `ESC C 0` + `ESC D N` before any bitmap data
- [ ] Use `SYN` (`0x16`) + exactly `N` bytes per label column
- [ ] Rotate the bitmap 90° counter-clockwise before encoding columns
- [ ] Scale the image to fill available head dots for the tape width
- [ ] Add blank feed margin (~8 mm) on each side before rotation
- [ ] Terminate with `ESC A` and read the status response
- [ ] **Do not send `ESC @` (reset)** over the Printer interface
- [ ] Implement synwait flow control for labels longer than ~200 columns
- [ ] Set up udev rules for both `hidraw` and `usb` subsystems
