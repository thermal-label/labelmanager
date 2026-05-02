# labelmanager — Migrate to the contracts device & media shape

> Port `LabelManagerDevice` and the D1 cartridge registry onto the
> shared shape defined in
> `../../../contracts/plans/backlog/generic-device-media-library.md`.
> Folds in the verification overlay (`docs/hardware-status.yaml` →
> inline `support` block in `data/devices/<KEY>.json5`).
>
> The shape itself is not litigated here — the contracts plan owns
> that. This plan covers what changes in the labelmanager package
> and how the migration lands.
>
> No existing backlog plan to subsume — this is a fresh migration.

---

## 1. What's particular about labelmanager

LM is the odd-shape-out of the four drivers:

- **No `headDots` field today.** The rasterizer derives bytes
  from `MEDIA.tapeWidthMm` rather than a head-dot count on the
  device entry. Under the contracts shape, every entry needs an
  `engines[0]` with `headDots`. Fabricate it: most LM devices
  share the 128-dot D1 head at 180 dpi. Where a model differs
  (24 mm-capable models with a wider head), encode it explicitly.
- **`experimental?: boolean` field.** Collapses into
  `support.status`: `experimental: true` → `support.status:
  'partial'` (or `'untested'` where unverified). Same signal, on
  the standard channel.
- **No multi-engine devices.** Every LM is single-engine,
  USB-only (some models also serial — verify per-model).

---

## 2. What changes in the package

### 2.1 New files

- `packages/core/data/devices/<KEY>.json5` — one file per device,
  source of truth. PR blast radius scales with the change.
- `packages/core/data/devices.json` — build artifact, aggregated
  `DeviceRegistry`.
- `packages/core/data/media.json5` — D1 cartridge entries (single
  file is fine for media).
- `scripts/compile-data.mjs` — globs `data/devices/*.json5`,
  validates and aggregates them, writes `data/devices.json`.

### 2.2 Modified files

- `packages/core/src/devices.ts` — thin re-export of the compiled
  JSON, typed as `DeviceRegistry` with `family: 'labelmanager'`.
- `packages/core/src/media.ts` — same shape; thin re-export.
- `packages/core/src/protocols.ts` — `PROTOCOLS` registry.
  `d1-tape` (or whatever tag the labelwriter Duo plan settles on
  — should be the same protocol module shared between LW Duo's
  tape engine and the LM lineup).
- The rasterizer — reads `engine.headDots`. The current
  `MEDIA.tapeWidthMm` → `bytesPerLine` derivation continues to
  work; what's new is that the device side now declares a head
  dot count rather than implying one.
- `validate-hardware-status.mjs` — extended to validate the whole
  entry shape.

### 2.3 Removed files

- `docs/hardware-status.yaml` — content folds inline.
- `docs/hardware.md` — reduced to a one-line pointer.

---

## 3. Device list — corrections, additions, decoy PIDs

The current `DEVICES` table (`packages/core/src/devices.ts`) carries
two PID bugs and is missing two devices that the community has
documented USB IDs for. The migration is the natural place to fix
both, since the JSON5-per-device split forces every PID to be
re-examined and the validator will reject any duplicates.

### 3.1 Corrections to existing entries

| Entry | Current PID | Correct PID | Source |
| --- | --- | --- | --- |
| `LABELMANAGER_PC` | `0x1002` | **`0x0011`** | `lsusb` capture in dymoprint#93 + labelle constants |
| `LABELPOINT_350` | `0x1003` | **`0x0015`** | labelle constants |

The PnP/PC "shared PID" line in the current `hardware-status.yaml`
quirks block was a misreading — `0x0011` is the PC's actual PID. The
LabelPoint 350's `0x1003` was the LM 420P's mass-storage decoy; the
real LP 350 PID is `0x0015`.

`LABELMANAGER_PNP` (`0x1002`), `LABELMANAGER_420P` (`0x1004`),
`LABELMANAGER_WIRELESS_PNP` (`0x1008`), and `MOBILE_LABELER`
(`0x1009`) are correct and stay as-is.

