#!/usr/bin/env node
// Aggregates packages/core/data/devices/*.json5 into the compiled
// runtime artifacts:
//
//   - data/devices.json — plain JSON, the published artifact loaded by
//     downstream tooling (validator, docs aggregator).
//   - src/devices.generated.ts — typed re-export consumed by src/devices.ts.
//   - data/media.json + src/media.generated.ts — same pair for the D1
//     cartridge registry.
//
// Invariants enforced before write: every entry has at least one engine,
// every engine carries a known `protocol` tag, transport-USB PIDs are
// unique across the registry (after the §3 PID-collision fixes), keys
// are unique, and `support.status` is one of the contracts values. Bad
// input fails the build; nothing partial is written.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSON5 from 'json5';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const CORE_PKG = resolve(REPO_ROOT, 'packages/core');
const DEVICES_DIR = resolve(CORE_PKG, 'data/devices');
const MEDIA_FILE = resolve(CORE_PKG, 'data/media.json5');
const DEVICES_OUT = resolve(CORE_PKG, 'data/devices.json');
const MEDIA_OUT = resolve(CORE_PKG, 'data/media.json');
const DEVICES_TS = resolve(CORE_PKG, 'src/devices.generated.ts');
const MEDIA_TS = resolve(CORE_PKG, 'src/media.generated.ts');

const DRIVER = 'labelmanager';
const SCHEMA_VERSION = 1;
const KNOWN_PROTOCOLS = new Set(['d1-tape']);
const STATUS_VALUES = new Set(['verified', 'partial', 'broken', 'untested']);

const errors = [];
const fail = msg => errors.push(msg);

function readJson5(path) {
  return JSON5.parse(readFileSync(path, 'utf8'));
}

function loadDevices() {
  const files = readdirSync(DEVICES_DIR)
    .filter(f => f.endsWith('.json5'))
    .sort();

  const seenKeys = new Set();
  const seenUsbPids = new Map(); // pid -> key
  const devices = [];

  for (const filename of files) {
    const path = join(DEVICES_DIR, filename);
    let entry;
    try {
      entry = readJson5(path);
    } catch (err) {
      fail(`${filename}: parse error — ${err.message}`);
      continue;
    }

    if (typeof entry?.key !== 'string') {
      fail(`${filename}: missing string \`key\``);
      continue;
    }
    if (seenKeys.has(entry.key)) {
      fail(`${filename}: duplicate key \`${entry.key}\``);
      continue;
    }
    seenKeys.add(entry.key);

    if (entry.family !== DRIVER) {
      fail(`${filename}: family must be "${DRIVER}" (got ${JSON.stringify(entry.family)})`);
    }

    const transports = entry.transports;
    if (!transports || typeof transports !== 'object') {
      fail(`${filename}: \`transports\` must be a keyed object`);
    } else {
      if (transports.usb) {
        const { vid, pid } = transports.usb;
        if (typeof vid !== 'string' || !/^0x[0-9a-fA-F]+$/.test(vid)) {
          fail(`${filename}: transports.usb.vid must be a hex string (got ${JSON.stringify(vid)})`);
        }
        if (typeof pid !== 'string' || !/^0x[0-9a-fA-F]+$/.test(pid)) {
          fail(`${filename}: transports.usb.pid must be a hex string (got ${JSON.stringify(pid)})`);
        }
        const collision = seenUsbPids.get(pid);
        if (collision) {
          fail(`${filename}: USB pid ${pid} already used by \`${collision}\``);
        } else {
          seenUsbPids.set(pid, entry.key);
        }
      }
    }

    if (!Array.isArray(entry.engines) || entry.engines.length === 0) {
      fail(`${filename}: \`engines\` must be a non-empty array`);
    } else {
      for (const [i, eng] of entry.engines.entries()) {
        if (typeof eng?.protocol !== 'string' || !KNOWN_PROTOCOLS.has(eng.protocol)) {
          fail(
            `${filename}: engines[${i}].protocol must be one of ${[...KNOWN_PROTOCOLS].join('|')} (got ${JSON.stringify(eng?.protocol)})`,
          );
        }
        if (typeof eng?.headDots !== 'number') {
          fail(`${filename}: engines[${i}].headDots must be a number`);
        }
        if (typeof eng?.dpi !== 'number') {
          fail(`${filename}: engines[${i}].dpi must be a number`);
        }
        if (typeof eng?.role !== 'string') {
          fail(`${filename}: engines[${i}].role must be a string`);
        }
      }
    }

    if (!entry.support || !STATUS_VALUES.has(entry.support.status)) {
      fail(
        `${filename}: \`support.status\` must be one of ${[...STATUS_VALUES].join('|')} (got ${JSON.stringify(entry.support?.status)})`,
      );
    }

    devices.push(entry);
  }

  return devices;
}

function loadMedia() {
  const entries = readJson5(MEDIA_FILE);
  if (!Array.isArray(entries)) {
    fail(`media.json5: top-level must be an array`);
    return [];
  }
  const seenIds = new Set();
  for (const [i, m] of entries.entries()) {
    if (m?.id == null) fail(`media[${i}]: missing \`id\``);
    else if (seenIds.has(m.id)) fail(`media[${i}]: duplicate id \`${m.id}\``);
    else seenIds.add(m.id);
    if (typeof m?.widthMm !== 'number') fail(`media[${i}]: widthMm must be a number`);
    if (typeof m?.type !== 'string') fail(`media[${i}]: type must be a string`);
  }
  return entries;
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeGeneratedTs(path, imports, exportName, typeAnnotation, value) {
  const body = `// AUTO-GENERATED by scripts/compile-data.mjs — do not edit by hand.
// Regenerate with \`pnpm --filter @thermal-label/labelmanager-core compile-data\`.
${imports}

export const ${exportName} = ${JSON.stringify(value, null, 2)} as const satisfies ${typeAnnotation};
`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body, 'utf8');
}

const devices = loadDevices();
const media = loadMedia();

if (errors.length > 0) {
  console.error(`[compile-data] ${errors.length} error(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

const registry = {
  schemaVersion: SCHEMA_VERSION,
  driver: DRIVER,
  devices,
};

writeJson(DEVICES_OUT, registry);
writeJson(MEDIA_OUT, media);

writeGeneratedTs(
  DEVICES_TS,
  "import type { DeviceRegistry } from '@thermal-label/contracts';",
  'DEVICE_REGISTRY',
  'DeviceRegistry',
  registry,
);

writeGeneratedTs(
  MEDIA_TS,
  "import type { LabelManagerMedia } from './types.js';",
  'MEDIA_LIST',
  'readonly LabelManagerMedia[]',
  media,
);

console.log(
  `[compile-data] OK — ${devices.length} devices, ${media.length} media entries → data/devices.json, data/media.json`,
);
