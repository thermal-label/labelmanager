#!/usr/bin/env node
// Validates the per-device JSON5 entries under
// `packages/core/data/devices/` against the contracts `DeviceRegistry`
// shape and the editorial conventions documented at
// https://github.com/thermal-label/.github/blob/main/CONTRIBUTING/hardware-status-schema.md
//
// Run via `pnpm validate:hardware-status`. The pre-push hook also runs
// this when any device JSON5 changes. A clean run prints
// `OK — N devices, M reports` and exits 0.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSON5 from 'json5';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const DEVICES_DIR = resolve(REPO_ROOT, 'packages/core/data/devices');
const MEDIA_FILE = resolve(REPO_ROOT, 'packages/core/data/media.json5');

const DRIVER = 'labelmanager';
const STATUS_VALUES = new Set(['verified', 'partial', 'broken', 'untested']);
const TRANSPORT_KEYS = new Set(['usb', 'tcp', 'serial', 'bluetooth-spp', 'bluetooth-gatt']);
const KNOWN_PROTOCOLS = new Set(['d1-tape']);
// LabelManager substrate tags. `d1` is the only tier shipping today;
// `d1-wide` is reserved for the future 24mm rasterizer cap-lift (see
// plans/backlog/wide-tier-media-compatibility.md).
const KNOWN_SUBSTRATES = new Set(['d1', 'd1-wide']);
const OS_VALUES = new Set(['Linux', 'macOS', 'Windows']);
const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-[\w.-]+)?(?:\+[\w.-]+)?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HEX = /^0x[0-9a-fA-F]+$/;

const errors = [];
const fail = msg => errors.push(msg);

