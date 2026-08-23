import { ButtonHTMLAttributes, FC, MouseEvent, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  /**
   * Mặc định nút chiếm hết bề ngang. Đặt `false` cho nút nằm cạnh nội dung
   * khác — thêm `w-auto` qua `className` không ăn thua vì `w-full` và `w-auto`
   * cùng độ đặc hiệu và Tailwind xuất `w-full` sau.
   */
  fullWidth?: boolean;
  onDisabledClick?: () => void;
}

/**
 * Nút theo design: cao tối thiểu 48px, bo 8px.
 *
 * - `primary` nền xanh đặc, chữ trắng.
 * - `secondary` nền xanh nhạt, chữ xanh đậm.
 * - `danger` nền đỏ nhạt, chữ đỏ — cho huỷ lịch, huỷ liên kết.
 * - `ghost` không nền, chỉ chữ xanh.
 */
const KIEU: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-action active:bg-primary-ink",
  secondary: "bg-primary-soft text-primary-ink active:bg-[#cddffd]",
  danger: "bg-error-soft text-error active:bg-[#ffd6d0]",
  ghost: "text-primary-ink active:bg-surface-sunken",
};

export const Button: FC<ButtonProps> = ({
  children,
  className = "",
  variant = "primary",
  loading,
  fullWidth = true,
  disabled,
  onDisabledClick,
  onClick,
  ...props
}) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      e.preventDefault();
      onDisabledClick?.();
      return;
    }
    if (loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      type="button"
      className={`relative flex min-h-12 items-center justify-center gap-2 rounded px-4 text-base font-semibold transition-transform active:scale-[0.98] disabled:opacity-40 disabled:shadow-none ${
        fullWidth ? "w-full" : "w-auto shrink-0"
      } ${KIEU[variant]} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      <span className={loading ? "opacity-0" : "flex items-center gap-2"}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
      )}
    </button>
  );
};

export default Button;
