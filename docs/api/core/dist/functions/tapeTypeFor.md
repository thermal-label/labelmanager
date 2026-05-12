[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / tapeTypeFor

# Function: tapeTypeFor()

> **tapeTypeFor**(`media?`): `number`

Map the user-selected media's text + background colours to the
ESC C selector (0..12). Unknown / unenumerated combinations and
`undefined` media both return `0`, the safe fallback (the
cassette's ink prints regardless of the byte sent).

## Parameters

### media?

`Pick`\<`D1Media`, `"text"` \| `"background"`\>

## Returns

`number`
