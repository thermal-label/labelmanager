# Implementation Progress

## Step 0: Tracking setup
- [x] Read the full implementation plan.
- [x] Create and maintain this checklist throughout implementation.

## Step 1: Scaffold
- [x] Add `LICENSE` (MIT, current year, Mannes Brak).
- [x] Add `.github/FUNDING.yml`.
- [x] Add root `package.json` with scripts and devDependencies.
- [x] Add root `eslint.config.js` (flat config).
- [x] Add root `tsconfig.base.json`.
- [x] Add `pnpm-workspace.yaml`.
- [x] Add `.gitignore`.
- [x] Add `.changeset/` directory scaffold.
- [x] Add GitHub Actions workflows:
  - [x] `.github/workflows/ci.yml`
  - [x] `.github/workflows/release.yml`
  - [x] `.github/workflows/docs.yml`
- [x] Add `.github/ISSUE_TEMPLATE/hardware_verification.md`.
- [x] Gate checks for Step 1:
  - [x] `pnpm typecheck` passes
  - [x] `pnpm lint` passes
  - [x] `pnpm test` passes
  - [x] `pnpm build` produces output

## Step 2: `@thermal-label/labelmanager-core`
- [x] Scaffold `packages/core` package metadata and tsconfig.
- [x] Implement device registry (`src/devices.ts`).
- [x] Implement `findDevice` lookup helper.
- [x] Implement protocol encoder (`src/protocol.ts`):
  - [x] reset/media/density command builders
  - [x] bitmap row report builder (64-byte report padding)
  - [x] form feed builder
  - [x] `encodeLabel` orchestration with copies/density handling
- [x] Re-export bitmap APIs from `@mbtech-nl/bitmap` from core entrypoint.
- [x] Add core tests:
  - [x] `src/__tests__/devices.test.ts`
  - [x] `src/__tests__/protocol.test.ts`
- [x] Gate checks for Step 2:
  - [x] `pnpm typecheck` passes
  - [x] `pnpm lint` passes
  - [x] `pnpm test` passes
  - [x] `pnpm build` produces output

## Step 3: `@thermal-label/labelmanager-node`
- [x] Scaffold `packages/node` package metadata and tsconfig.
- [x] Implement discovery (`listPrinters`, `openPrinter`).
- [x] Implement `DymoPrinter` class:
  - [x] `printText`
  - [x] `printImage` (`@napi-rs/canvas` optional decode only)
  - [x] `getStatus`
  - [x] `close`
- [x] Implement HID write pacing (5ms between writes).
- [x] Implement Linux udev generator (`generateUdevRules`).
- [x] Add Vitest mock for `node-hid` at required path:
  - [x] `packages/node/src/__tests__/__mocks__/node-hid.ts`
- [x] Add node tests:
  - [x] `src/__tests__/discovery.test.ts`
  - [x] `src/__tests__/printer.test.ts`
  - [x] `src/__tests__/integration/print.test.ts` (stub + manual checklist, `DYMO_INTEGRATION=1` gated)
- [x] Gate checks for Step 3:
  - [x] `pnpm typecheck` passes
  - [x] `pnpm lint` passes
  - [x] `pnpm test` passes
  - [x] `pnpm build` produces output

## Step 4: `@thermal-label/labelmanager-cli`
- [x] Scaffold `packages/cli` package metadata and tsconfig.
- [x] Add CLI bin shim (`bin/dymo.js`).
- [x] Implement command runner (`src/index.ts`).
- [x] Implement commands:
  - [x] `dymo list`
  - [x] `dymo print text`
  - [x] `dymo print image`
  - [x] `dymo status`
  - [x] `dymo setup linux`
- [x] Add CLI tests:
  - [x] `src/__tests__/commands/text.test.ts`
  - [x] `src/__tests__/commands/image.test.ts`
  - [x] `src/__tests__/commands/list.test.ts`
- [x] Gate checks for Step 4:
  - [x] `pnpm typecheck` passes
  - [x] `pnpm lint` passes
  - [x] `pnpm test` passes
  - [x] `pnpm build` produces output

## Step 5: `@thermal-label/labelmanager-web`
- [x] Scaffold `packages/web` package metadata and tsconfig (browser config).
- [x] Add ambient WebHID type declaration (`src/webhid.d.ts`) as needed.
- [x] Implement WebHID APIs:
  - [x] `requestPrinter`
  - [x] `fromHIDDevice`
  - [x] `WebDymoPrinter` class methods
- [x] Implement `printImageURL` pipeline via `fetch` + bitmap decode path.
- [x] Add Web tests and mocks:
  - [x] `src/__tests__/webhid-mock.ts`
  - [x] `src/__tests__/request.test.ts`
  - [x] `src/__tests__/printer.test.ts`
- [x] Gate checks for Step 5:
  - [x] `pnpm typecheck` passes
  - [x] `pnpm lint` passes
  - [x] `pnpm test` passes
  - [x] `pnpm build` produces output

## Step 6: Docs
- [x] Scaffold VitePress docs structure.
- [x] Implement docs config and theme:
  - [x] `docs/.vitepress/config.ts`
  - [x] `docs/.vitepress/theme/index.ts`
- [x] Fully author all documentation pages with complete prose and real examples:
  - [x] `docs/index.md`
  - [x] `docs/guide/introduction.md`
  - [x] `docs/guide/getting-started.md`
  - [x] `docs/guide/linux-setup.md`
  - [x] `docs/node/index.md`
  - [x] `docs/node/printing-text.md`
  - [x] `docs/node/printing-images.md`
  - [x] `docs/node/multi-printer.md`
  - [x] `docs/cli/index.md`
  - [x] `docs/cli/commands.md`
  - [x] `docs/web/index.md`
  - [x] `docs/web/quick-start.md`
  - [x] `docs/web/react-example.md`
- [x] Add TSDoc comments on all exported symbols across packages.
- [x] Configure and validate Typedoc API generation (`docs:api`).
- [x] Implement live demo component (`docs/.vitepress/components/LiveDemo.vue`) after web package is working.
- [x] Gate checks for Step 6:
  - [x] `pnpm typecheck` passes
  - [x] `pnpm lint` passes
  - [x] `pnpm test` passes
  - [x] `pnpm build` produces output

## Step 7: CI
- [x] Finalize and verify workflows:
  - [x] CI workflow uses required checks and Codecov upload.
  - [x] Release workflow uses trusted publishing.
  - [x] Docs workflow deploys VitePress to Pages.
- [x] Add root README badges (CI, codecov, npm, MIT).
- [x] Validate repo scripts align with workflow commands.
- [x] Gate checks for Step 7:
  - [x] `pnpm typecheck` passes
  - [x] `pnpm lint` passes
  - [x] `pnpm test` passes
  - [x] `pnpm build` produces output

## Step 8: `HARDWARE.md`
- [ ] Author full compatibility table.
- [ ] Document hardware verification instructions.
- [ ] Add hardware donation/contribution note.
- [ ] Gate checks for Step 8:
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm lint` passes
  - [ ] `pnpm test` passes
  - [ ] `pnpm build` produces output

## Finalization
- [ ] Ensure every checkbox above is ticked.
