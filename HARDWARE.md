# Hardware Compatibility

This project targets DYMO LabelManager USB HID printers in the D1 family.

## Compatibility Matrix

The "Tape Widths" column reflects the chassis's physical cartridge slot
per DYMO's published specifications. The driver's rasterizer currently
caps at the 64-dot transport (12 mm full-width / 19 mm with margins);
24 mm widths advertised by `d1-wide` chassis are gated on the wide-tier
work — see `plans/backlog/wide-tier-media-compatibility.md`.

| Device | VID:PID | Tape Widths | Status | Notes |
|---|---|---|---|---|
| LabelManager PnP | `0922:1002` | 6, 9, 12mm | Verified | Reference test device. 12 mm chassis cap. |
| LabelManager 420P | `0922:1004` | 6, 9, 12, 19mm | Expected | 19 mm chassis cap per [DYMO product page](https://www.dymo.com/label-makers-printers/labelmanager-label-makers/dymo-labelmanager-420p-high-performance-label-maker/SP_95482.html). |
| LabelManager Wireless PnP | `0922:1008` | 6, 9, 12, 19, 24mm† | Expected | USB cable mode only. 24 mm chassis cap per [DYMO Wireless PnP technical datasheet](https://download.dymo.com/dymo/user-guides/LabelManager/LMWirelessPnP/LabelManager_Wireless_PnP_Technical_Datasheet.pdf); 24 mm rasterizer path not yet implemented. |
| LabelManager PC | `0922:1001 -> 0922:1002` | 6, 9, 12mm | Expected | Requires mode-switch. Width cap untested — conservative default. |
| LabelPoint 350 | `0922:1003` | 6, 9, 12mm | Expected | Same HID command set. Width cap untested — conservative default. |
| MobileLabeler | `0922:1009` | 6, 9, 12, 19, 24mm† | Experimental | 24 mm chassis cap per maintainer report; 24 mm rasterizer path not yet implemented. Community verification needed. |

> † `d1-wide` chassis: physical slot accepts 24 mm but the rasterizer
> cap-lift has not landed — only ≤19 mm media activates today.

> LabelManager 280 (`0922:1005`) is not a HID target and is out of scope.

## Supported Media

The driver ships a registry of D1 cartridge SKUs (standard, permanent
polyester, flexible nylon, durable) and the DYMO Rhino™ industrial
line (vinyl, permanent polyester, flexible nylon, heat-shrink tube,
non-adhesive tag). See `packages/core/data/media.json5` for the full
list. Each entry advertises a width tier (`d1`, `d1-19`, `d1-wide`)
that gates which chassis can drive it.

### Rhino™ industrial cartridges — at your own risk

Rhino industrial cartridges are mechanically the same shape as D1 and
fit LabelManager chassis. DYMO does **not** officially endorse the
cross-use, but it works in practice — the cartridge slot, drive gear
and head pitch are identical across the two lines.

Sources confirming the mechanical interchange:

- [DYMO Industrial Labels datasheet (mirror)](https://grouponenw.com/customcontent/attachment/Dymo-labels-data-sheet.pdf) — official catalogue and substrate descriptions
- [silvenga.com — "Tip: Dymo Rhino Labels work in Consumer Units Too"](https://silvenga.com/posts/tip-dymo-label-compatibility/) — *"the cartridges are mechanically the same. The Rhino labels just seem to work"*
- [DYMO Shop UK FAQ — D1 ↔ Rhino](https://www.dymo-label-printers.co.uk/news/faq-can-i-use-labelmanager-dymo-d1-tapes-in-rhino-printers.html) — *"Technically this will work (though is not necessarily supported) as the cartridges are the same design"*
- [LabelCity D1 compatibility guide](https://www.labelcity.com/dymo-d1-label-tape-compatibility-guide) — width-by-width D1 ↔ Rhino chassis matrix

#### Caveats

- **Cutter wear.** Rhino substrates — especially heat-shrink polyolefin
  tube and durable polyester — are stiffer and denser than the
  consumer-grade D1 standard tape the LabelManager cutter was
  dimensioned for. Heavy use accelerates blade wear and can also
  stress the feed motor.
- **No DYMO endorsement.** Using Rhino cartridges in a LabelManager
  chassis is outside DYMO's published support matrix. Damage caused
  by industrial cartridges may void the printer warranty — check with
  DYMO support before relying on it for production work.
- **Per-width compat still applies.** A 19 mm Rhino cartridge needs a
  19 mm-capable chassis (`d1-19` tier) the same way a 19 mm standard
  D1 cartridge does. Forcing a wide cartridge into a 12 mm chassis
  damages the chassis, not just the tape.
- **24 mm Rhino is not yet driveable.** The 24 mm SKUs from DYMO's
  Rhino catalogue (vinyl, permanent polyester, flexible nylon,
  heat-shrink tube, self-laminating) are **not** in the registry; they
  will land alongside the wide-tier rasterizer work.

#### Disclaimer

This project lists Rhino SKUs for convenience. **Use of Rhino
cartridges in a LabelManager chassis is at your own risk.** The
project authors and contributors assume no responsibility for printer
wear, cutter blade damage, motor strain, voided warranty, or any
other consequence of using non-D1-supported media. The MIT-licence
text covers software liability; this paragraph is the corresponding
hardware-usage disclaimer.

## Verification Process

To verify a device marked "Expected" or "Experimental":

1. Install dependencies and build:
   - `pnpm install`
   - `pnpm build`
2. Run test suite:
   - `pnpm test`
3. Run integration-gated stub target:
   - `DYMO_INTEGRATION=1 pnpm test`
4. Perform manual checks on hardware:
   - print text label
   - print image label
   - check status command output
   - confirm cut/advance behavior
5. Open a hardware verification issue using:
   - `.github/ISSUE_TEMPLATE/hardware_verification.md`

Please include:

- model name
- VID/PID
- operating system and version
- Node and package versions
- pass/fail notes and workarounds

## Linux Mode-Switch Notes

Some Linux systems expose LabelManager PC as mass storage first (`PID 1001`).
Use `usb_modeswitch` and the generated udev rules to switch to HID mode.

CLI helper:

```bash
dymo setup linux
```

## Hardware Donation / Contribution

If you can lend or donate unsupported DYMO hardware, open an issue with:

- exact model
- region and shipping constraints
- whether the device includes tape cartridges / power accessories

Community hardware access accelerates protocol verification and driver quality.
