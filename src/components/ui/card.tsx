import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Bỏ đệm 16px mặc định khi nội dung tự lo phần đệm (ví dụ danh sách hàng). */
  bare?: boolean;
  /** Vạch màu dọc bên trái — dùng để nhấn trạng thái của cả thẻ. */
  accent?: "primary" | "success" | "warning" | "error";
}

const ACCENT_CLASSES: Record<NonNullable<CardProps["accent"]>, string> = {
  primary: "before:bg-primary",
  success: "before:bg-success",
  warning: "before:bg-warning",
  error: "before:bg-error",
};

/**
 * Bề mặt cấp 1 của design: nền trắng, viền 1px rất nhạt, bóng mềm, bo 12px.
 * Mọi khối nội dung trong app đi qua đây để bóng và bo góc không lệch nhau.
 */
export default function Card({
  children,
  bare,
  accent,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`relative overflow-hidden bg-surface rounded-md border border-line shadow-card ${
        bare ? "" : "p-4"
      } ${
        accent
          ? `before:absolute before:left-0 before:inset-y-0 before:w-1 ${ACCENT_CLASSES[accent]}`
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
