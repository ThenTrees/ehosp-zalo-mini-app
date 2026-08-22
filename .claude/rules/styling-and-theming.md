---
paths:
  - "src/css/**/*.scss"
  - "tailwind.config.js"
  - "postcss.config.js"
  - "app-config.json"
  - "src/pages/**/*.tsx"
  - "src/components/**/*.tsx"
---

# Configuration and theming

- `app-config.json` — app `title` (rendered in the Header via `getConfig(c => c.app.title)`), status bar, and safe-area flags. `.vscode/settings.json` carries a JSON schema for it; that schema requires only `template.name`, so `template.oaID` is absent (GĐ1 has no OA chat CTA).
- `src/css/app.scss` — the five theme variables (`--primary`, `--primary-gradient`, `--highlight`, `--background`, `--disabled`), overrides for `--zaui-*` tokens, and the `--safe-top` / `--safe-bottom` insets. Changing `--primary` re-themes the app.
- `tailwind.config.js` maps those CSS variables to Tailwind colors (`bg-background`, `text-primary`, ...), exposes safe areas as the `st` / `sb` spacing scale (`pt-st`, `pb-sb`), and overrides the whole `fontSize` scale to mobile sizes (`text-base` is 15px, not 16px). Dark mode is selector-based on `[zaui-theme="dark"]`.

Use the mapped Tailwind tokens rather than hard-coded colors or raw pixel sizes, so a theme change keeps working.
