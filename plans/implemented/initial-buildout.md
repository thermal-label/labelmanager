# labelmanager — Implementation Plan

> AI agent implementation plan for a TypeScript monorepo providing a clean, cross-platform driver for DYMO D1-tape label printers over USB HID.

---

## 1. Supported Devices & Hardware Compatibility

| Device | USB PID | Tape widths | Status | Notes |
|---|---|---|---|---|
| LabelManager PnP | `0x1002` | 6, 9, 12mm | ✅ Verified | Tested by maintainer |
| LabelManager 420P | `0x1004` | 6, 9, 12, 19mm | 🟡 Expected | Same protocol, different PID |
| LabelManager Wireless PnP | `0x1008` | 6, 9, 12mm | 🟡 Expected | HID over USB when cabled |
| LabelManager PC | `0x1002` | 6, 9, 12mm | 🟡 Expected | Same PID as PnP post-modeswitch |
| LabelPoint 350 | `0x1003` | 6, 9, 12mm | 🟡 Expected | Same protocol family |
| MobileLabeler | `0x1009` | 6, 9, 12mm | 🟡 Expected | Experimental, unconfirmed |

> Have a device marked 🟡 Expected? Run `INTEGRATION=1 pnpm test` and open a
> [hardware verification issue](/.github/ISSUE_TEMPLATE/hardware_verification.md).
> We'll mark it verified and add you to the contributors list.

See `HARDWARE.md` for full details on contributing hardware test results.

---

The DYMO LabelManager PnP and related devices enumerate with three USB interfaces. Print data is sent to **Interface 0 (Printer class)** via raw USB bulk transfers using `libusb` (the `usb` npm package on Node.js) — not via the HID interface. Print data is a **1-bit-per-pixel bitmap**, streamed column-by-column. The protocol is well-understood through community reverse-engineering of the `labelle` Python project.

### Supported Devices

All devices share Vendor ID `0x0922` (Dymo-CoStar Corp.) and use the same protocol and `1b5a01` mode-switch message.

| Device | USB Product ID | Notes |
|---|---|---|
| LabelManager PnP | `0x1002` | Primary target. Reference device. |
| LabelManager 420P | `0x1004` | Same protocol, supports 6/9/12/19mm tape |
| LabelManager Wireless PnP | `0x1008` | HID over USB when cabled |
| LabelManager PC | `0x1001` → `0x1002` | Requires mode-switch |
| LabelPoint 350 | `0x1003` | Same HID protocol |
| MobileLabeler | `0x1009` | Experimental — same protocol, unconfirmed |

> **Note:** The LabelManager 280 (`0x1005`) is a regular USB printer class device — it is **not** HID and is out of scope.

### D1 Tape Width → Print Head Dots

| Tape width | Printable dots | Top margin | Bottom margin |
|---|---|---|---|
| 6 mm | 32 | 16 | 16 |
| 9 mm | 48 | 8 | 8 |
| 12 mm | 64 | 0 | 0 |
| 19 mm | 64 | 0 | 0 (wider tape, same head) |

### Core Protocol Commands

| Command | Bytes | Purpose |
|---|---|---|
| Media type (tape) | `1b 43 00` | Select tape/D1 mode — always send first |
| Bytes per line | `1b 44 <N>` | N = ceil(printable_dots / 8); set before bitmap data |
| Bitmap column | `16` + N bytes | One column of pixels, MSB first |
| Status query / flush | `1b 41` | Terminate print job; printer responds with 1-byte status on EP 5 IN |

Commands are sent as raw USB bulk transfers to **EP 5 OUT** (Interface 0). Do **not** send `ESC @` (`1b 40`) over this interface — it corrupts the printer's parser state.

### Linux Mode-Switch Requirement

On Linux, the device initially presents as mass storage (`PID 0x1001`). A udev rule + `usb_modeswitch` sends `1b5a01` to switch it to HID mode (`PID 0x1002`). This is a one-time system configuration; the driver itself does not handle it. The agent should generate ready-to-use udev config files.

---

## 1. Repository Structure

