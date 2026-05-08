#!/usr/bin/env node
// PoC v2: ship a labelle-compatible print stream to the HID interrupt
// OUT endpoint and see if it prints — no ESC @, no ESC G.
//
// The previous HID test (test-hid-path.mjs, since deleted) wrote
// `encodeLabel` output, which begins with ESC @ (1B 40). ESC @ is NOT
// in labelle's D1 opcode set — we cribbed it from generic ESC/POS
// conventions. So the previous "HID poisons the device" observation
// may have been ESC @ poisoning, not HID-transport poisoning.
//
// This PoC writes the exact byte stream `buildPrinterStream` produces
// (the labelle-validated sequence: ESC C 0 / ESC D N / SYN+rows /
// [skip-lines] / ESC A) to the HID interface (IF 2, interrupt EP 1
// OUT) instead of the bulk Printer Class endpoint (IF 0, EP 5 OUT).
//
// labelle itself supports an HID-class interface as a fallback path
// (`bInterfaceClass=HID_INTERFACE_CLASS` in labelle's usb_device.py).
// Whether that fallback works on a LabelManager PnP — which exposes
// both Printer and HID interfaces — is the question this PoC answers.
//
// Confirmed 2026-05-08: HID interface prints D1 data correctly when
// no ESC @ is in the stream. The previous "HID poisoning" was the
// ESC @ opcode, not the HID transport.
//
// This run additionally splices ESC E (1B 45 — labelle's cut opcode)
// in front of the trailing ESC A to characterise its behavior on
// LM_PNP. Outcomes worth watching:
//   - automatic cut after print → ESC E drives the cutter on PnP
//   - no visible behavior → ESC E is a no-op on this chassis (manual
//     cutter); still safe to emit at end-of-job for symmetry with the
//     rest of the D1 family.
//   - any other anomaly (extra advance, status byte change) → record
//     and update the protocol docs.
//
// Usage: node scripts/test-hid-clean.mjs            # 12 mm tape
//        node scripts/test-hid-clean.mjs 6|9|12|19  # explicit width

import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const nodePkgRequire = createRequire(resolve(here, '../packages/node/package.json'));
const usbPath = nodePkgRequire.resolve('usb');
const { getDeviceList, OutEndpoint } = await import(pathToFileURL(usbPath).href);
const core = await import(
  pathToFileURL(resolve(here, '../packages/core/dist/index.js')).href
);
const { renderText, buildPrinterStream, findDevice } = core;

const VID = 0x0922;
const PID = 0x1002;
const HID_INTERFACE_INDEX = 2;
const WRITE_DELAY_MS = 5;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tapeArg = process.argv[2];
const tapeWidth = tapeArg ? Number(tapeArg) : 12;
if (![6, 9, 12, 19].includes(tapeWidth)) {
  throw new Error(`invalid tape width: ${tapeArg} (expected 6, 9, 12, or 19)`);
}

const device = getDeviceList().find(
  (d) => d.deviceDescriptor.idVendor === VID && d.deviceDescriptor.idProduct === PID,
);
if (!device) throw new Error(`device ${VID.toString(16)}:${PID.toString(16)} not found`);

const entry = findDevice(VID, PID);
if (!entry) throw new Error('device not in registry — cannot derive engine');
const engine = entry.engines[0];

device.open();
const iface = device.interface(HID_INTERFACE_INDEX);
console.log(
  `claiming IF ${HID_INTERFACE_INDEX} (class ${iface.descriptor.bInterfaceClass}, ` +
    `${iface.endpoints.length} endpoints)`,
);
if (process.platform === 'linux' && iface.isKernelDriverActive()) {
  console.log('detaching usbhid…');
  iface.detachKernelDriver();
}
iface.claim();

const outEp = iface.endpoints.find((e) => e instanceof OutEndpoint);
if (!outEp) throw new Error('no OUT endpoint on HID interface');
const maxPacket = outEp.descriptor.wMaxPacketSize;
console.log(
  `OUT endpoint: 0x${outEp.descriptor.bEndpointAddress.toString(16)} ` +
    `(transfer type ${outEp.descriptor.bmAttributes & 0x03}, wMaxPacketSize ${maxPacket})`,
);

async function write(buf) {
  await outEp.transferAsync(Buffer.from(buf));
}

// Splice ESC E (1B 45 — labelle's `_cut` opcode) in front of the
// trailing ESC A. Want to see what the firmware does with ESC E on
// LM_PNP — manual-cutter chassis may treat it as a no-op, but the
// labelle code path emits it for every print regardless.
function insertEscEBeforeStatus(stream) {
  const tail = stream.subarray(stream.length - 2);
  if (tail[0] !== 0x1b || tail[1] !== 0x41) {
    throw new Error(
      `expected stream to end with ESC A (1B 41), got ${tail[0]?.toString(16)} ${tail[1]?.toString(16)}`,
    );
  }
  const out = new Uint8Array(stream.length + 2);
  out.set(stream.subarray(0, stream.length - 2), 0);
  out.set([0x1b, 0x45, 0x1b, 0x41], stream.length - 2);
  return out;
}

try {
  const text = renderText('HID+E', { scaleX: 2, scaleY: 2 });
  const baseStream = buildPrinterStream(text, engine, { tapeWidth });
  const stream = insertEscEBeforeStatus(baseStream);
  console.log(`buildPrinterStream produced ${baseStream.length} bytes; +ESC E → ${stream.length}`);
  console.log(
    `head: ${Array.from(stream.subarray(0, 12))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')} … (verify ${stream[0].toString(16)} ${stream[1]
      .toString(16)} ≠ 1b 40 — no ESC @)`,
  );
  console.log(
    `tail: … ${Array.from(stream.subarray(stream.length - 8))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')} (last 4 bytes should be 1b 45 1b 41 — ESC E ESC A)`,
  );
  if (stream[0] === 0x1b && stream[1] === 0x40) {
    throw new Error('stream starts with ESC @ — this PoC is meant to AVOID that');
  }

  // Chunk by interrupt-endpoint MaxPacketSize. Most stacks treat each
  // transferAsync as one URB; smaller-than-max chunks should still
  // work but matching the wire packet size is the conservative choice.
  for (let off = 0; off < stream.length; off += maxPacket) {
    const chunk = stream.subarray(off, Math.min(off + maxPacket, stream.length));
    await write(chunk);
    await sleep(WRITE_DELAY_MS);
  }
  console.log('print sent over HID interrupt OUT — check tape:');
  console.log('  - legible "HID2" → HID interface accepts D1 bytes; previous');
  console.log('    poisoning was ESC @, not HID transport. Update docs.');
  console.log('  - garbage / nothing / device locked → HID transport itself is');
  console.log('    the problem. Power-cycle and stick with Printer Class.');
} finally {
  await iface.releaseAsync();
  if (process.platform === 'linux') {
    try {
      iface.attachKernelDriver();
    } catch (err) {
      console.warn('could not reattach usbhid:', err.message);
    }
  }
  device.close();
  console.log('closed');
}
