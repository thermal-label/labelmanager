# Linux Setup

Linux users often need `usb_modeswitch` + udev rules so DYMO devices appear as HID.

## 1) Install required packages

```bash
sudo apt-get update
sudo apt-get install -y usb-modeswitch usb-modeswitch-data
```

## 2) Print the rule template

```bash
pnpm dymo setup linux
```

Copy the output into:

`/etc/udev/rules.d/99-dymo-labelmanager.rules`

## 3) Reload udev

```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

## 4) Reconnect printer and verify

Run:

```bash
pnpm dymo list
```

If your device is listed, the setup is complete.