```
labelmanager/
├── .github/
│   ├── FUNDING.yml
│   ├── ISSUE_TEMPLATE/
│   │   └── hardware_verification.md
│   └── workflows/
│       ├── ci.yml
│       ├── release.yml
│       └── docs.yml
├── packages/
│   ├── core/                   # @thermal-label/labelmanager-core
│   ├── node/                   # @thermal-label/labelmanager-node
│   ├── cli/                    # @thermal-label/labelmanager-cli
│   └── web/                    # @thermal-label/labelmanager-web
├── docs/                       # VitePress documentation site
├── LICENSE
├── HARDWARE.md
├── eslint.config.js
├── pnpm-workspace.yaml
├── package.json                # Root — scripts only, no deps
└── tsconfig.base.json
```

---

## 2. Tooling & Configuration

### 2.1 Runtime & Package Manager

- **Node.js**: `>=24.0.0` (engines field in all `package.json`)
- **Package manager**: `pnpm >=9.0.0`
- **TypeScript**: `~5.5.0`

### 2.2 `LICENSE`

MIT license, copyright Mannes Brak, current year. Use the standard MIT
license text.

### 2.3 `.github/FUNDING.yml`

```yaml
github: mannes
ko_fi: mannes
```

### 2.4 Root `package.json`

```json
{
  "name": "labelmanager",
  "private": true,
  "engines": { "node": ">=24.0.0", "pnpm": ">=9.0.0" },
  "prettier": "@mbtech-nl/prettier-config",
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "test:coverage": "pnpm -r run test:coverage",
    "lint": "eslint packages",
    "format": "prettier --write packages docs",
    "typecheck": "pnpm -r run typecheck",
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:api": "typedoc --plugin typedoc-plugin-markdown --out docs/api packages/*/src/index.ts",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.0.0",
    "@mbtech-nl/eslint-config": "^1.0.0",
    "@mbtech-nl/prettier-config": "^1.0.0",
    "@mbtech-nl/tsconfig": "^1.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "typedoc": "^0.26.0",
    "typedoc-plugin-markdown": "^4.0.0",
    "typescript": "~5.5.0",
    "vitepress": "^1.0.0",
    "vitest": "^2.0.0"
  }
}
```

### 2.5 `eslint.config.js`

```js
import mbtech from '@mbtech-nl/eslint-config';
export default [...mbtech];
```

### 2.6 `tsconfig.base.json`

No longer defines compiler options from scratch — extends the shared config
and only adds project-level settings shared across all packages in this repo.

```json
{
  "extends": "@mbtech-nl/tsconfig/node",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

Each package's own `tsconfig.json` extends this and sets `rootDir`/`outDir`.
Browser-facing packages (`@thermal-label/labelmanager-web`) extend
`@mbtech-nl/tsconfig/browser` directly instead.

### 2.7 Per-Package `package.json` Common Fields

Every package under `packages/` must include these fields:

```json
{
  "author": "Mannes Brak",
  "license": "MIT",
  "homepage": "https://github.com/thermal-label/labelmanager",
  "repository": {
    "type": "git",
    "url": "https://github.com/thermal-label/labelmanager.git",
    "directory": "packages/<package-name>"
  },
  "funding": [
    { "type": "github", "url": "https://github.com/sponsors/mannes" },
    { "type": "ko-fi",  "url": "https://ko-fi.com/mannes" }
  ],
  "sideEffects": false
}
```

### 2.8 Testing

Use **Vitest** in all packages. Each package has its own `vitest.config.ts`.
Hardware-dependent tests are gated behind `DYMO_INTEGRATION=1` and skipped
in CI. Coverage is collected and uploaded to Codecov on every CI run.

---

## 3. Package: `@thermal-label/labelmanager-core`

**Path:** `packages/core/`  
**Purpose:** Protocol implementation, bitmap pipeline, device registry. Zero runtime dependencies (pure TypeScript, no Node.js builtins). This is the shared logic consumed by all other packages.

### 3.1 Dependencies

```json
{
  "name": "@thermal-label/labelmanager-core",
  "dependencies": {
    "@mbtech-nl/bitmap": "^0.1.0"
  },
  "devDependencies": {
    "@mbtech-nl/tsconfig": "^1.0.0",
    "@types/node": "^22.0.0",
    "typescript": "~5.5.0",
    "vitest": "^2.0.0"
  }
}
```

### 3.2 Public API

`core` re-exports the types and rendering functions from `@mbtech-nl/bitmap`
that consumers need, so downstream packages only need to depend on
`@thermal-label/labelmanager-core` — not on `@mbtech-nl/bitmap` directly.

```typescript
// Re-exported from @mbtech-nl/bitmap — consumers use these directly
export type { LabelBitmap, RawImageData } from '@mbtech-nl/bitmap';
export { renderText, renderImage } from '@mbtech-nl/bitmap';

