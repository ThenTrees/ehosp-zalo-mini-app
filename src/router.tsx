import Layout from "@/components/layout";
import { createBrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "./components/error-boundary";
import NotFound from "./pages/404";
import PlaceholderPage from "./pages/placeholder";
import LinkPage from "./pages/link";
import ProfilesPage from "./pages/profiles";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      children: [
        { path: "/", element: <PlaceholderPage title="Trang chủ" /> },
        {
          path: "/link",
          element: <LinkPage />,
          handle: { back: true, title: "Liên kết tài khoản" },
        },
        {
          path: "/profiles",
          element: <ProfilesPage />,
          handle: { back: true, title: "Hồ sơ của tôi" },
        },
        {
          path: "/booking/:step?",
          element: <PlaceholderPage title="Đặt lịch khám" />,
          handle: { back: true, title: "Đặt lịch khám" },
        },
        { path: "/appointments", element: <PlaceholderPage title="Lịch hẹn" /> },
        {
          path: "/appointments/:id",
          element: <PlaceholderPage title="Chi tiết lịch hẹn" />,
          handle: { back: true, title: "custom" },
        },
        {
          path: "/queue",
          element: <PlaceholderPage title="Số thứ tự" />,
          handle: { back: true, title: "Số thứ tự hôm nay" },
        },
        {
          path: "/invoices",
          element: <PlaceholderPage title="Hóa đơn" />,
          handle: { back: true, title: "Hóa đơn" },
        },
        {
          path: "/invoices/:id/qr",
          element: <PlaceholderPage title="Mã thanh toán" />,
          handle: { back: true, title: "Thanh toán" },
        },
        {
          path: "/notifications",
          element: <PlaceholderPage title="Thông báo" />,
          handle: { back: true, title: "Thông báo" },
        },
        { path: "*", element: <NotFound /> },
      ],
      ErrorBoundary,
    },
  ],
  { basename: getBasePath() }
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
