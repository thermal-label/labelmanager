# Verification checklist — DYMO LabelManager

This is the family-specific checklist. Follow [the verification
guide](https://github.com/thermal-label/.github/blob/main/CONTRIBUTING/verifying-hardware.md)
for context — that doc explains _why_ and _what to do with the
output_.

Capture the terminal output and a photo of the printed label, then
file your report on the
[Hardware verification issue template](https://github.com/thermal-label/labelmanager/issues/new?template=hardware_verification.yml).

> LabelManager prints on **D1 tape**. Confirm a 12 mm cassette is
> loaded (or whichever width your model supports) before running
> these steps.

## Setup

```bash
npm install -g thermal-label-cli @thermal-label/labelmanager-node
```

**Linux only:**

- LabelManager devices are USB HID, so a generic udev rule for VID
  `0x0922` is required:
  `SUBSYSTEMS=="usb", ATTR{idVendor}=="0922", MODE="0666"`.
- The **LabelManager PC** boots into mass-storage mode (PID `0x1001`)
  before switching to HID (PID `0x1002`). Use the shipped
  `usb_modeswitch` rule (or the CLI helper `dymo setup linux`) to
  apply the switch automatically.

## 1. Device is detected

```bash
thermal-label list
```

**Expected:** your LabelManager appears with the correct model name
and PID, e.g. `LabelManager PnP (0x1002) — usb`.

## 2. Status is readable

```bash
thermal-label status
```

**Expected:** `ready: true`, no errors, the loaded tape width
populated where the model exposes it.

## 3. Print a text label

```bash
thermal-label print text "verify $(date +%Y-%m-%d)"
```

**Expected:** a sharp tape label with the current date. The tape
auto-feeds and cuts (or feeds for manual cut, depending on model).

## 4. Print an image

```bash
thermal-label print image small.png
```

**Expected:** a graphics-quality print with no banding. Note:
LabelManager has lower resolution than LabelWriter / Brother QL —
fine details may not reproduce.

## 5. Tape-width matrix

If your model supports multiple tape widths (e.g. 6 / 9 / 12 / 19 mm),
swap each cassette and repeat steps 2–3. Capture the printed labels
side-by-side so the report shows which widths print correctly.

| Model | Widths to test |
|---|---|
| LabelManager PnP / PC / Wireless PnP | 6, 9, 12 mm |
| LabelManager 420P | 6, 9, 12, 19 mm |
| LabelPoint 350 | 6, 9, 12 mm |
| MobileLabeler | 6, 9, 12 mm |

If you only have one tape width on hand, that's fine — just say so in
the notes.

## 6. (LabelManager PC) Mass-storage mode switch

Confirm the mode-switch flow:

1. Plug the printer in fresh — Linux should mount a virtual CD-ROM
   for a moment.
2. The udev `usb_modeswitch` rule fires automatically.
3. The device re-enumerates as HID (PID `0x1002`).
4. `thermal-label list` now shows the device.

**Expected:** total time ≤ 5 seconds; no manual intervention needed
once the rule is installed.

## 7. (Browser) WebUSB live demo

Open [https://thermal-label.github.io/demo/labelmanager](https://thermal-label.github.io/demo/labelmanager)
in a Chromium-class browser, click Pair, select your printer, and
print the demo label.

**Expected:** the same label content as step 3.

## What to capture for the report

- The full terminal output of steps 1–4.
- A clear photo of at least one printed tape label (one per width if
  you tested the matrix).
- The exact `@thermal-label/labelmanager-node` version printed by
  `thermal-label --version`.
- Your OS and Node version.
- For LabelManager PC: confirmation the mode-switch ran without manual
  intervention.
