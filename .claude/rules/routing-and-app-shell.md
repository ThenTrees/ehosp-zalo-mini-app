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

`src/router.tsx` defines a single `createBrowserRouter` tree: one `Layout` route with every page as a child, plus a route-level `ErrorBoundary`. The basename is computed by `getBasePath()` — in production or when `?env=TESTING*/DEVELOPMENT` it becomes `/zapps/${window.APP_ID}`, otherwise `window.BASE_PATH`.

`Layout` (`src/components/layout.tsx`) is a fixed `h-screen` column: `Header` / `Page` (the scrollable `<Outlet />` in a `Suspense`) / `Footer` / `Toaster` / `ScrollRestoration`. It also calls `hydrateSessionState` once on mount — that is what restores the saved Bearer session, the active patient profile, and the "đã xem thông báo" mark when the mini app reopens.

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
| `/invoices` | Hoá đơn | `tab` |
| `/invoices/:id/qr` | Mã thanh toán | `back` |
| `/notifications` | Thông báo (chỉ trạng thái) | `back` |

`:id` ở các đường dẫn trên là khoá chính, **không bao giờ là mã hẹn** — mã hẹn là thông tin xác thực dạng bearer và không được nằm trong URL (spec §6.2; `buildUrl` trong `src/services/http.ts` chặn việc đó).

## Route `handle` drives the chrome

Read it with `useRouteHandle()` (`src/hooks.ts`); the shell components branch on it:

- **không có cờ nào** — Header lời chào ("Xin chào, <tên hồ sơ>" + chuông), thanh tab hiện. Chỉ Trang chủ dùng.
- `tab: true` — Header gọn (tên phòng khám + chuông), thanh tab hiện. Tên trang do chính trang vẽ bằng `PageHeading`.
- `back: true` — Header có nút quay lại + `title`, và thanh tab **bị ẩn hoàn toàn**.
- `tab: true` **+** `back: true` — thanh tab vẫn hiện, header thêm nút quay lại và **bỏ tên phòng khám** (mũi tên cộng với vùng 90px dành cho nút gốc của Zalo không chừa đủ chỗ; tên trang đã nằm ngay dưới ở cỡ 24px). Dùng cho `/profiles`, nơi người dùng thường tới từ lời chào ở Trang chủ chứ không phải từ thanh tab. Đây là lý do `Footer` kiểm tra `handle.back && !handle.tab` chứ không chỉ `handle.back`.
- `title: "custom"` — Header hiện giá trị atom `customTitleState` (đặt bởi `src/pages/appointments/detail.tsx` lúc mount, khôi phục lúc unmount).
- `noScroll: true` — `Page` dùng `overflow-hidden` thay `overflow-y-auto`.
- `scrollRestoration: <px>` — ép một mức cuộn cố định.

## Thanh tab

Bốn mục — Trang chủ · Lịch hẹn · Hoá đơn · Hồ sơ — trong lưới 5 cột, cột giữa để trống cho **nút "+" tròn nổi** dẫn tới `/booking`. Số thứ tự không có tab riêng; nó là thẻ trạng thái đầu Trang chủ (`src/pages/home/status-card.tsx`) và một ô trong lưới thao tác nhanh.

## Header đọc dữ liệu người bệnh

Lời chào và chuông đều đọc atom, mà Header nằm **ngoài** `ErrorBoundary` của route. Cả hai vì thế phải bọc trong `SilentBoundary` + `Suspense` (`src/components/silent-boundary.tsx`): không bọc thì một lỗi mạng trong phần trang trí sẽ nổi lên tận `RouterProvider`, rơi vào trang 404 và đá người dùng lùi một bước lịch sử.

## Adding a page

Create `src/pages/<name>/index.tsx` exporting a `*Page` component, register it in `src/router.tsx` with the appropriate `handle`, and split page sections into sibling files in the same folder (`step2.tsx`, `detail.tsx`, `status-card.tsx`, ...).

## Navigation

Navigation uses view transitions: link with `TransitionLink` (a `NavLink` with `viewTransition`) and navigate with `navigate(to, { viewTransition: true })`.
