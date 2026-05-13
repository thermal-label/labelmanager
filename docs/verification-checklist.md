# Verification checklist — DYMO LabelManager

Hardware verification now runs through the harness app. It walks
through device detection, prints a diagnostic, and submits a
hardware report issue automatically — no manual CLI transcription,
no scattered captures.

## Browser harness

Open <https://thermal-label.github.io/harness/labelmanager/> in a
Chromium-class browser, click **Pair**, select your LabelManager,
and follow the prompts. The harness handles tape-width capture,
prints the diagnostic, and prefills a GitHub issue when you're done.

Bench-validated for centred D1 strips.

## CLI harness

LabelManager is USB-HID only — the browser harness covers every
transport. The CLI harness is available for parity, but you should
not need it:

```bash
pnpm --filter verify-cli verify labelmanager <model-key>
```

## Fallback

Hand-rolled report? Open the
[hardware verification issue template](https://github.com/thermal-label/labelmanager/issues/new?template=hardware_verification.yml)
directly.

## Driver-specific notes for the verifier

- **LabelManager PC boots into mass-storage mode** (PID `0x1001`)
  before switching to HID (PID `0x1002`). On Linux, the shipped
  `usb_modeswitch` rule handles this automatically; on Windows /
  macOS the OEM software performs the switch. If your PC unit never
  enumerates as HID, the mode-switch did not fire — flag this in
  the report rather than assuming the device is broken.
