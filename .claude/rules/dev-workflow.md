# Commands and dev workflow

```bash
npm install
npm start            # zmp start -> dev server on localhost:3000
npm run format       # prettier --write src/**/*.{js,jsx,ts,tsx}
npm run login        # zmp login (needed once before deploy)
npm run deploy       # zmp deploy -> publishes to Zalo, output goes to www/
```

- There is no test suite, no linter, and no typecheck script. `tsc --noEmit -p tsconfig.json` works for a manual type check.
- `zmp start` / `zmp deploy` need the [Zalo Mini App CLI](https://mini.zalo.me/docs/dev-tools/cli/intro/) plus `APP_ID` / `ZMP_TOKEN` in `.env` (gitignored).
- Vite 5 is not fully supported by the CLI or by Zalo Mini App Studio — the VS Code **Zalo Mini App Extension** (Run panel > Start) is the supported dev path.
- `www/` is build output; never edit it.
