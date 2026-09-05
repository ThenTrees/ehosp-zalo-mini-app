import Layout from "@/components/layout";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { ErrorBoundary } from "./components/error-boundary";
import { RouteError } from "./components/route-error";
import NotFound from "./pages/404";
import HomePage from "./pages/home";
import InvoicesPage from "./pages/invoices";
import LinkPage from "./pages/link";
import RecordsPage from "./pages/records";
import RecordDetailPage from "./pages/records/detail";
import ProfilesPage from "./pages/profiles";
import BookingPage from "./pages/booking";
import AppointmentsPage from "./pages/appointments";
import AppointmentDetailPage from "./pages/appointments/detail";
import QueuePage from "./pages/queue";
import NhacThuocPage from "./pages/nhac-thuoc";

const CHILD_ROUTES: RouteObject[] = [
  { path: "/", element: <HomePage /> },
  {
    path: "/link",
    element: <LinkPage />,
    handle: { back: true, title: "Liên kết tài khoản" },
  },
  {
    path: "/profiles",
    element: <ProfilesPage />,
    // `back` đi kèm `tab`: header có nút quay lại (người dùng thường tới
    // đây từ lời chào ở Trang chủ) nhưng thanh tab vẫn còn.
    handle: { tab: true, back: true },
  },
  {
    path: "/booking/:step?",
    element: <BookingPage />,
    handle: { back: true, title: "Đặt lịch khám" },
  },
  {
    path: "/appointments",
    element: <AppointmentsPage />,
    handle: { tab: true },
  },
  {
    path: "/appointments/:id",
    element: <AppointmentDetailPage />,
    handle: { back: true, title: "custom" },
  },
  {
    path: "/queue",
    element: <QueuePage />,
    handle: { back: true, title: "Số thứ tự hôm nay" },
  },
  {
    path: "/records",
    element: <RecordsPage />,
    handle: { back: true, title: "Lịch sử khám" },
  },
  {
    /*
     * Nhắc uống thuốc, khoá theo LƯỢT KHÁM chứ không theo đơn: một lượt khám
     * có thể có nhiều đơn, và người bệnh nghĩ theo "lần khám hôm ấy" chứ không
     * theo mã đơn.
     */
    path: "/nhac-thuoc/:visitId",
    element: <NhacThuocPage />,
    handle: { back: true, title: "Nhắc uống thuốc" },
  },
  {
    // `:visitId` là khoá chính của lượt khám, không phải mã lượt khám —
    // cùng một luật với `/appointments/:id`: mã hiển thị không nằm trong URL.
    path: "/records/:visitId",
    element: <RecordDetailPage />,
    handle: { back: true, title: "custom" },
  },
  {
    /*
     * `/invoices` KHÔNG còn là một tab. `emr-api` đã rút
     * `GET /patient-app/invoices` và `GET /invoices/:id/qr` (29/08/2026, mô-đun
     * thanh toán theo dịch vụ tài chính đi), nên trang chỉ còn là một lời báo
     * tĩnh, không gọi API. Route được giữ để đường dẫn cũ trong lịch sử trình
     * duyệt không rơi vào trang 404; `/invoices/:id/qr` thì đã gỡ hẳn cùng
     * `pages/invoices/qr.tsx` vì không còn gì dẫn tới nó và nó gọi thẳng một
     * tuyến không tồn tại.
     */
    path: "/invoices",
    element: <InvoicesPage />,
    handle: { back: true, title: "Hoá đơn" },
  },
  { path: "*", element: <NotFound /> },
];

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      /*
       * MỘT VÁCH NGĂN CHO MỖI MÀN HÌNH.
       *
       * `ErrorBoundary` ở route gốc bắt lỗi bằng cách thay chính `element` của
       * route ấy — tức thay cả `<Layout/>`. Ngày 03/09/2026 một tuyến bị rút đã
       * đủ để lấy đi Header và thanh tab của mọi người bệnh đã liên kết. Gắn
       * `RouteError` cho từng route con thì lỗi ở lại trong ô `<Outlet/>`;
       * boundary gốc bên dưới chỉ còn là lưới cuối cho lỗi của chính `Layout`.
       */
      children: CHILD_ROUTES.map((route) => ({
        ...route,
        ErrorBoundary: RouteError,
      })),
      ErrorBoundary,
    },
  ],
  { basename: getBasePath() },
);

export function getBasePath() {
  const urlParams = new URLSearchParams(window.location.search);
  const appEnv = urlParams.get("env");

  if (
    import.meta.env.PROD ||
    appEnv === "TESTING_LOCAL" ||
    appEnv === "TESTING" ||
    appEnv === "DEVELOPMENT"
  ) {
    return `/zapps/${window.APP_ID}`;
  }

  return window.BASE_PATH || "";
}

export default router;
