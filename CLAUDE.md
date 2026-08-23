# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Zalo Mini App (ZMP) cho **người bệnh** của phòng khám phường Sài Gòn. Đây là bề mặt thứ hai của hệ EMR ở `d:/projects/eHosp` (React `emr-ui` + Node `emr-api` + OpenMRS), **không phải một hệ thống lưu trữ riêng**.

React 18 + TypeScript + Vite 5, UI từ `zmp-ui`, state bằng Jotai, styling bằng Tailwind + SCSS. Toàn bộ chữ hiển thị cho người dùng là **tiếng Việt**. Khởi đầu từ template ZaUI Doctor, nay đã cắt bỏ phần lớn.

**Phạm vi giai đoạn 1:** liên kết tài khoản, đặt lịch khám, lịch hẹn của tôi, số thứ tự, hoá đơn + mã thanh toán, thông báo trạng thái.

**Cố ý KHÔNG làm — đây là ràng buộc quan trọng nhất của dự án:** mini app không hiển thị nội dung lâm sàng. Không chẩn đoán, không kết quả xét nghiệm, không tên thuốc, không bệnh án. Sổ sức khoẻ điện tử trên VNeID đã làm việc đó và có giá trị pháp lý tương đương bản giấy (QĐ 31/QĐ-BYT, 06/01/2026); phòng khám bắt buộc phải đồng bộ dữ liệu vào đó. Tự xây màn hình xem bệnh án là làm bản kém hơn thứ người bệnh đã có trong túi, kèm toàn bộ rủi ro riêng tư. `src/services/__tests__/khong-lam-sang.test.ts` canh chừng điều này tự động.

Tài liệu: spec ở `docs/superpowers/specs/2026-08-22-zalo-mini-app-gd1-design.md`, kế hoạch ở `docs/superpowers/plans/`, thiết kế mô-đun gốc ở `eHosp/docs/09-THIET-KE-DICH-VU/12-MOBILE-APP.md`.

## Commands

```bash
npm install
npm start            # zmp start -> dev server on localhost:3000
npm test             # vitest run -> unit tests cho src/services
npm run typecheck    # tsc --noEmit -p tsconfig.json
npm run format       # prettier --write src/**/*.{js,jsx,ts,tsx}
npm run login        # zmp login (cần một lần trước khi deploy)
npm run deploy       # zmp deploy -> publish lên Zalo, output vào www/
```

`npm test` và `npm run typecheck` là hai cổng kiểm tra; chạy cả hai trước mỗi commit. Không có linter. Test chỉ phủ `src/services`; các trang không có unit test — kiểm bằng cách chạy thật.

`npx vite build` trần **không chạy được**: `index.html` nằm ở thư mục gốc trong khi `root` của Vite là `./src`. Build đi qua `zmp deploy`.

