import { useNavigate } from "react-router-dom";
import { useRouteHandle } from "@/hooks";
import TransitionLink from "./transition-link";
import {
  CalendarIcon,
  HomeIcon,
  IconProps,
  PlusIcon,
  ReceiptIcon,
  UserIcon,
} from "./icons";
import { ComponentType } from "react";

const NAV_ITEMS: {
  name: string;
  path: string;
  icon: ComponentType<IconProps>;
  end?: boolean;
}[] = [
  { name: "Trang chủ", path: "/", icon: HomeIcon, end: true },
  { name: "Lịch hẹn", path: "/appointments", icon: CalendarIcon },
  { name: "Hoá đơn", path: "/invoices", icon: ReceiptIcon },
  { name: "Hồ sơ", path: "/profiles", icon: UserIcon },
];

/**
 * Thanh tab: bốn mục phẳng và một nút "Đặt lịch khám" tròn nổi lên ở giữa.
 * Nút nổi là hành động chính của cả app nên nó được đặt đúng vào chỗ ngón cái
 * chạm tới dễ nhất; bốn mục còn lại là nơi để xem lại.
 *
 * Trang có `handle.back` thì ẩn hoàn toàn thanh này — trừ khi trang đó cũng là
 * một mục của thanh tab (`handle.tab`), lúc ấy `back` chỉ có nghĩa "thêm nút
 * quay lại vào header" chứ không phải "rời khỏi vùng có tab".
 */
export default function Footer() {
  const navigate = useNavigate();
  const [handle] = useRouteHandle();

  if (handle.back && !handle.tab) {
    return <></>;
  }

  return (
    <nav className="relative w-full flex-none border-t border-line bg-surface pb-sb">
      <button
        type="button"
        aria-label="Đặt lịch khám"
        onClick={() => navigate("/booking", { viewTransition: true })}
        className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-4 border-background bg-primary text-white shadow-action active:scale-95"
      >
        <PlusIcon width={26} height={26} />
      </button>

      <div className="grid grid-cols-5 pt-2">
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
        <div aria-hidden="true" />
        {NAV_ITEMS.slice(2).map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  name,
  path,
  icon: Icon,
  end,
}: {
  name: string;
  path: string;
  icon: ComponentType<IconProps>;
  end?: boolean;
}) {
  return (
    <TransitionLink
      to={path}
      end={end}
      className="flex flex-col items-center gap-0.5 px-1 pb-1 active:scale-95"
    >
      {({ isActive }) => (
        <>
          <Icon
            active={isActive}
            className={isActive ? "text-primary" : "text-ink-muted"}
          />
          <span
            className={`truncate text-3xs ${
              isActive ? "font-semibold text-primary" : "text-ink-muted"
            }`}
          >
            {name}
          </span>
        </>
      )}
    </TransitionLink>
  );
}
