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
    await printer.printText("React label");
  }

  return (
    <div>
      <button onClick={connect}>Connect</button>
      <button onClick={print} disabled={!printer}>Print</button>
    </div>
  );
}
```

This pattern keeps WebHID permission and device references in component state.