`zmp start`/`zmp deploy` cần [Zalo Mini App CLI](https://mini.zalo.me/docs/dev-tools/cli/intro/) cùng `APP_ID`/`ZMP_TOKEN` trong `.env` (gitignored; xem `.env.example`). README ghi Vite 5 chưa được CLI và Zalo Mini App Studio hỗ trợ đầy đủ — đường phát triển được hỗ trợ là **Zalo Mini App Extension** của VS Code (Run panel > Start). `www/` là kết quả build; không bao giờ sửa tay.

## Architecture

**Entry chain:** `index.html` -> `src/app.ts` (mounts `RouterProvider`, imports `zaui.min.css` + `css/tailwind.scss` + `css/app.scss`, copies `app-config.json` onto `window.APP_CONFIG`) -> `src/router.tsx`.

**Vite root là `./src`** (`vite.config.mts`), nên `index.html`, `app-config.json`, `tailwind.config.js` nằm trên root một cấp. `envDir: ".."` cho Vite và ZMP CLI dùng chung `.env` ở gốc. Alias `@` trỏ tới `/src`; ưu tiên import `@/...`.

### Tầng dữ liệu (`src/services/`)

Đây là tầng duy nhất chạm mạng.

| Tệp | Việc |
|---|---|
| `config.ts` | Đọc `import.meta.env` thành `RuntimeConfig` |
| `session.ts` | Lưu/đọc/xoá phiên Bearer qua kho lưu trữ `zmp-sdk` |
| `http.ts` | `fetch` + header Bearer + `ApiError`; `buildUrl` **ném lỗi** nếu ai đó đưa `code`/`token` vào query string |
| `patient-app-api.ts` | `interface PatientAppApi` — hợp đồng §6 của spec — và cài đặt HTTP thật |
| `fake/` | Cài đặt giả cùng interface, mô phỏng cả quota 30% và luật tối đa 2 lịch hẹn đang mở |
| `index.ts` | Chọn thật/giả theo `VITE_USE_FAKE`, giữ token hiện hành |

Đổi sang back-end thật = đặt `VITE_USE_FAKE=false` và `VITE_API_BASE_URL` trong `.env`. Không sửa dòng mã nào.

Hai ràng buộc bảo mật đã được biến thành test chạy được: **không bí mật nào trong URL** (`http.test.ts`) và **không trường lâm sàng nào trong hợp đồng dữ liệu** (`khong-lam-sang.test.ts`).

### State (`src/state.ts`)

Ranh giới duy nhất giữa UI và dữ liệu. Trang chỉ đọc atom.

- Danh mục: atom async phẳng (`departmentsState`).
- **Mọi atom đọc dữ liệu người bệnh là `atomFamily` khoá theo `patientId`** — chuyển hồ sơ người thân không được lẫn dữ liệu.
- Cần làm mới sau khi ghi thì dùng `atomWithRefresh`, gọi setter không tham số.
- Form nhiều bước: `atomWithReset` (`bookingFormState`).
- `activePatientIdState` đọc ra `number | null`, ghi vào thì đồng thời lưu xuống kho lưu trữ; `hydrateSessionState` nạp lại lúc `Layout` mount.

Atom là promise, nên component tiêu thụ phải nằm dưới `Suspense` trong `Page` (mặc định đã vậy).

### Routing và app shell

`src/router.tsx` là một cây `createBrowserRouter`: một route `Layout` với mọi trang là con, kèm `ErrorBoundary` ở mức route. `getBasePath()` tính basename — production hoặc `?env=TESTING*/DEVELOPMENT` thì thành `/zapps/${window.APP_ID}`.

Route GĐ1: `/`, `/link`, `/profiles`, `/booking/:step?`, `/appointments`, `/appointments/:id`, `/queue`, `/invoices`, `/invoices/:id/qr`, `/notifications`.

`:id` là khoá chính, **không bao giờ là mã hẹn** — mã hẹn là thông tin xác thực dạng bearer và không được nằm trong URL.

**Route `handle` điều khiển phần khung.** Đọc bằng `useRouteHandle()` (`src/hooks.ts`):

- **không cờ nào** — Header lời chào ("Xin chào, <tên hồ sơ>" + chuông) và thanh tab. Chỉ Trang chủ dùng.
- `tab: true` — Header gọn (tên phòng khám + chuông), thanh tab hiện; tên trang do trang tự vẽ bằng `PageHeading`. Dùng cho `/appointments`, `/invoices`, `/profiles`.
- `back: true` — Header hiện nút quay lại + `title`, và thanh tab dưới bị ẩn hoàn toàn.
- `tab` **+** `back` cùng lúc — thanh tab vẫn hiện, header thêm nút quay lại và bỏ tên phòng khám cho đủ chỗ. `/profiles` dùng tổ hợp này vì người dùng hay tới đó từ lời chào ở Trang chủ. Vì vậy `Footer` kiểm tra `handle.back && !handle.tab`.
- `title: "custom"` — Header hiện giá trị atom `customTitleState` (đặt bởi `src/pages/appointments/detail.tsx` lúc mount, khôi phục lúc unmount).
- `noScroll: true` — `Page` dùng `overflow-hidden` thay `overflow-y-auto`.
- `scrollRestoration: <px>` — ép một mức cuộn cố định.

Thanh tab có bốn mục (Trang chủ · Lịch hẹn · Hoá đơn · Hồ sơ) trong lưới 5 cột, cột giữa để trống cho nút "+" tròn nổi dẫn tới `/booking`. Số thứ tự không có tab riêng — nó là thẻ trạng thái đầu Trang chủ.

Lời chào và chuông ở Header đọc dữ liệu người bệnh nhưng Header nằm **ngoài** `ErrorBoundary` của route, nên cả hai phải bọc trong `SilentBoundary` + `Suspense` (`src/components/silent-boundary.tsx`). Không bọc thì một lỗi mạng ở phần trang trí sẽ rơi vào trang 404 và đá người dùng lùi một bước lịch sử.

Thêm trang: tạo `src/pages/<name>/index.tsx` xuất component `*Page`, đăng ký trong `router.tsx` với `handle` phù hợp, tách phần của trang thành tệp anh em cùng thư mục.

Điều hướng dùng view transition: `TransitionLink` hoặc `navigate(to, { viewTransition: true })`.

### Zalo SDK surface

`zmp-sdk` chỉ dùng ở hai mô-đun — giữ nguyên như vậy:

- `getPhoneNumber` — `src/pages/link/index.tsx`. Nó chỉ trả về một **token**, không phải số điện thoại; máy chủ đổi token đó ra số thật bằng secret key của Zalo. Secret key không bao giờ nằm trong mini app.
- `getStorage`/`setStorage`/`removeStorage` — `src/services/session.ts`.

## Configuration and theming

- `app-config.json` — `title` (render ở Header qua `getConfig(c => c.app.title)`), status bar, cờ safe-area. `.vscode/settings.json` mang JSON schema; schema chỉ bắt buộc `template.name` nên `template.oaID` đã được gỡ (GĐ1 không có nút chat OA).
- Chủ đề là bộ design **"Clinical Clarity"** (Stitch, `stitch_tr_l_y_t_zalo/clinical_clarity/DESIGN.md` — ngoài kho mã). Font là font hệ thống, không nhúng Inter.
- `src/css/app.scss` — nguồn duy nhất của màu: xanh lâm sàng (`--primary` `#0066ff`, `--primary-ink`, `--primary-soft`), bề mặt (`--background`, `--surface`, `--surface-sunken`), chữ và kẻ (`--ink`, `--ink-muted`, `--line`, `--line-strong`), trạng thái (`--success`/`--warning`/`--error` mỗi cái kèm một bản `-soft`). `--ink-muted` là chữ phụ; `--disabled` chỉ còn nghĩa vô hiệu thật. Kèm ghi đè `--zaui-*` và inset `--safe-top`/`--safe-bottom`.
- `tailwind.config.js` ánh xạ các biến đó thành lớp Tailwind (`bg-surface`, `text-ink-muted`, `border-line`, ...), phơi safe area thành thang `st`/`sb`, và đặt thang chữ + bo góc theo đúng con số của design: `text-base` là **16px**, `rounded-md` là 12px, `rounded-xl` là **24px** (khác mặc định Tailwind). Bóng: `shadow-card`, `shadow-overlay`, `shadow-action`. Dark mode theo selector `[zaui-theme="dark"]`.
- Tailwind **không** pha được alpha cho màu khai bằng biến CSS — `bg-primary-soft/40` không chạy, chọn token khác.
- Bộ UI dùng chung ở `src/components/ui/` (`Card`, `StatusChip`, `SectionHeader`, `Segmented`, `ListRow`, `QuickActions`, `PageHeading`, `EmptyState`), nút ở `src/components/button.tsx` (`fullWidth={false}` cho nút hẹp, không dùng `w-auto`), icon gom trong `src/components/icons/index.tsx`.
- Tìm kiếm tiếng Việt phải đi qua `toLowerCaseNonAccentVietnamese()` trong `src/utils/miscellaneous.tsx`; tiền và ngày qua `src/utils/format.ts` (`formatPrice` render `1.450.000đ`; `formatIsoDate`/`formatIsoDateLong`/`todayIso` tự tách chuỗi `YYYY-MM-DD` thay vì `new Date(iso)`, vì hàm dựng đó hiểu chuỗi chỉ có ngày là nửa đêm UTC).
- `browserslist` nhắm tới Chrome 49 / iOS 9.3, và `lib` trong `tsconfig.json` cố ý dừng ở `es2017` — đừng nới nó ra chỉ để dùng một API mới.
