---
paths:
  - "src/router.tsx"
  - "src/hooks.ts"
  - "src/pages/**/*.tsx"
  - "src/components/layout.tsx"
  - "src/components/header.tsx"
  - "src/components/footer.tsx"
  - "src/components/page.tsx"
  - "src/components/transition-link.tsx"
  - "src/components/scroll-restoration.tsx"
---

# Routing and the app shell

`src/router.tsx` defines a single `createBrowserRouter` tree: one `Layout` route with every page as a child. **Every child route carries its own `ErrorBoundary`** (`RouteError`, `src/components/route-error.tsx`); the one on the root route is only a last resort. A single boundary on the root route replaces `<Layout/>` itself — that is how one withdrawn API route took down the header and the tab bar on 2026-09-03. The basename is computed by `getBasePath()` — in production or when `?env=TESTING*/DEVELOPMENT` it becomes `/zapps/${window.APP_ID}`, otherwise `window.BASE_PATH`.

`Layout` (`src/components/layout.tsx`) is a fixed `h-screen` column: `Header` / `Page` (the scrollable `<Outlet />` in a `Suspense`) / `Footer` / `Toaster` / `ScrollRestoration`. It also calls `hydrateSessionState` once on mount — that is what restores the saved patient session and the active patient profile when the mini app reopens.

## Routes (giai đoạn 1)

| Path | Page | Chrome |
|---|---|---|
| `/` | Trang chủ | Header chào + thanh tab |
| `/link` | Liên kết tài khoản | `back` |
| `/profiles` | Hồ sơ của tôi | `tab` + `back` |
| `/booking/:step?` | Đặt lịch khám (khoa → ngày + buổi → xác nhận) | `back` |
| `/appointments` | Lịch hẹn của tôi | `tab` |
| `/appointments/:id` | Chi tiết lịch hẹn | `back`, `title: "custom"` |
| `/queue` | Số thứ tự hôm nay | `back` |
| `/records` | Lịch sử khám (lượt khám / đơn thuốc, chỉ trạng thái) | `back` |
| `/records/:visitId` | Chi tiết một lần khám | `back`, `title: "custom"` |
| `/invoices` | Hoá đơn — **tạm ngưng**, lời báo tĩnh, không gọi API, không có tab | `back` |

`:id` ở các đường dẫn trên là khoá chính, **không bao giờ là mã hẹn** — mã hẹn là thông tin xác thực dạng bearer và không được nằm trong URL (spec §6.2; `buildUrl` trong `src/services/http.ts` chặn việc đó).

## Route `handle` drives the chrome

Read it with `useRouteHandle()` (`src/hooks.ts`); the shell components branch on it:

- **không có cờ nào** — Header lời chào ("Xin chào, <tên hồ sơ>"), thanh tab hiện. Chỉ Trang chủ dùng.
- `tab: true` — Header gọn (tên phòng khám), thanh tab hiện. Tên trang do chính trang vẽ bằng `PageHeading`.
- `back: true` — Header có nút quay lại + `title`, và thanh tab **bị ẩn hoàn toàn**.
- `tab: true` **+** `back: true` — thanh tab vẫn hiện, header thêm nút quay lại và **bỏ tên phòng khám** (mũi tên cộng với vùng 90px dành cho nút gốc của Zalo không chừa đủ chỗ; tên trang đã nằm ngay dưới ở cỡ 24px). Dùng cho `/profiles`, nơi người dùng thường tới từ lời chào ở Trang chủ chứ không phải từ thanh tab. Đây là lý do `Footer` kiểm tra `handle.back && !handle.tab` chứ không chỉ `handle.back`.
- `title: "custom"` — Header hiện giá trị atom `customTitleState` (đặt lúc mount bởi `src/pages/appointments/detail.tsx` và `src/pages/records/detail.tsx`, khôi phục lúc unmount).
- `noScroll: true` — `Page` dùng `overflow-hidden` thay `overflow-y-auto`.
- `scrollRestoration: <px>` — ép một mức cuộn cố định.

## Thanh tab

Ba mục — Trang chủ · Lịch hẹn · Hồ sơ — trong lưới 5 cột: hai mục đầu ở cột 1-2, cột 3 để trống cho **nút "+" tròn nổi** dẫn tới `/booking`, mục cuối trải cột 4-5 và tự căn giữa (bốn tâm điểm rơi đúng 10/30/50/70%). Mục "Hoá đơn" đã gỡ ngày 03/09/2026 cùng lúc tuyến `/patient-app/invoices` bị rút ở máy chủ: **một tuyến không tồn tại không được nằm trên thanh điều hướng**. Số thứ tự không có tab riêng; nó là thẻ trạng thái đầu Trang chủ (`src/pages/home/status-card.tsx`) và một ô trong lưới thao tác nhanh.

## Header đọc dữ liệu người bệnh

Lời chào đọc atom, mà Header nằm **ngoài** `ErrorBoundary` của route. Nó vì thế phải bọc trong `SilentBoundary` + `Suspense` (`src/components/silent-boundary.tsx`): không bọc thì một lỗi mạng trong phần trang trí sẽ nổi lên tận `RouterProvider`, rơi vào trang 404 và đá người dùng lùi một bước lịch sử.

Chuông thông báo đã bị gỡ khỏi Header ngày 2026-08-30: `emr-api` không có tuyến `/notifications` nào, nên chuông chỉ dẫn tới một màn hình dữ liệu bịa.

## Adding a page

Create `src/pages/<name>/index.tsx` exporting a `*Page` component, register it in `src/router.tsx` with the appropriate `handle`, and split page sections into sibling files in the same folder (`step2.tsx`, `detail.tsx`, `status-card.tsx`, ...).

## Navigation

Navigation uses view transitions: link with `TransitionLink` (a `NavLink` with `viewTransition`) and navigate with `navigate(to, { viewTransition: true })`.
