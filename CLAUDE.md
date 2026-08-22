# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Project guidance lives in `.claude/rules/`, one topic per file. Rules without `paths:` frontmatter load every session; the rest load when Claude touches the files they are scoped to.

| Rule | Scope | Covers |
| --- | --- | --- |
| `.claude/rules/project-overview.md` | always | Stack, entry chain, Vite root, `@` alias |
| `.claude/rules/dev-workflow.md` | always | npm/zmp commands, manual typecheck, `.env`, `www/` |
| `.claude/rules/zalo-sdk.md` | always | The three `zmp-sdk` call sites |
| `.claude/rules/routing-and-app-shell.md` | `src/router.tsx`, `src/pages/**`, shell components | Route tree, `handle` chrome flags, adding a page, view transitions |
| `.claude/rules/state-management.md` | `src/state.ts`, `src/types.d.ts`, `src/utils/mock.ts`, pages, components | Jotai atom conventions, the UI/backend seam, Suspense |
| `.claude/rules/forms.md` | `src/components/form/**`, booking / ask / feedback pages | `fab-form.tsx`, submission, image upload |
| `.claude/rules/styling-and-theming.md` | `src/css/**`, `tailwind.config.js`, `app-config.json`, pages, components | Theme variables, Tailwind token mapping, safe areas, dark mode |
| `.claude/rules/vietnamese-text-and-formatting.md` | `src/**/*.{ts,tsx}` | Vietnamese copy, accent-insensitive search, price/date formatting |

When adding guidance, put it in the rule file that owns the topic instead of growing this file.
