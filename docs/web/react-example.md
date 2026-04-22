# React Example

```tsx
import { useState } from "react";
import { requestPrinter, type WebDymoPrinter } from "@thermal-label/labelmanager-web";

export function PrintButton() {
  const [printer, setPrinter] = useState<WebDymoPrinter | null>(null);

  async function connect() {
    setPrinter(await requestPrinter());
  }

  async function print() {
    if (!printer) return;
    await printer.printText("React label", { tapeWidth: 12 });
  }

  async function disconnect() {
    if (!printer) return;
    await printer.disconnect();
    setPrinter(null);
  }

  return (
    <div>
      <button onClick={connect} disabled={!!printer}>Connect</button>
      <button onClick={print} disabled={!printer}>Print</button>
      <button onClick={disconnect} disabled={!printer}>Disconnect</button>
    </div>
  );
}
```

This pattern keeps WebUSB permission and device references in component state.
`disconnect()` releases USB Interface 0 and closes the device — call it when
the component unmounts or the user is done printing.