// Device registry
export const DEVICES: Record<string, DeviceDescriptor>;
export function findDevice(vid: number, pid: number): DeviceDescriptor | undefined;

// Protocol encoding — takes a LabelBitmap and produces HID report payloads
export function encodeLabel(bitmap: LabelBitmap, options?: PrintOptions): Uint8Array[];

// Types
export type TapeWidth = 6 | 9 | 12 | 19;
export interface DeviceDescriptor {
  name: string;
  vid: number;
  pid: number;
  supportedTapes: TapeWidth[];
  experimental?: boolean;
}
export interface PrintOptions { density?: 'normal' | 'high'; copies?: number; }
```

### 3.3 Device Registry (`src/devices.ts`)

```typescript
export const DEVICES = {
  LABELMANAGER_PNP:          { name: 'LabelManager PnP',          vid: 0x0922, pid: 0x1002, supportedTapes: [6, 9, 12] },
  LABELMANAGER_420P:         { name: 'LabelManager 420P',         vid: 0x0922, pid: 0x1004, supportedTapes: [6, 9, 12, 19] },
  LABELMANAGER_WIRELESS_PNP: { name: 'LabelManager Wireless PnP', vid: 0x0922, pid: 0x1008, supportedTapes: [6, 9, 12] },
  LABELMANAGER_PC:           { name: 'LabelManager PC',           vid: 0x0922, pid: 0x1002, supportedTapes: [6, 9, 12] },
  LABELPOINT_350:            { name: 'LabelPoint 350',            vid: 0x0922, pid: 0x1003, supportedTapes: [6, 9, 12] },
  MOBILE_LABELER:            { name: 'MobileLabeler',             vid: 0x0922, pid: 0x1009, supportedTapes: [6, 9, 12], experimental: true },
} as const satisfies Record<string, DeviceDescriptor>;
```

### 3.4 Protocol Encoder (`src/protocol.ts`)

- `buildResetSequence(): Uint8Array[]` — reset + media type + density commands
- `buildBitmapRows(bitmap: LabelBitmap): Uint8Array[]` — one 64-byte report
  per column of pixels using `iterRows` from `@mbtech-nl/bitmap`
- `buildFormFeed(): Uint8Array[]` — form-feed / cut command
- `encodeLabel(bitmap, options)` — calls the above in sequence, returns all reports

Each report must be exactly 64 bytes (zero-padded). The bitmap is streamed
**column-by-column** (the printer rotates 90° — use `rotateBitmap` from
`@mbtech-nl/bitmap` before encoding if the input is in label orientation).

### 3.5 Tests (`src/__tests__/`)

- `protocol.test.ts` — byte sequences for each command, report length exactly
  64, correct zero-padding, rotation applied correctly
- `devices.test.ts` — `findDevice` lookups, exhaustive registry coverage

---

## 4. Package: `@thermal-label/labelmanager-node`

**Path:** `packages/node/`
**Purpose:** Node.js driver. Wraps `@thermal-label/labelmanager-core` with the `usb` npm package (libusb) for raw USB communication over Interface 0 (Printer class).

### 4.1 Dependencies

```json
{
  "dependencies": {
    "@thermal-label/labelmanager-core": "workspace:*",
    "usb": "^2.0.0"
  },
  "devDependencies": {
    "@mbtech-nl/tsconfig": "^1.0.0",
    "@types/node": "^22.0.0",
    "typescript": "~5.5.0",
    "vitest": "^2.0.0"
  }
}
```

`usb` is a native addon wrapping libusb — prebuilt binaries are available for macOS,
Windows, and Linux x86/arm64. Image loading in the node package
uses `@napi-rs/canvas` as an **optional** dependency for decoding PNG/JPEG
files passed to `printImage`. If not installed, only pre-decoded `RawImageData`
is accepted.

### 4.2 Public API

```typescript
// Discovery
export function listPrinters(): PrinterInfo[];
export function openPrinter(options?: OpenOptions): DymoPrinter;