function parseDate(s) {
  if (typeof s !== 'string' || !ISO_DATE.test(s)) return null;
  const d = new Date(s + 'T00:00:00Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

const files = readdirSync(DEVICES_DIR)
  .filter(f => f.endsWith('.json5'))
  .sort();

const seenKeys = new Map();
const seenUsbPids = new Map();
const seenIssues = new Map();
let totalReports = 0;

for (const filename of files) {
  const path = join(DEVICES_DIR, filename);
  const where = filename;

  let entry;
  try {
    entry = JSON5.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    fail(`${where}: parse error — ${err.message}`);
    continue;
  }

  if (typeof entry?.key !== 'string') {
    fail(`${where}: \`key\` must be a string`);
  } else if (seenKeys.has(entry.key)) {
    fail(`${where}: duplicate \`key\` "${entry.key}" already used by ${seenKeys.get(entry.key)}`);
  } else {
    seenKeys.set(entry.key, filename);
  }

  if (typeof entry?.name !== 'string') fail(`${where}: \`name\` must be a string`);
  if (entry?.family !== DRIVER) {
    fail(`${where}: \`family\` must be "${DRIVER}" (got ${JSON.stringify(entry?.family)})`);
  }

  const transports = entry?.transports;
  if (!transports || typeof transports !== 'object' || Array.isArray(transports)) {
    fail(`${where}: \`transports\` must be a keyed object`);
  } else {
    for (const k of Object.keys(transports)) {
      if (!TRANSPORT_KEYS.has(k)) fail(`${where}: unknown transport key "${k}"`);
    }
    if (transports.usb) {
      const { vid, pid } = transports.usb;
      if (typeof vid !== 'string' || !HEX.test(vid)) {
        fail(`${where}: transports.usb.vid must be a hex string (got ${JSON.stringify(vid)})`);
      }
      if (typeof pid !== 'string' || !HEX.test(pid)) {
        fail(`${where}: transports.usb.pid must be a hex string (got ${JSON.stringify(pid)})`);
      }
      const collision = seenUsbPids.get(pid);
      if (collision) {
        fail(`${where}: USB pid ${pid} already used by ${collision}`);
      } else if (typeof pid === 'string') {
        seenUsbPids.set(pid, filename);
      }
    }
  }

  if (!Array.isArray(entry?.engines) || entry.engines.length === 0) {
    fail(`${where}: \`engines\` must be a non-empty array`);
  } else {
    for (const [i, eng] of entry.engines.entries()) {
      const ewhere = `${where} engines[${i}]`;
      if (typeof eng?.role !== 'string') fail(`${ewhere}: role must be a string`);
      if (typeof eng?.protocol !== 'string' || !KNOWN_PROTOCOLS.has(eng.protocol)) {
        fail(
          `${ewhere}: protocol must be one of ${[...KNOWN_PROTOCOLS].join('|')} (got ${JSON.stringify(eng?.protocol)})`,
        );
      }
      if (typeof eng?.dpi !== 'number') fail(`${ewhere}: dpi must be a number`);
      if (typeof eng?.headDots !== 'number') fail(`${ewhere}: headDots must be a number`);

      if (Array.isArray(eng?.mediaCompatibility)) {
        if (eng.mediaCompatibility.includes('d1-wide') && !eng.mediaCompatibility.includes('d1')) {
          fail(
            `${ewhere}: mediaCompatibility includes 'd1-wide' but not 'd1' — wide-capable engines must also accept the base substrate`,
          );
        }
      }
    }
  }

  const support = entry?.support;
  if (!support || typeof support !== 'object') {
    fail(`${where}: \`support\` must be an object`);
  } else {
    if (!STATUS_VALUES.has(support.status)) {
      fail(
        `${where}: support.status must be one of ${[...STATUS_VALUES].join('|')} (got ${JSON.stringify(support.status)})`,
      );
    }

    if (support.transports != null) {
      if (typeof support.transports !== 'object' || Array.isArray(support.transports)) {
        fail(`${where}: support.transports must be a mapping`);
      } else {
        const declared = new Set(Object.keys(transports ?? {}));
        for (const [k, v] of Object.entries(support.transports)) {
          if (!declared.has(k)) {
            fail(`${where}: support.transports.${k} not declared in transports`);
          }
          if (!STATUS_VALUES.has(v)) {
            fail(
              `${where}: support.transports.${k} must be a status value (got ${JSON.stringify(v)})`,
            );
          }
        }
      }
    }

    if (support.lastVerified != null && !parseDate(support.lastVerified)) {
      fail(
        `${where}: support.lastVerified must be YYYY-MM-DD (got ${JSON.stringify(support.lastVerified)})`,
      );
    }
    if (
      support.packageVersion != null &&
      (typeof support.packageVersion !== 'string' || !SEMVER.test(support.packageVersion))
    ) {
      fail(
        `${where}: support.packageVersion must be semver (got ${JSON.stringify(support.packageVersion)})`,
      );
    }

    if (support.reports != null) {
      if (!Array.isArray(support.reports)) {
        fail(`${where}: support.reports must be an array`);
      } else {
        let latestReportDate = null;
        for (const [j, rep] of support.reports.entries()) {
          const rwhere = `${where} support.reports[${j}]`;
          totalReports++;

          if (typeof rep?.issue !== 'number') {
            fail(`${rwhere}: issue must be a number`);
          } else if (seenIssues.has(rep.issue)) {
            fail(`${rwhere}: issue #${rep.issue} already used by ${seenIssues.get(rep.issue)}`);
          } else {
            seenIssues.set(rep.issue, `${filename}:${entry.key}`);
          }

          if (typeof rep?.reporter !== 'string' || !rep.reporter.startsWith('@')) {
            fail(`${rwhere}: reporter must be a "@handle" string`);
          }

          const repDate = parseDate(rep?.date);
          if (!repDate) {
            fail(`${rwhere}: date must be YYYY-MM-DD`);
          } else if (!latestReportDate || repDate > latestReportDate) {
            latestReportDate = repDate;
          }

          if (!STATUS_VALUES.has(rep?.result)) {
            fail(`${rwhere}: result must be one of ${[...STATUS_VALUES].join('|')}`);
          }

          if (rep?.os != null && !OS_VALUES.has(rep.os)) {
            fail(
              `${rwhere}: os must be one of ${[...OS_VALUES].join('|')} (got ${JSON.stringify(rep.os)})`,
            );
          }

          if (rep?.selfVerified != null && typeof rep.selfVerified !== 'boolean') {
            fail(`${rwhere}: selfVerified must be a boolean`);
          }
        }

        const lastVerified = parseDate(support.lastVerified);
        if (lastVerified && latestReportDate && latestReportDate > lastVerified) {
          fail(
            `${where}: support.lastVerified ${support.lastVerified} precedes latest report date ${latestReportDate.toISOString().slice(0, 10)}`,
          );
        }
      }
    }
  }
}

let mediaCount = 0;
try {
  const mediaEntries = JSON5.parse(readFileSync(MEDIA_FILE, 'utf8'));
  if (!Array.isArray(mediaEntries)) {
    fail(`media.json5: top-level must be an array`);
  } else {
    mediaCount = mediaEntries.length;
    for (const [i, m] of mediaEntries.entries()) {
      const mwhere = `media.json5 [${i}${m?.id ? ` ${m.id}` : ''}]`;
      if (!Array.isArray(m?.targetModels) || m.targetModels.length === 0) {
        fail(`${mwhere}: targetModels must be a non-empty array`);
        continue;
      }
      const hasSubstrate = m.targetModels.some(t => KNOWN_SUBSTRATES.has(t));
      if (!hasSubstrate) {
        fail(
          `${mwhere}: targetModels must include one of ${[...KNOWN_SUBSTRATES].join('|')} (got ${JSON.stringify(m.targetModels)})`,
        );
      }
    }
  }
} catch (err) {
  fail(`media.json5: parse error — ${err.message}`);
}

if (errors.length > 0) {
  console.error(`[validate-hardware-status] ${errors.length} error(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

console.log(`OK — ${seenKeys.size} devices, ${mediaCount} media entries, ${totalReports} reports`);
