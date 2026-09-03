import { EmptyState } from "@/components/ui";
import { ReceiptIcon } from "@/components/icons";

/**
 * Hoá đơn — TẠM NGƯNG, và trang này cố ý KHÔNG gọi API.
 *
 * `emr-api` đã rút `GET /patient-app/invoices` và `GET /invoices/:id/qr` ngày
 * 29/08/2026: hai tuyến ấy gọi `modules/payment/`, mô-đun đã đi theo dịch vụ
 * tài chính cùng mười tám bảng tiền, và không nối tạm qua `taiChinhProxyRouter`
 * được vì cửa ấy chỉ chuyển tiếp phiên NHÂN VIÊN. Tuyến sẽ trở lại khi dịch vụ
 * tài chính mở một cửa nội bộ cho tự phục vụ.
 *
 * Cho tới lúc đó trang chỉ nói thật một câu. Trước 03/09/2026 nó gọi
 * `invoicesState`, nhận 404 và ném lỗi lên tận `ErrorBoundary` của route gốc —
 * kéo sập cả `<Layout/>` chứ không chỉ riêng nó. Không còn mục nào trên thanh
 * tab hay ô thao tác nhanh dẫn tới đây; route được giữ lại chỉ để những đường
 * dẫn cũ còn trong lịch sử trình duyệt không rơi vào trang 404.
 */
export default function InvoicesPage() {
  return (
    <EmptyState
      icon={ReceiptIcon}
      title="Hoá đơn tạm chưa xem được"
      hint="Phòng khám đang chuyển phần viện phí sang hệ thống tài chính mới. Trong thời gian này, xin hỏi hoá đơn và thanh toán tại quầy thu ngân."
      actionLabel="Về trang chủ"
      actionTo="/"
    />
  );
}