// Printer instance
export class DymoPrinter {
  readonly device: DeviceDescriptor;
  printText(text: string, options?: TextPrintOptions): Promise<void>;
  printImage(image: Buffer | string, options?: ImagePrintOptions): Promise<void>; // Buffer = raw PNG/JPEG, string = file path
  getStatus(): Promise<PrinterStatus>;
  close(): void;
}

export interface OpenOptions {
  vid?: number;
  pid?: number;
  serialNumber?: string;  // for multi-printer setups
}

export interface PrinterInfo {
  device: DeviceDescriptor;
  serialNumber: string | undefined;
  path: string;
}

export interface PrinterStatus {
  ready: boolean;
  tapeInserted: boolean;
  labelLow: boolean;
}
```

### 4.3 Implementation Notes

- Claim Interface 0 (Printer class) via `usb`. On Linux, detach the `usblp` kernel driver before claiming.
- `printText` pipeline: text → `core.renderText` → `core.buildPrinterStream` → bulk-write to EP 5 OUT in 64-byte chunks
- `printImage` pipeline: load file/buffer → decode via `@napi-rs/canvas` or `sharp` (peer dep) → `core.renderImage` → `core.buildPrinterStream` → bulk-write
- Add 5ms delay between chunk writes for flow control (full synwait not yet implemented)
- `getStatus()` sends `ESC A` to EP 5 OUT and reads the 1-byte status response from EP 5 IN
- Implement graceful cleanup: `close()` must always be callable, even if device was never opened
- Export a Linux udev rule generator: `generateUdevRules(): string` — returns ready-to-paste udev rule content

### 4.4 Tests (`src/__tests__/`)

- Mock `usb` with `vi.mock`
- `printer.test.ts`: assert correct sequence of bulk writes for text print, image print
- `discovery.test.ts`: `listPrinters` filters by known VID/PID
- Integration tests (skipped in CI unless `DYMO_INTEGRATION=1`): `integration/print.test.ts` — actually prints a test label

---

## 5. Package: `@thermal-label/labelmanager-cli`

**Path:** `packages/cli/`  
**Purpose:** CLI tool. Thin wrapper over `@thermal-label/labelmanager-node`.

### 5.1 Dependencies

```json
{
  "dependencies": {
    "@thermal-label/labelmanager-node": "workspace:*",
    "commander": "^12.x",
    "chalk": "^5.x",
    "ora": "^8.x"
  }
}
```

### 5.2 Commands

```
dymo list                          # List connected DYMO printers
dymo print text <text> [options]   # Print a text label
dymo print image <file> [options]  # Print an image
dymo status                        # Show printer status
dymo setup linux                   # Print udev rule setup instructions + generated config
```

#### `print text` options

```
-t, --tape <width>       Tape width in mm (6, 9, 12, 19) [default: 12]
-i, --invert             White text on black background
-d, --density <level>    Print density: normal | high [default: normal]
-s, --serial <sn>        Target a specific printer by serial number
```

#### `print image` options

```
-t, --tape <width>       Tape width in mm [default: 12]
--dither                 Use Floyd-Steinberg dithering [default: false]
--threshold <0-255>      Threshold for B&W conversion [default: 128]
-i, --invert             Invert image
```

### 5.3 Entry Point

`src/index.ts` — exports a `run()` function called by `bin/dymo.js`. The bin file is a plain JS shim:

```js
#!/usr/bin/env node
import('../dist/index.js').then(m => m.run());
```

### 5.4 `package.json` bin field

```json
{
  "bin": { "dymo": "./bin/dymo.js" }
}
```

### 5.5 Tests

- `commands/text.test.ts`: mock `@thermal-label/labelmanager-node`, assert `printText` called with correct args
- `commands/image.test.ts`: mock filesystem read + `@thermal-label/labelmanager-node`
- `commands/list.test.ts`: assert formatted output for 0 and N printers

---

## 6. Package: `@thermal-label/labelmanager-web`

**Path:** `packages/web/`
**Purpose:** Browser-compatible package using the WebUSB API (Chrome/Edge 89+). No Node.js APIs — pure browser.

### 6.1 Dependencies

```json
{
  "dependencies": {
    "@thermal-label/labelmanager-core": "workspace:*"
  },
  "peerDependencies": {
    "typescript": ">=5.0"
  }
}
```

No native deps. Ships as ESM only.

### 6.2 Public API

```typescript
// Request and connect to a printer (triggers browser permission dialog)
export async function requestPrinter(options?: RequestOptions): Promise<WebDymoPrinter>;

