import { describe, it } from 'vitest';

const integrationEnabled = process.env.DYMO_INTEGRATION === '1';
const integrationDescribe = integrationEnabled ? describe : describe.skip;

integrationDescribe('integration: manual hardware verification', () => {
  it('manual checklist for hardware validation', () => {
    /**
     * Manual hardware verification checklist:
     *
     * 1. Connect a supported DYMO LabelManager printer via USB.
     * 2. Confirm Linux users applied usb_modeswitch + udev rules.
     * 3. Run: DYMO_INTEGRATION=1 pnpm --filter @thermal-label/labelmanager-node test
     * 4. Print a text label and verify:
     *    - characters are legible
     *    - label is cut
     *    - orientation is correct
     * 5. Print an image label and verify:
     *    - image threshold/dither behavior is as expected
     *    - no data dropouts during print
     * 6. Query status and verify ready/tape/low flags reflect device state.
     * 7. Record model, PID, OS, and result in hardware verification issue template.
     */
  });
});