### 3.2 New entries

| Key | Model | Printer PID | Decoy PID | Default `support.status` |
| --- | --- | --- | --- | --- |
| `LABELMANAGER_280` | LabelManager 280 | `0x1006` | `0x1005` | `'untested'` |
| `LABELMANAGER_400` | LabelManager 400 | `0x0013` | — | `'untested'` |

The 280 is in active production and worth landing; the 400 is older
but the PID is well-documented in the major USB-ID databases, cheap
to add while files are being touched.

### 3.3 Mass-storage decoy PIDs

Modern LabelManager devices ship with two USB PIDs — a
mass-storage decoy on first plug-in, the printer-mode PID after
`usb_modeswitch` runs:

| Decoy | Printer | Model |
| --- | --- | --- |
| `0x1001` | `0x1002` | LM PnP |
| `0x1003` | `0x1004` | LM 420P |
| `0x1005` | `0x1006` | LM 280 |
| `0x1007` | `0x1008` | LM Wireless PnP |

Older devices (PC, LabelPoint 350, LM 400) skip the modeswitch
dance and present a single PID.

**Convention for the registry:** one `DeviceEntry` per physical
device, `transports.usb.pid` carries the **printer-mode PID**, and
the decoy PID goes in `hardwareQuirks` prose. Decoys are *not*
listed as separate entries — they're not drivable, and surfacing
them via `resolveSupportedDevices` would falsely advertise them as
printable. Frontends that want to detect "device showed up still in
mass-storage mode" can match the decoy PIDs as a separate concern,
not via the device registry.

### 3.4 Verification status of the corrected/added PIDs

