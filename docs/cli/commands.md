# CLI Commands

## `dymo list`

List connected compatible printers.

```bash
dymo list
```

## `dymo print text <text>`

```bash
dymo print text "Rack A3" --tape 12 --density high
```

## `dymo print image <file>`

```bash
dymo print image ./logo.png --dither --threshold 140
```

## `dymo status`

```bash
dymo status
```

Prints JSON with status flags.

## `dymo setup linux`

```bash
dymo setup linux
```

Outputs copy-paste ready udev rules and reload hints.