// Use an already-opened USBDevice
export function fromUSBDevice(device: USBDevice): WebDymoPrinter;

export class WebDymoPrinter {
  readonly device: USBDevice;
  readonly descriptor: DeviceDescriptor;
  printText(text: string, options?: TextPrintOptions): Promise<void>;
  printImage(imageData: ImageData, options?: ImagePrintOptions): Promise<void>; // browser ImageData
  printImageURL(url: string, options?: ImagePrintOptions): Promise<void>;
  getStatus(): Promise<PrinterStatus>;
  isConnected(): boolean;
  disconnect(): Promise<void>;
}

export interface RequestOptions {
  filters?: USBDeviceFilter[];  // defaults to all known DYMO devices
}
```

### 6.3 Implementation Notes

- `requestPrinter()` calls `navigator.usb.requestDevice({ filters })` → `open()` → `selectConfiguration(1)` → `claimInterface(0)`
- Print data is sent via `device.transferOut(5, chunk)` in 64-byte chunks to EP 5 OUT
- `getStatus()` sends `ESC A` via `transferOut`, reads 1-byte response via `transferIn(5, 64)`
- `printImageURL` uses `fetch` + `createImageBitmap` + an `OffscreenCanvas` to get `ImageData`
- **No canvas fallback for text rendering** — the web package uses the pixel font from `@mbtech-nl/bitmap` via `@thermal-label/labelmanager-core`
- Requires a secure context (`https://` or `localhost`); supported in Chrome 89+ and Edge 89+

### 6.4 Build Output

ESM only. No CommonJS. `package.json` exports:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "type": "module"
}
```

### 6.5 Tests

- Vitest with `jsdom` environment — mock `navigator.usb`
- `webusb-mock.ts`: a test helper that creates a fake `USBDevice` with a `transferOut` spy
- `printer.test.ts`: assert correct transfer sequence for text/image print via mocked USBDevice
- `request.test.ts`: assert filters passed to `navigator.usb.requestDevice` match device registry

---

## 7. Documentation (`docs/`)

Use **VitePress** with a custom theme. Deployed to GitHub Pages via `docs.yml` workflow.

### 7.1 Site Structure

```
docs/
├── index.md                   # Landing page — hero, feature cards, quick install, live demo
├── guide/
│   ├── introduction.md        # What this is, supported devices table
│   ├── getting-started.md     # Install + first label in 5 minutes
│   └── linux-setup.md         # udev / usb_modeswitch walkthrough
├── node/
│   ├── index.md               # @thermal-label/labelmanager-node overview
│   ├── printing-text.md       # printText usage, options, examples
│   ├── printing-images.md     # printImage, supported formats
│   └── multi-printer.md       # serialNumber targeting
├── cli/
│   ├── index.md               # @thermal-label/labelmanager-cli overview
│   └── commands.md            # All commands, options, examples (with terminal output blocks)
├── web/
│   ├── index.md               # @thermal-label/labelmanager-web overview, browser support table
│   ├── quick-start.md         # requestPrinter + printText in a vanilla JS page
│   └── react-example.md       # React hook wrapping WebDymoPrinter
├── api/
│   ├── core.md                # auto-generated via typedoc-plugin-markdown
│   ├── node.md
│   ├── cli.md
│   └── web.md
└── .vitepress/
    ├── config.ts
    └── theme/
        ├── index.ts           # Custom theme extending default, registers LiveDemo globally
        └── components/
            └── LiveDemo.vue   # Interactive label designer component
