---
'@thermal-label/labelmanager-core': minor
---

Consume the D1 cassette catalogue + protocol docs from
`@thermal-label/d1-core`.

The 69 D1 cassette entries (21 standard + 48 Rhino) move out of this
package's `data/media.json5` into the shared d1-core catalogue. LM
re-exports them filtered to widths the LabelManager chassis can drive
(≤19 mm — d1-core also publishes a 24 mm tier for the Duo). Public
surface unchanged: `MEDIA`, `MEDIA_LIST`, `TAPE_6MM` …
`TAPE_19MM`, `findMediaByTapeWidth`, `DEFAULT_MEDIA` all still ship.

Vocabulary alignment: `mediaCompatibility` and `targetModels` now use
`'d1'` (≤12 mm) | `'d1-wide'` (19 mm) | `'d1-24'` (24 mm). The
non-standard `'d1-19'` key is gone — LM_420P, LM_WIRELESS_PNP, and
MOBILE_LABELER device JSON5 now declare `['d1', 'd1-wide']` instead.

Protocol docs (`docs/protocol.md`) move to d1-core, where the
LabelWriter Duo's tape side also references them. The LM docs index
and `core.md` link to the d1-core protocol page.
