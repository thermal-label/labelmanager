[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / MEDIA

# Variable: MEDIA

> `const` **MEDIA**: `Record`\<`"d1-standard-bw-6"` \| `"d1-standard-bc-9"` \| `"d1-standard-bw-9"` \| `"d1-standard-bw-12"` \| `"d1-standard-bc-12"` \| `"d1-standard-by-12"` \| `"d1-standard-bbl-12"` \| `"d1-standard-bg-12"` \| `"d1-standard-br-12"` \| `"d1-standard-wc-12"` \| `"d1-standard-wbk-12"` \| `"d1-standard-blw-12"` \| `"d1-standard-rw-12"` \| `"d1-permanent-bw-12"` \| `"d1-flexible-bw-12"` \| `"d1-durable-bw-12"` \| `"d1-durable-wbk-12"` \| `"d1-durable-wr-12"` \| `"d1-durable-bo-12"` \| `"d1-standard-bw-19"` \| `"d1-standard-bc-19"`, [`LabelManagerMedia`](../interfaces/LabelManagerMedia.md)\>

Indexed registry of every D1 cartridge SKU the driver knows about,
keyed by entry id (e.g. `MEDIA['d1-standard-bw-12']`). Pickers should
iterate `MEDIA_LIST` directly; the keyed lookup is for code paths
that already have an id in hand.