```

### 7.2 Landing Page Requirements

- Hero section: project name, one-line description, `npm install` / `pnpm add` commands
- Feature cards: "Node.js", "Browser (WebHID)", "CLI", "TypeScript-first", "Zero config"
- Supported devices table (same as section 1 above)
- Quick example code block showing a label printed in 3 lines
- `<LiveDemo />` component embedded below the quick example

### 7.3 Live Browser Demo (`LiveDemo.vue`)

An interactive label designer embedded directly in the docs landing page.
Works in Chrome/Edge via WebHID — no installation, no backend, no proxy.
The GitHub Pages URL is the demo.

**What it does:**
- Detects a connected supported printer via WebUSB on button press
- Text input field with tape width selector (6 / 9 / 12mm)
- Invert toggle, density selector
- Live pixel-accurate bitmap preview canvas showing the actual 1bpp output
  (rendered via `@mbtech-nl/bitmap`, updated on every keystroke)
- Print button — sends encoded HID reports directly to the connected printer
- Clear browser support note: Chrome/Edge only for printing (WebUSB); preview works everywhere

**Implementation:**
- Located at `docs/.vitepress/theme/components/LiveDemo.vue`
- Imports `@thermal-label/labelmanager-web` (built to ESM) for printer communication
- Imports `@mbtech-nl/bitmap` for the live bitmap preview
- Registered globally in `docs/.vitepress/theme/index.ts` so it can be used
  in any `.md` file as `<LiveDemo />`
- The VitePress build must include `@thermal-label/labelmanager-web` and
  `@mbtech-nl/bitmap` as dependencies of the docs site — add them to
  `docs/package.json` or the root devDependencies

**Usage in `docs/index.md`:**

```md
## Try it live

Connect your DYMO LabelManager and print a label directly from your browser.

<LiveDemo />

> Requires Chrome or Edge. [Why?](/guide/introduction#browser-support)
```

### 7.4 API Reference Generation

Use `typedoc` + `typedoc-plugin-markdown` to auto-generate `docs/api/*.md`
from TSDoc comments. All exported functions and classes in all packages must
have TSDoc comments (`@param`, `@returns`, `@throws`, `@example`).

### 7.5 VitePress Config (`docs/.vitepress/config.ts`)

```typescript
export default defineConfig({
  title: 'labelmanager',
  description: 'TypeScript driver for DYMO D1 label printers',
  base: '/labelmanager/',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Node.js', link: '/node/' },
      { text: 'CLI', link: '/cli/' },
      { text: 'Web', link: '/web/' },
      { text: 'API', link: '/api/core' },
    ],
    sidebar: { /* full sidebar per section */ },
    socialLinks: [{ icon: 'github', link: 'https://github.com/thermal-label/labelmanager' }],
    search: { provider: 'local' },
  },
})
```

---

## 8. CI/CD (`/.github/workflows/`)

### 8.1 `ci.yml` — push to main and PRs targeting main

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    name: CI
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v5
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Format check
        run: prettier --check "packages/**/*.ts"

      - name: Test with coverage
        run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v5
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          flags: unittests
          fail_ci_if_error: true

      - name: Build
        run: pnpm build
```

> **Operator setup:** add `CODECOV_TOKEN` as a repository secret. Obtain
> the token from codecov.io after connecting the repo. Add CI and coverage
> badges to the root README (see section 9).

### 8.2 `release.yml` — version tag push (`v*`)

Uses npm trusted publishing — no `NPM_TOKEN` secret required. Configure
the trusted publisher on npmjs.com for each scoped package before the
first release.

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write
  id-token: write

jobs:
  release:
    name: Publish & Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v5
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test

      - name: Publish packages
        run: pnpm release

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
          make_latest: true
