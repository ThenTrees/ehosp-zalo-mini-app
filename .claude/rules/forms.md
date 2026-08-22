---
paths:
  - "src/components/form/**/*.tsx"
  - "src/pages/booking/**/*.tsx"
  - "src/pages/ask/**/*.tsx"
  - "src/pages/feedback/**/*.tsx"
---

# Forms

- Wrap form content in `src/components/form/fab-form.tsx`: it owns the submit handler, the loading state, and the sticky bottom action button(s).
- Submission today is `await wait(1500); promptJSON(formData)` — replace that body with the real request and keep the subsequent `navigate(...)`.
- Image upload goes through `chooseImage` from `zmp-sdk` in `src/components/form/textarea-with-image-upload.tsx`.
- Multi-step flows keep their data in a single `atomWithReset` form atom read and written across steps (see `src/state.ts`).
