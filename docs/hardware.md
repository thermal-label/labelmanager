# Hardware Compatibility

All devices share the same USB vendor ID (`0x0922`, Dymo-CoStar Corp.) and the
same ESC-sequence print protocol. Differences between models are limited to
supported tape widths and USB product IDs.

## Supported devices

| Device                    | USB PID  | Tape widths     | Status      |
| ------------------------- | -------- | --------------- | ----------- |
| LabelManager PnP          | `0x1002` | 6, 9, 12 mm     | ✅ Verified |
| LabelManager 420P         | `0x1004` | 6, 9, 12, 19 mm | 🔲 Expected |
| LabelManager Wireless PnP | `0x1008` | 6, 9, 12 mm     | 🔲 Expected |
| LabelManager PC           | `0x1002` | 6, 9, 12 mm     | 🔲 Expected |
| LabelPoint 350            | `0x1003` | 6, 9, 12 mm     | 🔲 Expected |
| MobileLabeler             | `0x1009` | 6, 9, 12 mm     | 🔲 Expected |

<div class="hw-cta">
  <div class="hw-cta-header">
    <span class="hw-cta-icon">🔌</span>
    <div class="hw-cta-text">
      <strong>Got one of the five untested devices?</strong>
      <span>A two-minute test helps everyone who buys one of these printers.</span>
    </div>
  </div>
  <div class="hw-cta-steps">
    <span>Run these two commands and report what happens:</span>
    <div class="hw-cta-cmds">
      <code>dymo list</code>
      <span class="hw-cta-arrow">→</span>
      <code>dymo print text "test"</code>
    </div>
  </div>
  <div class="hw-cta-actions">
    <a class="hw-chip hw-chip-works" href="https://github.com/thermal-label/labelmanager/issues/new?template=hardware_verification.yml&title=Verified%3A+%5BDevice+name%5D&labels=hardware%2Cverified" target="_blank" rel="noopener">✅ It works</a>
    <a class="hw-chip hw-chip-partial" href="https://github.com/thermal-label/labelmanager/issues/new?template=hardware_verification.yml&title=Partial%3A+%5BDevice+name%5D&labels=hardware%2Cpartial" target="_blank" rel="noopener">⚠️ Partially works</a>
    <a class="hw-chip hw-chip-broken" href="https://github.com/thermal-label/labelmanager/issues/new?template=hardware_verification.yml&title=Broken%3A+%5BDevice+name%5D&labels=hardware%2Cbroken" target="_blank" rel="noopener">❌ Doesn't work</a>
  </div>
</div>

## USB identifiers

```
Vendor ID:  0x0922   Dymo-CoStar Corp.
```

| Device                             | Product ID |
| ---------------------------------- | ---------- |
| LabelManager PnP / LabelManager PC | `0x1002`   |
| LabelPoint 350                     | `0x1003`   |
| LabelManager 420P                  | `0x1004`   |
| LabelManager Wireless PnP          | `0x1008`   |
| MobileLabeler                      | `0x1009`   |

## Tape widths and print head dots

| Tape  | Printable dots | Bytes per line |
| :---: | :------------: | :------------: |
| 6 mm  |       32       |       4        |
| 9 mm  |       48       |       6        |
| 12 mm |       64       |       8        |
| 19 mm |       64       |       8        |

All models with a 12 mm or 19 mm capacity share the same 64-dot print head.
19 mm tape is physically wider but the printable area is the same 64-dot path.

## Hardware reference (LabelManager PnP)

```
Vendor:   Dymo-CoStar Corp.  VID 0x0922
Device:   LabelManager PnP   PID 0x1002  (post-modeswitch)

Interface 0  Printer class
  Protocol:     Bidirectional (0x02)
  EP 5 OUT:     0x05  Bulk  64 bytes  wMaxPacketSize=64
  EP 5 IN:      0x85  Bulk  64 bytes  wMaxPacketSize=64

Interface 1  Mass Storage (SCSI Bulk-Only)
  EP 2 IN:      0x82  Bulk  64 bytes
  EP 2 OUT:     0x02  Bulk  64 bytes

Interface 2  HID
  EP 1 OUT:     0x01  Interrupt  8 bytes  bInterval=10ms
  Report descriptor: 34 bytes (input report only — no output report)
```

Full `lsusb -v -d 0922:1002` output is the canonical reference for any
discrepancies.

For the full USB protocol details — byte sequences, flow control, and porting
notes — see [Core](./core#usb-protocol).


<!--@include: ./_status-fragment.md-->
