# Web Package

`@thermal-label/labelmanager-web` uses the browser [WebUSB API](https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API) to communicate directly with the printer over USB Interface 0 (Printer class), the same interface used by the Node.js driver and labelle.

## Browser support

| Browser | Support |
|---|---|
| Chrome 89+ | Yes |
| Edge 89+ | Yes |
| Firefox | No WebUSB |
| Safari | No WebUSB |

WebUSB requires a secure context (`https://` or `localhost`).

## Core flow

1. Call `requestPrinter()` — triggers the browser permission prompt
2. Use `printText`, `printImage`, or `printImageURL`
3. Call `getStatus()` to check tape / ready state
4. Call `disconnect()` when done — releases Interface 0 and closes the USB device
