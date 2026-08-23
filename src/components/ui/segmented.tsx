/**
 * Bộ chọn hai đến ba nhánh, kiểu gạch chân như tab "Bệnh án / Đơn thuốc" của
 * design. Dùng cho những lát cắt của cùng một danh sách, không dùng để điều
 * hướng sang trang khác.
 */
export default function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex border-b border-line">
      {options.map((option) => {
        const dangChon = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 border-b-2 pb-3 pt-1 text-base transition-colors ${
              dangChon
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-ink-muted"
            }`}
          >
            {option.label}
            {option.count !== undefined && ` (${option.count})`}
          </button>
        );
      })}
    </div>
  );
}
