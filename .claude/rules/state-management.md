---
paths:
  - "src/state.ts"
  - "src/types.d.ts"
  - "src/utils/mock.ts"
  - "src/pages/**/*.tsx"
  - "src/components/**/*.tsx"
---

# State (`src/state.ts`)

Every piece of data is a Jotai atom, and the file is the **single seam between UI and backend**. Listing atoms currently hold promises returned by `src/utils/mock.ts` (`atom<Promise<Doctor[]>>(mockDoctors)`); swapping in a `fetch` there requires no UI changes as long as the shape still satisfies the interface in `src/types.d.ts`.

Conventions in that file:

- Listings: plain async atoms (`servicesState`, `doctorsState`, `articlesState`, ...).
- Details: `atomFamily` keyed by numeric id, derived from the listing atom (`serviceByIdState`, `scheduleByIdState`, ...).
- Derived/expensive: `departmentHierarchyState`, `searchResultState` (an `atomFamily` wrapped in `loadable` so the search page can render a pending state).
- Forms: `atomWithReset` (`bookingFormState`, `askFormState`, `feedbackFormState`, `symptomFormState`) — multi-step flows read and write the same atom across steps.
- `userState` is `atomWithRefresh` over `getUserInfo()` from `zmp-sdk`; on rejection it throws `NotifiableError`, which `ErrorBoundary` turns into a toast and then refreshes the atom to re-prompt for permission.

Because listing atoms are promise-valued, components consuming them must sit under the `Suspense` in `Page` (they do by default).
