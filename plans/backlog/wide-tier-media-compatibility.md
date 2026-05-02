# labelmanager — Wide-tier media compatibility

> Apply the convention from
> `../../../contracts/plans/backlog/wide-tier-media-compatibility.md`
> to the LabelManager driver. **No engine change today** — every
> current LM device is a 64-dot chassis capped at 19mm tape.
> The plan adds `targetModels: ['d1']` to every existing media
> entry (substrate hygiene) and reserves `'d1-wide'` for the
> future 24mm tier already pre-figured in `data/media.json5`
> comments.
>
> The convention itself is not litigated here — the contracts
> plan owns that. This plan is mostly documentation: a no-op for
> the runtime today, a prerequisite for the future 24mm work.

---

## 1. What's particular about labelmanager

- **Single substrate, single tier today.** All current devices
  are 64-dot, all current cartridges are 6 / 9 / 12 / 19 mm.
  `mediaCompatibility: ['d1']` and (after this plan)
  `targetModels: ['d1']` cover every entry; nothing else
  triggers.
- **`skus` and `category` are already populated** on every
  media row (LM was the cleanroom adopter of `generic-device-media-library.md`
  §3.2). This plan only adds `targetModels`.
- **24mm tier already foreshadowed.** `data/media.json5`
  includes a comment block: *"The CSV's 24 mm entries are
  deliberately omitted — the LabelManager rasterizer caps at the
  64-dot transport path … Land them with `targetModels:
  ['d1-24mm']` when the rasterizer learns to address more than
  64 dots."* That comment pre-dates this plan; the convention
  here updates the suggested tag from `'d1-24mm'` to
  `'d1-wide'` for cross-driver consistency.

---

## 2. What changes in the package

### 2.1 `data/media.json5`

Add `targetModels: ['d1']` to every existing entry. Concrete
diff per row:

```diff
   {
     id: 'd1-standard-bw-6',
     name: '6mm Black on White (D1)',
     widthMm: 6,
     type: 'tape',
     category: 'cartridge',
+    targetModels: ['d1'],
     defaultOrientation: 'horizontal',
     printMargins: { leftMm: 3, rightMm: 3, topMm: 0, bottomMm: 0 },
     skus: ['43613', 'S0720780'],
     ...
   }
```

21 entries (1 × 6mm, 2 × 9mm, 13 × 12mm, 5 × 12mm
permanent/flex/durable, 2 × 19mm); mechanical change. No
tier-tag (`'d1-wide'`) lands today — there is no 24mm media in
the registry yet.

Update the leading comment block to reference `'d1-wide'`
instead of `'d1-24mm'`. The current wrapping puts the SKU
mention on the line above, so match the actual file (lines
9–14) rather than the schematic diff below:

```diff
- // physically accept them. Land them with `targetModels: ['d1-24mm']`
- // when the rasterizer learns to address more than 64 dots.
+ // physically accept them. Land them with `targetModels: ['d1-wide']`
+ // when the rasterizer learns to address more than 64 dots; the
+ // wide-capable engine entries gain `mediaCompatibility:
+ // ['d1', 'd1-wide']` at the same time. See
+ // ../../plans/backlog/wide-tier-media-compatibility.md.
```

### 2.2 Device entries — no change

All current LM devices stay at `mediaCompatibility: ['d1']`. No
edits to `data/devices/*.json5`.

### 2.3 `src/types.ts`

`LabelManagerMedia extends MediaDescriptor` already inherits
`targetModels` structurally. No type changes.

### 2.4 `src/__tests__/media.test.ts` — invariant tests

New file (only `devices.test.ts` and `protocol.test.ts` exist
today). Two cases:

1. Every media entry has `'d1'` in `targetModels`.
2. `mediaCompatibleWith()` (imported from
   `@thermal-label/contracts`, defined in
   `src/compatibility.ts`) returns `true` for every existing
   entry against every existing device's primary engine
   (sanity: nothing is accidentally gated out).

The second test is cheap insurance against a future entry being
tagged `['d1-wide']` without a wide-capable device existing —
that combination would silently drop the entry from every
picker.

### 2.5 Validator

`scripts/validate-hardware-status.mjs` already exists (landed
in `e3468bf`), so the two contracts-plan §4 rules can ship in
this PR rather than waiting:

- **Substrate required** — every media entry's `targetModels`
  must include `'d1'` or `'d1-wide'`.
- **Wide tier implies base** — if any engine's
  `mediaCompatibility` contains `'d1-wide'`, it must also
  contain `'d1'`.

The validator currently only walks `data/devices/*.json5`; it
will need a new pass over `data/media.json5` (parse with
`JSON5`, iterate, apply the substrate-required rule). The
wide-tier-implies-base rule slots into the existing per-engine
loop. The second rule is dormant today (no engine has
`'d1-wide'`) but lands now so the future 24mm work doesn't have
to remember to add it.

---

## 3. Future: when 24mm cartridge support lands

Out of scope for this plan, recorded here so the convention is
clear when the rasterizer cap-lift PR happens:

1. New cartridge entries in `data/media.json5`:
   `targetModels: ['d1-wide']` (wide-only — they don't fit on
   64-dot heads at all). Existing 6/9/12/19mm entries stay at
   `['d1']`.
2. Whichever LM models actually ship with a wider head get
   `mediaCompatibility: ['d1', 'd1-wide']`. Per the comment in
   `src/protocol.ts` on `tapeWidthToHeadDots`, the cap is in
   the rasterizer, not the device entry — the chassis-side
   question is "which models have ≥96-dot heads?" and is
   answered by hardware specs, not by the protocol.
3. Validator rules from §2.5 already in place — no change
   needed.

The shape lands as a one-line per row in `data/media.json5`
plus per-device `mediaCompatibility` edits. No shape work.

---

## 4. Sequencing

Single PR. Independent of `migrate-to-contracts-shape.md` (LM
already migrated to JSON5 device entries) and of the
brother-ql wide-tier PR.

1. Edit every entry in `data/media.json5` (add `targetModels`).
2. Update the leading comment.
3. Add invariant tests (`src/__tests__/media.test.ts`, new
   file). The generated `media.generated.ts` is gitignored and
   regenerated on every `pnpm test` / `pnpm build` via the
   `compile-data` prestep, so no manual regen is needed.
4. Extend `scripts/validate-hardware-status.mjs` with the two
   rules from §2.5.
5. Run `pnpm test` and `pnpm validate:hardware-status`; commit.

---

## 5. Out of scope

- 24mm rasterizer support. Tracked separately; this plan only
  records the convention it will follow.
- Cross-driver D1 unification (LabelWriter Duo also drives D1
  cartridges via `DUO_TAPE_MEDIA`). The contracts plan keeps
  each driver's media registry separate; LM and labelwriter
  carry independent copies of the D1 catalogue. If we ever
  consolidate, the substrate tag (`'d1'`) is shared by design.
- `'d1-wide'` actually being present in the registry. Today
  it's a reserved tag with no entries; that's deliberate.