```

### 8.3 `docs.yml` — push to main

```yaml
name: Docs

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    name: Deploy docs
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v5
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate API reference
        run: pnpm docs:api

      - name: Build docs
        run: pnpm docs:build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

      - uses: actions/deploy-pages@v4
        id: deployment
```

---

## 9. Implementation Sequence (for the agent)

Work through packages in this order to minimize blocked dependencies:

1. **Scaffold** — `LICENSE`, `.github/FUNDING.yml`, root `package.json`,
   `eslint.config.js`, `tsconfig.base.json`, `pnpm-workspace.yaml`,
   `.gitignore`, `.changeset/` directory, GitHub Actions workflows,
   `.github/ISSUE_TEMPLATE/hardware_verification.md`
2. **`@thermal-label/labelmanager-core`** — device registry → protocol encoder →
   text renderer (via `@mbtech-nl/bitmap`) → image renderer → all unit tests
3. **`@thermal-label/labelmanager-node`** — `node-hid` wrapper → discovery →
   `DymoPrinter` class → udev generator → mocked tests
4. **`@thermal-label/labelmanager-cli`** — commander setup → `list` → `print text`
   → `print image` → `status` → `setup linux` → tests
5. **`@thermal-label/labelmanager-web`** — WebHID wrapper → `requestPrinter` →
   `WebDymoPrinter` → mocked tests
6. **Docs** — VitePress config → all `.md` files → TSDoc comments on all
   exported symbols → `typedoc` integration → `LiveDemo.vue` component
   (implement after `@thermal-label/labelmanager-web` is working)
7. **CI** — verify all GitHub Actions steps pass, configure GitHub Pages,
   connect Codecov, add badges to root README
8. **HARDWARE.md** — full compatibility table, verification instructions,
   hardware donation note

---

## 10. Key Constraints & Agent Notes

- **Never** import Node.js built-ins (`fs`, `path`, `os`) in
  `@thermal-label/labelmanager-core` or `@thermal-label/labelmanager-web`
- **USB bulk transfers are sent in 64-byte chunks** to EP 5 OUT (Interface 0, Printer class).
- The bitmap is rotated 90° relative to the label orientation. A label
  that is W columns wide requires W HID report writes (one per pixel column,
  left-to-right on the printed label = top-to-bottom in bitmap memory).
- Linux users need `usb_modeswitch`. The `setup linux` CLI command and the
  Linux setup doc page must clearly explain this. The `generateUdevRules()`
  function in `@thermal-label/labelmanager-node` must emit correct, copy-paste-ready
  config.
- On Windows, `node-hid` may require the device driver to be replaced with
  WinUSB via [Zadig](https://zadig.akeo.ie/). Document this in
  `guide/getting-started.md`.
- The `@thermal-label/labelmanager-web` package must compile cleanly without
  `lib: ["DOM"]` in `@thermal-label/labelmanager-core`'s tsconfig — keep DOM types
  scoped to the web package only. Web package extends
  `@mbtech-nl/tsconfig/browser` directly.
- Vitest `vi.mock` for `node-hid` must be in
  `packages/node/src/__tests__/__mocks__/node-hid.ts` and auto-discovered
  via Vitest's module mock resolution.
- All `package.json` files must declare `"sideEffects": false`.
- Use Changesets for versioning — `.changeset/` directory and changeset
  scripts are set up in scaffold step.
- Do **not** use `@mbtech-nl/bitmap`'s internal `renderText` / `renderImage`
  directly in `core` — re-export from `@mbtech-nl/bitmap` and delegate.
  The `core` package depends on `@mbtech-nl/bitmap` as a runtime dependency.
- `@types/node` is required as a devDependency in any package extending
  `@mbtech-nl/tsconfig/node`.
- Root README must include the following badges:

```markdown
[![CI](https://github.com/thermal-label/labelmanager/actions/workflows/ci.yml/badge.svg)](https://github.com/thermal-label/labelmanager/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/thermal-label/labelmanager/branch/main/graph/badge.svg)](https://codecov.io/gh/thermal-label/labelmanager)
[![npm](https://img.shields.io/npm/v/@thermal-label/labelmanager-core)](https://npmjs.com/package/@thermal-label/labelmanager-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
```