[**labelmanager**](../../../README.md)

***

[labelmanager](../../../README.md) / [core/src](../README.md) / MEDIA

# Variable: MEDIA

> `const` **MEDIA**: `Record`\<`string`, [`LabelManagerMedia`](../interfaces/LabelManagerMedia.md)\> = `MEDIA_BY_ID`

Indexed registry of every D1 cartridge SKU, keyed by entry id
(e.g. `MEDIA['d1-standard-bw-12']`). Pickers should iterate
`MEDIA_LIST` directly; the keyed lookup is for code paths that
already have an id in hand.