Sourced from community projects (labelle-org, dymoprint), not
maintainer-verified hardware. Every corrected or added entry lands
at `support.status: 'untested'` until a hardware report is filed.
The PC PID (`0x0011`) has the strongest provenance — two
independent sources (labelle constants + an `lsusb` capture in
dymoprint#93). The LP 350 (`0x0015`), LM 280 (`0x1006`), and LM
400 (`0x0013`) are single-source from labelle and should carry a
short note in `support.quirks` flagging that.

Sources:

- [labelle-org/labelle constants.py](https://github.com/labelle-org/labelle/tree/main/src/labelle)
- [labelle-org/labelle issue #4 — Support for additional devices](https://github.com/labelle-org/labelle/issues/4)
- [computerlyrik/dymoprint issue #93 — LabelManager PC `lsusb` output](https://github.com/computerlyrik/dymoprint/issues/93)
- [the-sz USB ID database — VID 0x0922](https://the-sz.com/products/usbid/index.php?v=0x0922)
- [Device Hunt — Dymo-CoStar Corp.](https://devicehunt.com/view/type/usb/vendor/0922)

### 3.5 Out of scope

- **LM 500TS, 360D, 160** — handheld / smartphone-paired or
  standalone; no USB host mode under VID `0x0922`.
- **MobileLabeler driver work** — the entry stays in the registry
  but labelle reports "no success yet". Lands at
  `support.status: 'broken'` or `'untested'` (pick one with a
  short prose note); no protocol changes here.

### 3.6 Worked entries

**LabelManager PnP (printer-mode PID; decoy in `hardwareQuirks`):**

```json5
{
  key: "LM_PNP",
  name: "LabelManager PnP",
  family: "labelmanager",
  transports: {
    usb: { vid: "0x0922", pid: "0x1002" }
  },
  engines: [
    {
      role: "primary",
      protocol: "d1-tape",
      dpi: 180,
      headDots: 128,
      mediaCompatibility: ["d1"]
    }
  ],
  hardwareQuirks: "Enumerates as USB Mass Storage Class on first connect under PID 0x1001; needs usb_modeswitch on Linux to switch to the printer interface (PID 0x1002). The printer-mode PID is the one stored here; the decoy is recognised by the discovery layer separately.",
  support: { status: "verified", lastVerified: "2026-04-27", packageVersion: "0.2.0" }
}
```

**LabelManager PC (corrected PID, no modeswitch):**

```json5
{
  key: "LM_PC",
  name: "LabelManager PC",
  family: "labelmanager",
  transports: {
    usb: { vid: "0x0922", pid: "0x0011" }
  },
  engines: [
    {
      role: "primary",
      protocol: "d1-tape",
      dpi: 180,
      headDots: 128,
      mediaCompatibility: ["d1"]
    }
  ],
  support: {
    status: "untested",
    quirks: "PID corrected from 0x1002 (which was a copy-paste from the PnP entry) to 0x0011 based on community sources; needs hardware verification."
  }
}
```

**Wider-head models (e.g. 24 mm-capable):**

If a model carries a wider head (e.g. 24 mm tape support with a
192-dot head), the engine entry reflects it explicitly:

```json5
engines: [
  { role: "primary", protocol: "d1-tape", dpi: 180, headDots: 192, mediaCompatibility: ["d1", "d1-24mm"] }
]
```

D1 cartridges declare `targetModels` to gate which devices accept
them — `targetModels: ['d1-24mm']` for the 24 mm-only sizes, omit
for cartridges that fit every D1 head.

**Experimental → support:**

The current `experimental: true` flag on entries that haven't been
field-tested becomes `support.status: 'untested'` (no reports yet)
or `support.status: 'partial'` (works but with known issues — see
`support.quirks` for prose). One signal, on the standard channel.

---

## 4. D1 cartridge registry

D1 cartridges are shared physical media between the LM lineup and
the LabelWriter Duo's tape engine. Two reasonable approaches:

**A. Each driver owns its own D1 list.** Both `labelmanager` and
`labelwriter` carry D1 entries in `data/media.json5`, with
`category: 'cartridge'` and `targetModels` filtering.

**B. A shared `@thermal-label/d1` package.** Both drivers import
from one D1 catalogue.

Recommend A for now — keeps each driver independent, no
cross-driver build-graph entanglement, and the duplication is
small (one cartridge SKU list). Revisit if/when the duplication
becomes painful, which is unlikely given how rarely D1 SKUs
change.

The colour-on-colour `D1_TAPE_COLOR_HEX` LUT (see the labelwriter
plan §4) lives in `src/`, not in the registry — it's a colour
LUT, not catalogue metadata. Each driver carries its own copy if
it needs one.

---

## 5. YAML → JSON5 migration

Mechanical 1:1 migration. The LM ledger is the smallest of the
three; can be done by hand without a migration script.

---

## 6. Test plan

- TS compile passes against `DeviceRegistry`.
- Rasterizer fixtures produce identical bytes (same `MEDIA.tapeWidthMm`
  → `bytesPerLine` derivation; head dot count is now declared but
  the rasterizer's input is unchanged).
- Transport tests still find devices via the new transport-keyed
  object.
- WebUSB filter generation matches the previous list.
- The validator catches malformed entries (every entry has at
  least one engine, every engine has a `protocol` that exists in
  `PROTOCOLS`).

---

## 7. Sequencing

1. **JSON5 + compile script** — port existing `DEVICES` to JSON5
   with fabricated `engines[0]`. Thin re-export from `src/devices.ts`.
2. **Apply the §3 data fixes in the same step** — correct the LM PC
   PID (`0x1002` → `0x0011`) and the LabelPoint 350 PID (`0x1003` →
   `0x0015`), add LM 280 and LM 400 entries, and document each
   model's mass-storage decoy PID in `hardwareQuirks` per the §3.3
   convention. Doing this *during* the JSON5 split avoids freezing
   the bugs into the new layout.
3. **Migrate `hardware-status.yaml` inline** — fold support data
   into the JSON5 entries. Collapse `experimental` into
   `support.status` at the same time.
4. **Promote transports** — restructure each entry's transport
   declaration. Most LM entries are USB-only; this is small.
5. **Cleanup** — reduce `docs/hardware.md` to a one-line pointer.

The LM migration is the smallest of the three. Likely a single
PR end-to-end.
