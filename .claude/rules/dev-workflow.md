# Commands and dev workflow

```bash
npm install
npm start            # zmp start -> dev server on localhost:3000
npm test             # vitest run -> unit tests for src/services
npm run typecheck    # tsc --noEmit -p tsconfig.json
npm run format       # prettier --write src/**/*.{js,jsx,ts,tsx}
npm run login        # zmp login (needed once before deploy)
npm run deploy       # zmp deploy -> publishes to Zalo, output goes to www/
```

- `npm test` and `npm run typecheck` are the two gates; run both before every commit. There is no linter.
- Tests cover `src/services` only. Pages have no unit tests — verify them by running the app.
- `npx vite build` alone does **not** work: `index.html` sits at the project root while Vite's `root` is `./src`. Building goes through `zmp deploy`.
- `zmp start` / `zmp deploy` need the [Zalo Mini App CLI](https://mini.zalo.me/docs/dev-tools/cli/intro/) plus `APP_ID` / `ZMP_TOKEN` in `.env` (gitignored).
- Vite 5 is not fully supported by the CLI or by Zalo Mini App Studio — the VS Code **Zalo Mini App Extension** (Run panel > Start) is the supported dev path.
- `www/` is build output; never edit it.
