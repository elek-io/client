---
'@elek-io/client': patch
---

Adopt @elek-io/core 0.20.0 and align on a single zod 4.4.3. Core now declares zod as a peer dependency and re-exports z, so the app supplies the shared zod copy. This dedupes zod to one physical version and clears the zodResolver type errors.
