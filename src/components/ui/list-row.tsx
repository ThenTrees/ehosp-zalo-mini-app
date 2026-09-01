import { ComponentType, ReactNode } from "react";
import { ChevronRightIcon, IconProps } from "@/components/icons";

interface ListRowProps {
  icon?: ComponentType<IconProps>;
  label: ReactNode;
  /** Dòng phụ dưới nhãn, hoặc giá trị đặt bên phải nếu `valueOnRight`. */
  value?: ReactNode;
  valueOnRight?: boolean;
  onClick?: () => void;
  /** Hiện chevron. Mặc định bật khi hàng chạm được. */
  chevron?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

/**
 * Một hàng trong danh sách cài đặt / thông tin. Cao tối thiểu 56px theo design
 * để ngón tay không trượt sang hàng bên cạnh.
 */
export default function ListRow({
  icon: Icon,
  label,
  value,
  valueOnRight,
  onClick,
  chevron,
  danger,
  disabled,
}: ListRowProps) {
  const isTappable = Boolean(onClick) && !disabled;
  const showChevron = chevron ?? isTappable;

  const content = (
    <>
      {Icon && (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded ${
            danger
              ? "bg-error-soft text-error"
              : "bg-primary-soft text-primary-ink"
          }`}
        >
          <Icon width={20} height={20} />
        </span>
      )}
      <span className="min-w-0 flex-1 text-left">
        <span
          className={`block truncate text-base ${
            danger ? "font-medium text-error" : "text-ink"
          }`}
        >
          {label}
        </span>
        {value !== undefined && !valueOnRight && (
          <span className="mt-0.5 block truncate text-sm text-ink-muted">
            {value}
          </span>
        )}
      </span>
      {value !== undefined && valueOnRight && (
        <span className="shrink-0 text-sm font-medium text-ink">{value}</span>
      )}
      {showChevron && (
        <ChevronRightIcon
          width={20}
          height={20}
          className="shrink-0 text-line-strong"
        />
      )}
    </>
  );

  const className2 = `flex w-full min-h-14 items-center gap-3 px-4 py-3 ${
    isTappable ? "active:bg-surface-sunken" : ""
  } ${disabled ? "opacity-50" : ""}`;

  if (isTappable) {
    return (
      <button type="button" className={className2} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={className2}>{content}</div>;
}
