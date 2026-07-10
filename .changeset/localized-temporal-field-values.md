---
'@elek-io/desktop': patch
---

Show date, datetime and time field values in the user's locale, and load date-fns locales on demand.

Entry table cells for date, datetime and time fields now render a localized value (for example `07/09/2026`) instead of the raw stored ISO string. This is done by a new `formatTemporalFieldValue` helper on the user and project providers. Every other field type is shown unchanged. Date values are anchored to local midnight before formatting so the shown day cannot shift in a negative UTC offset timezone.

The date-fns locales are now loaded through per-language dynamic imports instead of a single static map, so only the active language is fetched at runtime. This keeps roughly 400 kB of locale data out of the renderer startup chunk. As a result the first render after the user data resolves briefly uses date-fns's en-US default until the active locale chunk arrives, then re-renders in the user's locale.
