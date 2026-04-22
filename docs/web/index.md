# Web Package

`@thermal-label/labelmanager-web` uses the browser WebHID API for direct printing.

## Browser support

| Browser | Support |
|---|---|
| Chrome 89+ | Yes |
| Edge 89+ | Yes |
| Firefox | No WebHID |
| Safari | No WebHID |

## Core flow

1. Call `requestPrinter()` to prompt for device permission
2. Use `printText`, `printImage`, or `printImageURL`
3. Call `disconnect()` when done
