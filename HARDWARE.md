# Hardware Compatibility

This project targets DYMO LabelManager USB HID printers in the D1 family.

## Compatibility Matrix

| Device | VID:PID | Tape Widths | Status | Notes |
|---|---|---|---|---|
| LabelManager PnP | `0922:1002` | 6, 9, 12mm | Verified | Reference test device |
| LabelManager 420P | `0922:1004` | 6, 9, 12, 19mm | Expected | Same protocol family |
| LabelManager Wireless PnP | `0922:1008` | 6, 9, 12mm | Expected | USB cable mode only |
| LabelManager PC | `0922:1001 -> 0922:1002` | 6, 9, 12mm | Expected | Requires mode-switch |
| LabelPoint 350 | `0922:1003` | 6, 9, 12mm | Expected | Same HID command set |
| MobileLabeler | `0922:1009` | 6, 9, 12mm | Experimental | Community verification needed |

> LabelManager 280 (`0922:1005`) is not a HID target and is out of scope.

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
