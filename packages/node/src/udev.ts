export function generateUdevRules(): string {
  return [
    '# DYMO LabelManager HID access rules',
    '# Save as /etc/udev/rules.d/99-dymo-labelmanager.rules',
    'SUBSYSTEM=="hidraw", ATTRS{idVendor}=="0922", MODE="0666", TAG+="uaccess"',
    'SUBSYSTEM=="usb", ATTR{idVendor}=="0922", MODE="0666", TAG+="uaccess"',
    "",
    "# Reload rules:",
    "#   sudo udevadm control --reload-rules",
    "#   sudo udevadm trigger"
  ].join("\n");
}
