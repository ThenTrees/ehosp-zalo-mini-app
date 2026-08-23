import { ReactNode } from "react";
import type { Appointment, InvoiceSummary } from "@/types";

export type Tone = "success" | "warning" | "error" | "neutral" | "info";

const SAC_THAI: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  error: "bg-error-soft text-error",
  info: "bg-primary-soft text-primary-ink",
  neutral: "bg-surface-sunken text-ink-muted",
};

/**
 * Pill trạng thái theo design: nền màu rất nhạt, chữ đậm cùng tông.
 */
export default function StatusChip({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-3xs font-semibold ${SAC_THAI[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Bảng dịch trạng thái lịch hẹn sang tiếng Việt. Đây là chỗ duy nhất giữ bảng
 * này — trước đây mỗi trang tự chép một bản và chúng đã bắt đầu lệch nhau.
 */
export function trangThaiLichHen(hen: Appointment): {
  nhan: string;
  tone: Tone;
} {
  switch (hen.status) {
    case "Scheduled":
      return hen.patientConfirmed
        ? { nhan: "Đã xác nhận", tone: "success" }
        : { nhan: "Chờ xác nhận", tone: "warning" };
    case "CheckedIn":
      return { nhan: "Đã đến khám", tone: "info" };
    case "Completed":
      return { nhan: "Đã khám xong", tone: "neutral" };
    case "Cancelled":
      return { nhan: "Đã huỷ", tone: "error" };
    case "Missed":
      return { nhan: "Lỡ hẹn", tone: "error" };
    case "WaitListed":
      return { nhan: "Chờ chỗ trống", tone: "warning" };
  }
}

export function trangThaiHoaDon(hoaDon: InvoiceSummary): {
  nhan: string;
  tone: Tone;
} {
  if (hoaDon.paid) {
    return { nhan: "Đã thanh toán", tone: "success" };
  }
  if (hoaDon.amountDue === 0) {
    return { nhan: "BHYT chi trả toàn bộ", tone: "info" };
  }
  return { nhan: "Chưa thanh toán", tone: "error" };
}
