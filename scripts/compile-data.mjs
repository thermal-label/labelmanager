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
import { expandVerifications, mapLegacyStatus } from '@thermal-label/contracts';

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
const LEGACY_SUPPORT_STATUS = new Set(['verified', 'partial', 'broken', 'untested']);
const VERIFICATION_RUNGS = new Set(['verified', 'partial', 'unsupported']);
const TRANSPORT_KEYS = new Set(['usb', 'tcp', 'serial', 'bluetooth-spp', 'bluetooth-gatt']);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ISSUES_PER_CELL = 2;

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

    if (!entry.support || !LEGACY_SUPPORT_STATUS.has(entry.support.status)) {
      fail(
        `${filename}: \`support.status\` must be one of ${[...LEGACY_SUPPORT_STATUS].join('|')} (got ${JSON.stringify(entry.support?.status)})`,
      );
    }

    // Optional `verifications` block — new shape, runs alongside legacy
    // `support` during the alias transition (see plan #0).
    if (entry.verifications !== undefined) {
      if (typeof entry.verifications !== 'object' || Array.isArray(entry.verifications)) {
        fail(`${filename}: \`verifications\` must be a keyed object`);
      } else {
        const declared = new Set(Object.keys(entry.transports ?? {}));
        for (const [k, cell] of Object.entries(entry.verifications)) {
          const cwhere = `${filename} verifications.${k}`;
          if (!TRANSPORT_KEYS.has(k)) {
            fail(`${cwhere}: unknown transport key`);
            continue;
          }
          if (!declared.has(k)) {
            fail(`${cwhere}: transport not declared on this device`);
          }
          if (!cell || typeof cell !== 'object') {
            fail(`${cwhere}: cell must be an object`);
            continue;
          }
          if (!VERIFICATION_RUNGS.has(cell.status)) {
            fail(`${cwhere}: status must be one of ${[...VERIFICATION_RUNGS].join('|')}`);
          }
          if (cell.issues !== undefined) {
            if (!Array.isArray(cell.issues)) {
              fail(`${cwhere}: issues must be an array`);
            } else {
              if (cell.issues.length > MAX_ISSUES_PER_CELL) {
                fail(`${cwhere}: issues may have at most ${MAX_ISSUES_PER_CELL} entries`);
              }
              for (const n of cell.issues) {
                if (!Number.isInteger(n) || n <= 0) {
                  fail(`${cwhere}: issues entries must be positive integers`);
                }
              }
            }
          }
          if (cell.reason !== undefined && typeof cell.reason !== 'string') {
            fail(`${cwhere}: reason must be a string`);
          }
          if (cell.lastReported !== undefined && !ISO_DATE_RE.test(cell.lastReported ?? '')) {
            fail(`${cwhere}: lastReported must be ISO date YYYY-MM-DD`);
          }
        }
      }
    }

    devices.push(entry);
  }

  // Issue-number uniqueness across the registry. Folded in from the
  // retired `validate-hardware-status.mjs` — same invariant, applied
  // to both new `verifications` cells and legacy `support.reports`.
  const seenIssues = new Map();
  for (const d of devices) {
    if (d.verifications) {
      for (const [transport, cell] of Object.entries(d.verifications)) {
        if (Array.isArray(cell?.issues)) {
          for (const n of cell.issues) {
            const key = `verifications.${transport}`;
            const prior = seenIssues.get(n);
            if (prior) {
              fail(
                `${d.key} ${key}: issue #${n} already used by ${prior}`,
              );
            } else {
              seenIssues.set(n, `${d.key}:${key}`);
            }
          }
        }
      }
    }
    if (Array.isArray(d.support?.reports)) {
      for (const [j, rep] of d.support.reports.entries()) {
        if (typeof rep?.issue === 'number') {
          const prior = seenIssues.get(rep.issue);
          if (prior) {
            fail(`${d.key} support.reports[${j}]: issue #${rep.issue} already used by ${prior}`);
          } else {
            seenIssues.set(rep.issue, `${d.key}:support.reports[${j}]`);
          }
        }
      }
    }
  }

  return devices;
}

// Synthesise a `verifications` block from the legacy `support` field
// when no explicit `verifications` is authored. Prefers per-transport
// `support.transports.<t>` when authored; otherwise applies the
// device-level `support.status` to every declared transport. Returns
// an empty object when the effective status is `'untested'`.
//
// `mapLegacyStatus` is imported from `@thermal-label/contracts`.
function legacyToVerifications(entry) {
  const declared = Object.keys(entry?.transports ?? {});
  const supportTransports = entry?.support?.transports;
  const out = {};
  if (supportTransports && typeof supportTransports === 'object') {
    for (const t of declared) {
      const mapped = mapLegacyStatus(supportTransports[t]);
      if (mapped) out[t] = { status: mapped };
    }
    if (Object.keys(supportTransports).length > 0) return out;
  }
  const deviceStatus = mapLegacyStatus(entry?.support?.status);
  if (!deviceStatus) return {};
  for (const t of declared) {
    if (out[t] === undefined) out[t] = { status: deviceStatus };
  }
  return out;
}

// `expandVerifications` is imported from `@thermal-label/contracts`.

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

// Build a registry shadow where each device has a populated
// `verifications` field — explicit when authored, synthesised from
// legacy `support` otherwise — so the contracts `expandVerifications`
// sees one consistent shape.
const synthesizedDevices = devices.map(d => {
  const v =
    d.verifications && Object.keys(d.verifications).length > 0
      ? d.verifications
      : legacyToVerifications(d);
  return { ...d, verifications: v };
});

const expanded = expandVerifications({
  schemaVersion: SCHEMA_VERSION,
  driver: DRIVER,
  devices: synthesizedDevices,
});

const leanDevices = devices.map((d, i) => {
  const { verifications: _v, ...rest } = d;
  return { ...rest, supportStatus: expanded.devices[i].supportStatus };
});

const richDevices = devices.map((d, i) => ({
  ...d,
  verificationGrid: expanded.devices[i].verificationGrid,
  supportStatus: expanded.devices[i].supportStatus,
}));

const richRegistry = {
  schemaVersion: SCHEMA_VERSION,
  driver: DRIVER,
  devices: richDevices,
};
const leanRegistry = {
  schemaVersion: SCHEMA_VERSION,
  driver: DRIVER,
  devices: leanDevices,
};

writeJson(DEVICES_OUT, richRegistry);
writeJson(MEDIA_OUT, media);

writeGeneratedTs(
  DEVICES_TS,
  `import type { DeviceEntry, DeviceRegistry } from '@thermal-label/contracts';

/**
 * Render-time effective status — superset of the contracts' stored
 * verification rungs that includes \`'expected'\` (propagated lift)
 * and \`'unverified'\` (no claim). Mirrors \`EffectiveStatus\` in
 * @thermal-label/contracts ≥ 0.6; literal here so codegen does not
 * require the matching contracts version on consumers' machines.
 */
export type EffectiveStatus = 'verified' | 'partial' | 'unsupported' | 'expected' | 'unverified';

/** Each entry carries a rolled-up \`supportStatus\` from the verification grid. */
export type RegistryDeviceEntry = DeviceEntry & { supportStatus: EffectiveStatus };

/** Registry shape with \`supportStatus\` stamped on each device. */
export type RegistryWithStatus = Omit<DeviceRegistry, 'devices'> & {
  devices: readonly RegistryDeviceEntry[];
};`,
  'DEVICE_REGISTRY',
  'RegistryWithStatus',
  leanRegistry,
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
