# Commands and dev workflow

```bash
npm install
npm start            # zmp start -P 3002 -> Zalo frame :3002, real app :3001
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
- `zmp start -P N` binds **two** ports: N serves the Zalo phone frame, N-1 serves the real app (the frame embeds an iframe at `port - 1`). Both must avoid 3000, which belongs to emr-api — hence 3002.
- Point `VITE_API_BASE_URL` at `127.0.0.1`, not `localhost`: zmp binds `::1` while Docker binds `127.0.0.1`, so `localhost` resolves to IPv6 first and API calls loop back into the dev server, which answers every path with `index.html`.
- emr-api needs `CORS_ORIGINS=http://localhost:3001` in `d:/projects/eHosp/.env` — the app's origin. Empty means no CORS middleware at all, and every call dies at preflight because the client sends `X-Patient-Session`.
- `www/` is build output; never edit it.

## Thử với emr-api thật mà không cần ứng dụng Zalo

`getPhoneNumber()` của `zmp-sdk` chỉ chạy bên trong ứng dụng Zalo thật, nên trên
trình duyệt không có cách nào đi trọn luồng liên kết. Đặt `VITE_ZALO_PHONE_GIA`
trong `.env` thành một số **có thật trong `emr_patient_link`**:

```bash
VITE_USE_FAKE=false
VITE_API_BASE_URL=http://127.0.0.1:3000/api/patient-app
VITE_ZALO_PHONE_GIA=0908220101      # BN0000001, ngày sinh 1968-03-12
```

Máy khách gửi thẳng số ấy làm mã; máy chủ ở chế độ phát triển (thiếu
`ZALO_APP_SECRET`, `NODE_ENV` khác `production`) coi chính nó LÀ số điện thoại.
Tầng dữ liệu **vẫn thật**. `readRuntimeConfig` bỏ qua cờ ở bản dựng phát hành.

Điều kiện phía máy chủ: emr-api phải mang mã có `modules/patient-app` (nhánh
`pr-15` trở đi), và `CORS_ORIGINS` phải chứa `http://localhost:3001` — hoặc
`:3009` nếu chạy `zmp start -P 3010`.

## Đối chiếu với emr-api thật

`npm test` chạy trên tầng dữ liệu giả và **không** cần máy chủ. Bên cạnh đó có
một bộ đối chiếu chỉ chạy khi được cấp máy chủ + phiên thật —
`src/services/__tests__/contract-parity.test.ts`, tự bỏ qua khi thiếu biến môi
trường, nên nó không làm hỏng CI.

```bash
EMR_API_URL=http://127.0.0.1:3000/api/patient-app \
EMR_PATIENT_SESSION=<mã phiên> \
EMR_PATIENT_ID=<mã hồ sơ> \
npx vitest run src/services/__tests__/contract-parity.test.ts
```

Bộ giả chỉ chứng minh mini app **gửi** đúng thứ nó định gửi; bộ này chứng minh
máy chủ **trả về** đúng hình dạng hợp đồng — đúng loại lệch đã tìm thấy ngày
2026-08-30 (`date` vs `apptDate`, `confirmed` vs `patientConfirmed`).

Dựng máy chủ để chạy nó, không cần OpenMRS hay OpenELIS:

```bash
cd d:/projects/eHosp && docker compose up -d db          # chỉ MariaDB
cd services/emr-api && DB_HOST=127.0.0.1 DB_PORT=3307 \
  OPENMRS_OPTIONAL=true SEED_OPENMRS=false \
  LIS_FHIR_URL=http://127.0.0.1:9/fhir \
  npx tsx src/index.ts
```

Cấp phiên mà không cần Zalo (`getPhoneNumber` chỉ chạy trong ứng dụng Zalo
thật): chèn một dòng `emr_patient_app_link` và một dòng
`emr_patient_app_session` với `sid_hash = SHA2('<mã phiên>', 256)`.

