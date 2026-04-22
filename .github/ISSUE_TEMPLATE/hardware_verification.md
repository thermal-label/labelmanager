---
name: Hardware verification
about: Report successful testing on an expected DYMO device
title: "Hardware verification: <device-name> (<pid>)"
labels: ["hardware", "verification"]
assignees: []
---

## Device details

- Model:
- USB VID/PID:
- Firmware version (if known):
- Operating system:
- Node version:

## Package/version under test

- Package(s):
- Version(s):

## Test matrix

- [ ] `pnpm test`
- [ ] `DYMO_INTEGRATION=1 pnpm test`
- [ ] Printed text label successfully
- [ ] Printed image label successfully
- [ ] Status command returned expected values

## Notes

Please include any quirks, workarounds, or differences in behavior.
