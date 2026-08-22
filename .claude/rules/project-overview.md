# Project overview

A Zalo Mini App (ZMP) for a healthcare provider, based on the **ZaUI Doctor** template.

- React 18 + TypeScript + Vite 5, UI from `zmp-ui`, state via Jotai, styling via Tailwind + SCSS.
- All user-facing copy is **Vietnamese**.

**Entry chain:** `index.html` -> `src/app.ts` (mounts `RouterProvider`, imports `zaui.min.css` + `css/tailwind.scss` + `css/app.scss`, and copies `app-config.json` onto `window.APP_CONFIG`) -> `src/router.tsx`.

**Vite root is `./src`** (`vite.config.mts`), so `index.html`, `app-config.json`, `tailwind.config.js` etc. sit one level above the root. The `@` alias resolves to `/src`; prefer `@/...` imports.

`www/` is build output; never edit it.
