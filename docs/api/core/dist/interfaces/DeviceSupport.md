[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / DeviceSupport

# Interface: DeviceSupport

Verification state for a device.

Always present on `DeviceEntry` (defaults to `{ status: 'untested' }`)
so consumer types stay unconditional.

## Properties

### engines?

> `optional` **engines?**: `Record`\<`string`, [`SupportStatus`](../type-aliases/SupportStatus.md)\>

Per-engine status — useful for the Duo's "label works, tape
doesn't" case. Keys must match `engines[].role`.

***

### lastVerified?

> `optional` **lastVerified?**: `string`

ISO date of the most recent accepted report.

***

### packageVersion?

> `optional` **packageVersion?**: `string`

Driver package version the most recent reports were filed against.

***

### quirks?

> `optional` **quirks?**: `string`

Editorial caveats. Markdown. Changes with firmware revisions.

***

### reports?

> `optional` **reports?**: readonly `DeviceReport`[]

Accepted verification reports backing the status above.

***

### status

> **status**: [`SupportStatus`](../type-aliases/SupportStatus.md)

Worst-case status across declared transports and engines.

***

### transports?

> `optional` **transports?**: `Partial`\<`Record`\<[`TransportType`](../type-aliases/TransportType.md), [`SupportStatus`](../type-aliases/SupportStatus.md)\>\>

Per-transport status, where the data records it.
