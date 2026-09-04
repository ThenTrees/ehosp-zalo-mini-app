import { useEffect } from "react";
import { useNavigate, useRouteError } from "react-router-dom";
import toast from "react-hot-toast";
import { ApiError } from "@/services/http";
import { NotifiableError } from "@/utils/errors";
import { AlertCircleIcon } from "./icons";
import { EmptyState } from "./ui";

/**
 * Vách ngăn của MỘT màn hình.
 *
 * `router.tsx` gắn component này làm `ErrorBoundary` cho từng route con. Trước
 * 03/09/2026 chỉ có đúng một boundary, và nó nằm ở route GỐC — cùng route mang
 * `element: <Layout/>`. Hệ quả: khi Trang chủ ném lỗi vì tuyến `/invoices` bị
 * rút, react-router thay CẢ `<Layout/>` bằng trang lỗi, nên Header và thanh tab
 * biến mất theo và người bệnh không còn đường đi tới bảy màn hình vẫn chạy tốt.
 *
 * Đặt boundary ở route con thì trang lỗi rơi vào đúng ô `<Outlet/>`: khung app
 * còn nguyên, người bệnh bấm sang tab khác được ngay.
 *
 * KHÔNG dùng `<NotFound/>` ở đây. `NotFound` gọi `navigate(-1)` lúc mount, nên
 * một màn hình lỗi sẽ tự đá người dùng lùi lại — và nếu màn hình họ vừa rời
 * cũng đang lỗi thì thành vòng lặp. Màn hình lỗi phải đứng yên và nói rõ.
 */
export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    if (error instanceof NotifiableError) {
      toast.error(error.message);
    } else {
      console.warn("Một màn hình lỗi, khung ứng dụng vẫn còn:", error);
    }
  }, [error]);

  // Thông báo của `emr-api` đã là tiếng Việt và nói đúng việc phải làm; câu dự
  // phòng chỉ dùng khi lỗi không phải từ máy chủ (lỗi render, mất mạng).
  const hint =
    error instanceof ApiError
      ? error.message
      : "Không tải được màn hình này. Các phần khác của ứng dụng vẫn dùng được.";

  return (
    <EmptyState
      icon={AlertCircleIcon}
      title="Màn hình này đang lỗi"
      hint={hint}
      actionLabel="Về trang chủ"
      onAction={() => navigate("/", { viewTransition: true })}
    />
  );
}
