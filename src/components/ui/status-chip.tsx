import { ReactNode } from "react";
import type {
  Appointment,
  InvoiceSummary,
  PrescriptionSummary,
  VisitSummary,
} from "@/types";

export type Tone = "success" | "warning" | "error" | "neutral" | "info";

const TONE_CLASSES: Record<Tone, string> = {
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
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-3xs font-semibold ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Bảng dịch trạng thái lịch hẹn sang tiếng Việt. Đây là chỗ duy nhất giữ bảng
 * này — trước đây mỗi trang tự chép một bản và chúng đã bắt đầu lệch nhau.
 */
export function appointmentTone(appointment: Appointment): {
  label: string;
  tone: Tone;
} {
  switch (appointment.status) {
    case "Scheduled":
      return appointment.patientConfirmed
        ? { label: "Đã xác nhận", tone: "success" }
        : { label: "Chờ xác nhận", tone: "warning" };
    case "CheckedIn":
      return { label: "Đã đến khám", tone: "info" };
    case "Completed":
      return { label: "Đã khám xong", tone: "neutral" };
    case "Cancelled":
      return { label: "Đã huỷ", tone: "error" };
    case "Missed":
      return { label: "Lỡ hẹn", tone: "error" };
  }
}

/**
 * Nhãn trạng thái lượt khám.
 *
 * Mã và sắc thái lấy đúng theo nhóm VISIT_STATUS trong `eHosp/data/enums.csv`
 * (cột nhãn tiếng Việt và cột tone), để hai bề mặt — màn nhân viên và mini app
 * — không gọi cùng một trạng thái bằng hai cái tên khác nhau.
 */
export function visitTone(visit: VisitSummary): {
  label: string;
  tone: Tone;
} {
  switch (visit.status) {
    case "WAITING":
      return { label: "Chờ khám", tone: "warning" };
    case "IN_PROGRESS":
      return { label: "Đang khám", tone: "info" };
    case "DONE":
      return { label: "Đã khám xong", tone: "success" };
    case "CANCELLED":
      return { label: "Đã huỷ", tone: "error" };
  }
}

/** Nhãn trạng thái đơn thuốc — nhóm PRESCRIPTION_STATUS, trừ mã DRAFT. */
export function prescriptionTone(prescription: PrescriptionSummary): {
  label: string;
  tone: Tone;
} {
  switch (prescription.status) {
    case "ISSUED":
      return { label: "Đã kê, chờ lấy thuốc", tone: "warning" };
    case "DISPENSED":
      return { label: "Đã phát thuốc", tone: "success" };
    case "CANCELLED":
      return { label: "Đã huỷ", tone: "error" };
  }
}

export function invoiceTone(invoice: InvoiceSummary): {
  label: string;
  tone: Tone;
} {
  if (invoice.paid) {
    return { label: "Đã thanh toán", tone: "success" };
  }
  if (invoice.amountDue === 0) {
    return { label: "BHYT chi trả toàn bộ", tone: "info" };
  }
  return { label: "Chưa thanh toán", tone: "error" };
}
