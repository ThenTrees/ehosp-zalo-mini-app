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
 * Lưới thao tác nhanh 4 cột trên Trang chủ: ô icon bo góc trên nền xanh nhạt,
 * nhãn bên dưới. Đúng khối "Quick Actions" của design.
 */
export default function QuickActions({ actions }: { actions: QuickAction[] }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-4 gap-3">
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
