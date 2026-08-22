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

`Layout` (`src/components/layout.tsx`) is a fixed `h-screen` column: `Header` / `Page` (the scrollable `<Outlet />` in a `Suspense`) / `Footer` / `Toaster` / `ScrollRestoration`. It also calls `hydrateSessionState` once on mount — that is what restores the saved Bearer session and the active patient profile when the mini app reopens.

## Routes (giai đoạn 1)

| Path | Page |
|---|---|
| `/` | Trang chủ |
| `/link` | Liên kết tài khoản |
| `/profiles` | Hồ sơ của tôi |
| `/booking/:step?` | Đặt lịch khám (khoa → ngày + buổi → xác nhận) |
| `/appointments`, `/appointments/:id` | Lịch hẹn và chi tiết |
| `/queue` | Số thứ tự hôm nay |
| `/invoices`, `/invoices/:id/qr` | Hoá đơn và mã thanh toán |
| `/notifications` | Thông báo (chỉ trạng thái) |

`:id` ở các đường dẫn trên là khoá chính, **không bao giờ là mã hẹn** — mã hẹn là thông tin xác thực dạng bearer và không được nằm trong URL (spec §6.2; `buildUrl` trong `src/services/http.ts` chặn việc đó).

## Route `handle` drives the chrome

Read it with `useRouteHandle()` (`src/hooks.ts`); the shell components branch on it:

- `back: true` — Header renders a back button + `title` and the Footer tab bar is hidden entirely.
- `title: "custom"` — Header renders the value of the `customTitleState` atom instead (set by `src/pages/appointments/detail.tsx` on mount, restored on unmount).
- `noScroll: true` — `Page` uses `overflow-hidden` instead of `overflow-y-auto`.
- `scrollRestoration: <px>` — forces a fixed scroll offset instead of the remembered one.

## Adding a page

Create `src/pages/<name>/index.tsx` exporting a `*Page` component, register it in `src/router.tsx` with the appropriate `handle`, and split page sections into sibling files in the same folder (`step2.tsx`, `detail.tsx`, ...).

## Navigation

Navigation uses view transitions: link with `TransitionLink` (a `NavLink` with `viewTransition`) and navigate with `navigate(to, { viewTransition: true })`.
