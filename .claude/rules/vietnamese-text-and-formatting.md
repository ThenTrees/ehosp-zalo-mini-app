---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Vietnamese copy, search, and formatting

- All user-facing copy is **Vietnamese**.
- Vietnamese text search must go through `toLowerCaseNonAccentVietnamese()` in `src/utils/miscellaneous.tsx` — never compare raw accented strings.
- Prices and dates go through `src/utils/format.ts` (`formatPrice` renders VND); don't inline currency or date formatting at the call site.
