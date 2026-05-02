#!/usr/bin/env node
// Sanity-check print on a connected DYMO LabelManager (verified PnP 0922:1002).
//
// Goals:
//   1. Confirm the print path end-to-end on real hardware.
//   2. Read orientation off the resulting strip:
//        - "HEAD" should appear on the LEADING edge of the tape.
//        - The arrow ">>>" points TOWARDS the trailing end.
//        - "TAIL" should appear on the TRAILING edge.
//        - "ABC123" makes upside-down obvious.
//   3. Guarantee >=5 mm of blank tape after the image (cutter sits ~5 mm
//      past the print head). The protocol's right padding is already
//      ~8 mm, so the requirement is met by default; logged here for
//      transparency.
//
// We bypass `@thermal-label/transport/node`'s package entry because it
// statically imports `serialport`, which isn't installed in this repo.

// Resolve `usb` via the labelmanager-node package's node_modules — the
// top-level node_modules has no `usb` symlink under pnpm. The core
// package is imported directly from its built dist file to avoid ESM
// `exports`-resolution surprises with `require.resolve`.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const nodePkgRequire = createRequire(
  resolve(here, '../packages/node/package.json'),
);
const usbPath = nodePkgRequire.resolve('usb');
const { getDeviceList, InEndpoint, OutEndpoint } = await import(pathToFileURL(usbPath).href);
const { renderText, buildPrinterStream, STATUS_REQUEST, parseStatus } = await import(
  pathToFileURL(resolve(here, '../packages/core/dist/index.js')).href
);
const { padBitmap } = await import(
  pathToFileURL(
    resolve(here, '../packages/core/node_modules/@mbtech-nl/bitmap/dist/transform.js'),
  ).href
);

const VID = 0x0922;
const PID = 0x1002;
const DPI = 180;
const CHUNK_SIZE = 64;
const WRITE_DELAY_MS = 5;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mmToDots = (mm) => Math.round((mm / 25.4) * DPI);

const device = getDeviceList().find(
  (d) =>
    d.deviceDescriptor.idVendor === VID && d.deviceDescriptor.idProduct === PID,
);
if (!device) throw new Error(`device ${VID.toString(16)}:${PID.toString(16)} not found`);

device.open();
const iface = device.interface(0);
if (process.platform === 'linux' && iface.isKernelDriverActive()) {
  iface.detachKernelDriver();
}
iface.claim();

const inEp = iface.endpoints.find((e) => e instanceof InEndpoint);
const outEp = iface.endpoints.find((e) => e instanceof OutEndpoint);
if (!inEp || !outEp) throw new Error('missing bulk IN/OUT endpoint on interface 0');

async function write(buf) {
  await outEp.transferAsync(Buffer.from(buf));
}

async function read(length, timeoutMs = 1000) {
  inEp.timeout = timeoutMs;
  const buf = await inEp.transferAsync(length);
  return buf ? new Uint8Array(buf) : new Uint8Array(0);
}

try {
  await write(STATUS_REQUEST);
  const raw = await read(64);
  const status = parseStatus(raw);
  console.log('status:', JSON.stringify(status, null, 2));

  if (!status.mediaLoaded) throw new Error('printer reports no tape inserted');

  // LabelManager status byte cannot report tape width — caller must pass it.
  const tapeArg = process.argv[2];
  const tapeWidth = tapeArg ? Number(tapeArg) : 12;
  if (![6, 9, 12, 19].includes(tapeWidth)) {
    throw new Error(`invalid tape width: ${tapeArg} (expected 6, 9, 12, or 19)`);
  }
  console.log(`tape: ${tapeWidth} mm (pass via argv[2] to override)`);

  const text = renderText('H>T', { scaleX: 2, scaleY: 2 });
  console.log(`source bitmap: ${text.widthPx}x${text.heightPx} px`);

  // Add 5 mm of trailing tape on top of the protocol's internal 57-dot
  // (~8 mm) right pad. Source-bitmap height is `text.heightPx`, output
  // height is 64 (12 mm tape), so source dots scale by 64 / heightPx.
  const targetExtraDots = mmToDots(5);
  const sourceExtraDots = Math.ceil(targetExtraDots / (64 / text.heightPx));
  const bitmap = padBitmap(text, { right: sourceExtraDots });
  console.log(
    `extra trailing pad: ${sourceExtraDots} src dots → ${targetExtraDots} output dots = 5 mm ` +
      `(on top of protocol's 57-dot ~8 mm right pad → total ~13 mm trailing)`,
  );

  const stream = buildPrinterStream(bitmap, { tapeWidth });
  console.log(`stream bytes: ${stream.length}`);

  for (let off = 0; off < stream.length; off += CHUNK_SIZE) {
    const chunk = stream.subarray(off, Math.min(off + CHUNK_SIZE, stream.length));
    await write(chunk);
    await sleep(WRITE_DELAY_MS);
  }
  console.log('print sent');
} finally {
  await iface.releaseAsync();
  device.close();
  console.log('closed');
}
