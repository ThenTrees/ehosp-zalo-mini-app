import { useEffect } from "react";
import toast from "react-hot-toast";
import { EmptyState } from "@/components/ui";
import { AlertCircleIcon } from "@/components/icons";

/**
 * Màn 404 — dùng cho cả route không khớp lẫn lỗi bị `ErrorBoundary` bắt.
 *
 * Trước đây màn này gọi `navigate(-1)` vô điều kiện lúc mount. Khi app là mục
 * ĐẦU TIÊN trong lịch sử — người bệnh mở thẳng một đường dẫn, đúng cách Zalo mở
 * mini app từ QR hay từ liên kết — lùi một bước là rơi hẳn ra ngoài app, để lại
 * một tab trắng. Và vì `ErrorBoundary` render chính màn này, mọi lỗi route đều
 * biến thành "ứng dụng biến mất", không một lời giải thích (2026-09-01).
 *
 * Nay hiện một màn có thật kèm đường đi tiếp, và đưa về Trang chủ chứ không lùi
 * lịch sử: lùi lại thường rơi đúng vào trang vừa gây lỗi, tạo ra một vòng lặp.
 */
export default function NotFound(props: { noToast?: boolean }) {
  useEffect(() => {
    if (!props.noToast) {
      toast.error("Trang không tồn tại");
    }
  }, [props.noToast]);

  return (
    <EmptyState
      icon={AlertCircleIcon}
      title="Không mở được trang này"
      hint="Đường dẫn không tồn tại, hoặc vừa có lỗi xảy ra. Bạn thử lại từ Trang chủ nhé."
      actionLabel="Về trang chủ"
      actionTo="/"
    />
  );
}
