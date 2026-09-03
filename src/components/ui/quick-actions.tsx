import { ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { IconProps } from "@/components/icons";

export interface QuickAction {
  icon: ComponentType<IconProps>;
  /** Nhãn hai dòng — giữ mỗi dòng ngắn để không bị cắt trên máy hẹp. */
  label: string;
  to: string;
}

/**
 * Lưới thao tác nhanh trên Trang chủ: ô icon bo góc trên nền xanh nhạt, nhãn
 * bên dưới. Đúng khối "Quick Actions" của design.
 *
 * Số cột bám theo số ô chứ không cố định 4: từ 03/09/2026 ô "Hoá đơn" đã bị gỡ
 * (tuyến `/invoices` bị rút khỏi `emr-api`), và một lưới bốn cột đựng ba ô để
 * lại một khoảng trống trông như thứ gì đó chưa tải xong. Hai tên lớp đều viết
 * đủ chữ để bộ quét của Tailwind nhìn thấy.
 */
export default function QuickActions({ actions }: { actions: QuickAction[] }) {
  const navigate = useNavigate();

  return (
    <div
      className={`grid gap-3 ${
        actions.length === 3 ? "grid-cols-3" : "grid-cols-4"
      }`}
    >
      {actions.map((action) => (
        <button
          key={action.to}
          type="button"
          onClick={() => navigate(action.to, { viewTransition: true })}
          className="flex flex-col items-center gap-2 active:scale-95"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-md bg-primary-soft text-primary-ink">
            <action.icon width={26} height={26} />
          </span>
          <span className="text-2xs leading-4 text-ink-muted">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
