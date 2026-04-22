# CLI

`@thermal-label/labelmanager-cli` is a thin command-line wrapper over the Node.js
driver. It is useful for local testing, quick ad-hoc labels, shell scripting,
cron jobs, and Linux udev setup.

## Install

```bash
pnpm add -D @thermal-label/labelmanager-cli
```

Inside this monorepo you can skip the install and use:

```bash
pnpm dymo <command>
```

`pnpm dymo` is a root `package.json` script that forwards to the CLI binary.

---

## `dymo list`

List all connected compatible printers.

```bash
dymo list
```

Output example:

```json
[{ "serialNumber": "ABC12345", "name": "LabelManager PnP", "pid": "0x1002" }]
```

---

## `dymo print text <text>`

Print a text label.

```bash
dymo print text "Rack A3"
dymo print text "Fragile" --tape 12 --density high --copies 2
```

### Flags

| Flag                | Default  | Description                         |
| ------------------- | -------- | ----------------------------------- |
| `--tape <mm>`       | `12`     | Tape width: `6`, `9`, `12`, or `19` |
| `--density <level>` | `normal` | `normal` or `high`                  |
| `--copies <n>`      | `1`      | Number of copies                    |
| `--invert`          | off      | White-on-black rendering            |

---

## `dymo print image <file>`

Print an image file.

```bash
dymo print image ./logo.png
dymo print image ./logo.png --dither --threshold 140 --tape 12
```

### Flags

| Flag                | Default  | Description                         |
| ------------------- | -------- | ----------------------------------- |
| `--tape <mm>`       | `12`     | Tape width: `6`, `9`, `12`, or `19` |
| `--density <level>` | `normal` | `normal` or `high`                  |
| `--dither`          | off      | Floyd-Steinberg dithering           |
| `--threshold <n>`   | `128`    | Binarization threshold (0–255)      |

---

## `dymo status`

Print the current printer status as JSON.

```bash
dymo status
```

```json
{ "ready": true, "tapeInserted": true, "labelLow": false }
```

---

## `dymo setup linux`

Output copy-paste ready udev rules and reload hints.

```bash
dymo setup linux
```

Paste the output into `/etc/udev/rules.d/99-dymo-labelmanager.rules`, then run:

```bash
sudo udevadm control --reload-rules && sudo udevadm trigger
```

See [Getting Started](/getting-started#linux-setup) for the full Linux setup
walkthrough.
