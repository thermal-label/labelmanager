# @thermal-label/labelmanager-cli

CLI for DYMO LabelManager printers.

The CLI command is `dymo`.

## Install

```bash
pnpm add -g @thermal-label/labelmanager-cli
```

```bash
npm install -g @thermal-label/labelmanager-cli
```

Or run without global install:

```bash
npx @thermal-label/labelmanager-cli list
```

## Quick Start

```bash
dymo list
dymo print text "Hello DYMO" --tape 12
```

## Commands

### List printers

```bash
dymo list
```

### Print text

```bash
dymo print text "Warehouse A-17" --tape 12 --density high
```

### Print image

```bash
dymo print image ./label.png --tape 12 --dither --threshold 140
```

### Printer status

```bash
dymo status
```

### Linux setup helper

```bash
dymo setup linux
```

## Requirements

- Node.js 24 or newer.
- USB access to DYMO LabelManager hardware.
- Linux users typically need udev rules and `usb_modeswitch`.

## Links

- Homepage: https://thermal-label.github.io/labelmanager/
- Repository: https://github.com/thermal-label/labelmanager
- Issues: https://github.com/thermal-label/labelmanager/issues

## License

MIT
