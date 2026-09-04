import { useNavigate } from "react-router-dom";
import { useRouteHandle } from "@/hooks";
import TransitionLink from "./transition-link";
import { CalendarIcon, HomeIcon, IconProps, PlusIcon, UserIcon } from "./icons";
import { ComponentType } from "react";

/*
 * Mỗi `path` ở đây PHẢI là một route có thật trong `src/router.tsx`, và route
 * ấy phải gọi được một tuyến máy chủ đang sống.
 *
 * Mục "Hoá đơn" (`/invoices`) đã bị gỡ ngày 03/09/2026: `emr-api` rút
 * `GET /patient-app/invoices` khi mô-đun thanh toán đi theo dịch vụ tài chính,
 * nên cái tab ấy dẫn thẳng tới một màn hình 404. Một tuyến không tồn tại không
 * được nằm trên thanh điều hướng — `dieu-huong.test.ts` canh chừng điều đó.
 */
const NAV_ITEMS: {
  name: string;
  path: string;
  icon: ComponentType<IconProps>;
  end?: boolean;
}[] = [
  { name: "Trang chủ", path: "/", icon: HomeIcon, end: true },
  { name: "Lịch hẹn", path: "/appointments", icon: CalendarIcon },
  { name: "Hồ sơ", path: "/profiles", icon: UserIcon },
];

/**
 * Thanh tab: ba mục phẳng và một nút "Đặt lịch khám" tròn nổi lên ở giữa.
 * Nút nổi là hành động chính của cả app nên nó được đặt đúng vào chỗ ngón cái
 * chạm tới dễ nhất; các mục còn lại là nơi để xem lại.
 *
 * Lưới vẫn năm cột: hai mục đầu ở cột 1-2, cột 3 để trống cho nút "+", mục
 * cuối trải hai cột 4-5 và tự căn giữa. Bốn tâm điểm vì thế rơi đúng vào 10%,
 * 30%, 50%, 70% — cách đều nhau, không bị dồn về một bên như khi bỏ trống hẳn
 * ô thứ tư.
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
          <div key={item.path} className="col-span-2">
            <NavItem {...item} />
          </div>
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
