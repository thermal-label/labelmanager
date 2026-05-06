[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / MEDIA

# Variable: MEDIA

> `const` **MEDIA**: `Record`\<`"d1-standard-bw-6"` \| `"d1-standard-bc-9"` \| `"d1-standard-bw-9"` \| `"d1-standard-bw-12"` \| `"d1-standard-bc-12"` \| `"d1-standard-by-12"` \| `"d1-standard-bbl-12"` \| `"d1-standard-bg-12"` \| `"d1-standard-br-12"` \| `"d1-standard-wc-12"` \| `"d1-standard-wbk-12"` \| `"d1-standard-blw-12"` \| `"d1-standard-rw-12"` \| `"d1-permanent-bw-12"` \| `"d1-flexible-bw-12"` \| `"d1-durable-bw-12"` \| `"d1-durable-wbk-12"` \| `"d1-durable-wr-12"` \| `"d1-durable-bo-12"` \| `"d1-standard-bw-19"` \| `"d1-standard-bc-19"` \| `"rhino-vinyl-bw-9"` \| `"rhino-vinyl-bw-12"` \| `"rhino-vinyl-bw-19"` \| `"rhino-vinyl-by-12"` \| `"rhino-vinyl-by-19"` \| `"rhino-vinyl-bo-12"` \| `"rhino-vinyl-bo-19"` \| `"rhino-vinyl-bgry-12"` \| `"rhino-vinyl-bgry-19"` \| `"rhino-vinyl-wr-12"` \| `"rhino-vinyl-wr-19"` \| `"rhino-vinyl-wbk-9"` \| `"rhino-vinyl-wbk-12"` \| `"rhino-vinyl-wbk-19"` \| `"rhino-vinyl-wgrn-12"` \| `"rhino-vinyl-wgrn-19"` \| `"rhino-vinyl-wbl-12"` \| `"rhino-vinyl-wbl-19"` \| `"rhino-vinyl-wprp-12"` \| `"rhino-vinyl-wprp-19"` \| `"rhino-vinyl-wbrn-12"` \| `"rhino-vinyl-wbrn-19"` \| `"rhino-permanent-bw-6"` \| `"rhino-permanent-bw-9"` \| `"rhino-permanent-bw-12"` \| `"rhino-permanent-bw-19"` \| `"rhino-permanent-bclr-6"` \| `"rhino-permanent-bclr-9"` \| `"rhino-permanent-bclr-12"` \| `"rhino-permanent-bclr-19"` \| `"rhino-permanent-bmtl-6"` \| `"rhino-permanent-bmtl-9"` \| `"rhino-permanent-bmtl-12"` \| `"rhino-permanent-bmtl-19"` \| `"rhino-hs-bw-6"` \| `"rhino-hs-bw-9"` \| `"rhino-hs-bw-12"` \| `"rhino-hs-bw-19"` \| `"rhino-hs-by-6"` \| `"rhino-hs-by-9"` \| `"rhino-hs-by-12"` \| `"rhino-hs-by-19"` \| `"rhino-nylon-bw-12"` \| `"rhino-nylon-bw-19"` \| `"rhino-nylon-by-12"` \| `"rhino-nylon-by-19"` \| `"rhino-tag-bw-6"` \| `"rhino-tag-bw-12"`, [`LabelManagerMedia`](../interfaces/LabelManagerMedia.md)\>

Indexed registry of every D1 cartridge SKU the driver knows about,
keyed by entry id (e.g. `MEDIA['d1-standard-bw-12']`). Pickers should
iterate `MEDIA_LIST` directly; the keyed lookup is for code paths
that already have an id in hand.
