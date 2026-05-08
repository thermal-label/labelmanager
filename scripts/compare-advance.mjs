#!/usr/bin/env node
// PoC: compare two trailing-advance strategies on a connected LabelManager PnP.
//
// Both prints carry the same visible content but differ in how the
// printed area is pushed past the cutter:
//
//   A) "PAD"  — current strategy. Engine's `forcedTrailingFeedMm: 16`
//               appends ~16 mm of white SYN rows after the content; the
//               firmware then cuts on `ESC A`.
//
//   B) "SYN0"  — bitmap pad disabled (override `forcedTrailingFeedMm = 0`).
//                After the content SYN rows we emit `ESC D 0` (set
//                bytes-per-line to zero) then N × bare `SYN`. Each bare
//                SYN still feeds one dot row but carries no payload, so
//                we get the same physical advance as bitmap padding but
//                ~9× less wire traffic. Prior art: labelle's
//                `_skip_lines` / `_bytes_per_line(0)` (MLF) pattern.
//
// Run on hardware and eyeball the two strips. Things to watch for on B:
//   - Does the printed area land clear of the cutter? (i.e. is the
//     firmware advance >= the head→cutter gap?)
//   - Is the trailing white shorter, longer, or equal to A?
//   - Does the next leading edge (the white before content on a follow-up
//     print) change shape — A relies on half the trailing pad lingering
//     between cutter and head as the next print's leading whitespace.
//
// Usage:
//   node scripts/compare-advance.mjs            # 12 mm tape
//   node scripts/compare-advance.mjs 6|9|12|19  # explicit width

import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const nodePkgRequire = createRequire(resolve(here, '../packages/node/package.json'));
const usbPath = nodePkgRequire.resolve('usb');
const { getDeviceList, InEndpoint, OutEndpoint } = await import(pathToFileURL(usbPath).href);
const core = await import(
  pathToFileURL(resolve(here, '../packages/core/dist/index.js')).href
);
const { renderText, buildPrinterStream, findDevice, STATUS_REQUEST, parseStatus } = core;

const VID = 0x0922;
const PID = 0x1002;
const CHUNK_SIZE = 64;
const WRITE_DELAY_MS = 5;
const ADVANCE_MM = 16; // match engine.forcedTrailingFeedMm so A and B target the same distance
const ADVANCE_DOTS = Math.round((ADVANCE_MM * 180) / 25.4); // 113 at 180 DPI

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitForEnter(prompt) {
  process.stdout.write(prompt);
  return new Promise((resolve) => {
    const onData = () => {
      process.stdin.removeListener('data', onData);
      process.stdin.pause();
      resolve();
    };
    process.stdin.resume();
    process.stdin.once('data', onData);
  });
}

const tapeArg = process.argv[2];
const tapeWidth = tapeArg ? Number(tapeArg) : 12;
if (![6, 9, 12, 19].includes(tapeWidth)) {
  throw new Error(`invalid tape width: ${tapeArg} (expected 6, 9, 12, or 19)`);
}

const device = getDeviceList().find(
  (d) =>
    d.deviceDescriptor.idVendor === VID && d.deviceDescriptor.idProduct === PID,
);
if (!device) throw new Error(`device ${VID.toString(16)}:${PID.toString(16)} not found`);

const entry = findDevice(VID, PID);
if (!entry) throw new Error('device not in registry — cannot derive engine');
const engine = entry.engines[0];
console.log(
  `engine: protocol=${engine.protocol} dpi=${engine.dpi} ` +
    `forcedTrailingFeedMm=${engine.forcedTrailingFeedMm ?? 0} ` +
    `printableArea=${JSON.stringify(engine.printableArea ?? {})}`,
);

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

async function sendStream(stream, label) {
  console.log(`[${label}] stream bytes: ${stream.length}`);
  for (let off = 0; off < stream.length; off += CHUNK_SIZE) {
    const chunk = stream.subarray(off, Math.min(off + CHUNK_SIZE, stream.length));
    await write(chunk);
    await sleep(WRITE_DELAY_MS);
  }
}

// Splice `ESC D 0 + count × SYN` in front of the trailing ESC A. Each
// bare SYN advances one dot row with zero-byte payload (labelle's MLF
// skip-lines trick).
function insertSkipLinesBeforeCut(stream, count) {
  const tail = stream.subarray(stream.length - 2);
  if (tail[0] !== 0x1b || tail[1] !== 0x41) {
    throw new Error(
      `expected stream to end with ESC A (1B 41), got ${tail[0]?.toString(16)} ${tail[1]?.toString(16)}`,
    );
  }
  // ESC D 0 (3 bytes) + count × SYN + ESC A (2 bytes already in stream).
  const out = new Uint8Array(stream.length + 3 + count);
  out.set(stream.subarray(0, stream.length - 2), 0);
  let p = stream.length - 2;
  out.set([0x1b, 0x44, 0x00], p);
  p += 3;
  out.fill(0x16, p, p + count);
  p += count;
  out.set([0x1b, 0x41], p);
  return out;
}

try {
  await write(STATUS_REQUEST);
  const status = parseStatus(await read(64));
  console.log('status:', JSON.stringify(status));
  if (!status.mediaLoaded) throw new Error('printer reports no tape inserted');
  console.log(`tape: ${tapeWidth} mm`);

  // ---------- Print A: current bitmap padding ----------
  const textA = renderText('PAD', { scaleX: 2, scaleY: 2 });
  console.log(`[PAD]  bitmap ${textA.widthPx}x${textA.heightPx}, engine pad ${engine.forcedTrailingFeedMm ?? 0} mm`);
  const streamA = buildPrinterStream(textA, engine, { tapeWidth });
  await sendStream(streamA, 'PAD');

  await waitForEnter('inspect strip A, then press <Enter> to send strip B… ');

  // ---------- Print B: bitmap pad disabled + ESC D 0 + N × SYN ----------
  const textB = renderText('SYN0', { scaleX: 2, scaleY: 2 });
  const engineNoPad = { ...engine, forcedTrailingFeedMm: 0 };
  console.log(
    `[SYN0] bitmap ${textB.widthPx}x${textB.heightPx}, engine pad 0 mm + ` +
      `ESC D 0 + ${ADVANCE_DOTS}× SYN (~${ADVANCE_MM} mm) before ESC A`,
  );
  const streamBraw = buildPrinterStream(textB, engineNoPad, { tapeWidth });
  const streamB = insertSkipLinesBeforeCut(streamBraw, ADVANCE_DOTS);
  console.log(
    `[SYN0] wire delta: A=${streamA.length} B=${streamB.length} ` +
      `(B/A=${(streamB.length / streamA.length).toFixed(2)})`,
  );
  await sendStream(streamB, 'SYN0');

  console.log('done — compare strips');
} finally {
  await iface.releaseAsync();
  device.close();
  console.log('closed');
}
