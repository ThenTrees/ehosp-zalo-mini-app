import Layout from "@/components/layout";
import { createBrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "./components/error-boundary";
import NotFound from "./pages/404";
import HomePage from "./pages/home";
import InvoicesPage from "./pages/invoices";
import InvoiceQrPage from "./pages/invoices/qr";
import NotificationsPage from "./pages/notifications";
import LinkPage from "./pages/link";
import ProfilesPage from "./pages/profiles";
import BookingPage from "./pages/booking";
import AppointmentsPage from "./pages/appointments";
import AppointmentDetailPage from "./pages/appointments/detail";
import QueuePage from "./pages/queue";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      children: [
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
          path: "/invoices",
          element: <InvoicesPage />,
          handle: { tab: true },
        },
        {
          path: "/invoices/:id/qr",
          element: <InvoiceQrPage />,
          handle: { back: true, title: "Thanh toán" },
        },
        {
          path: "/notifications",
          element: <NotificationsPage />,
          handle: { back: true, title: "Thông báo" },
        },
        { path: "*", element: <NotFound /> },
      ],
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
