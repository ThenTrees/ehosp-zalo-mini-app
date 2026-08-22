import HorizontalDivider from "./horizontal-divider";
import { useAtomValue } from "jotai";
import TransitionLink from "./transition-link";
import HomeIcon from "./icons/home";
import ExploreIcon from "./icons/explore";
import ChatIcon from "./icons/cart";
import ProfileIcon from "./icons/profile";
import BigPlusIcon from "./icons/big-plus";
import { useRouteHandle } from "@/hooks";
import FooterWave from "./icons/footer-wave";

const NAV_ITEMS = [
  {
    name: "Trang chủ",
    path: "/",
    icon: HomeIcon,
  },
  {
    name: "Khám phá",
    path: "/explore",
    icon: ExploreIcon,
  },
  {
    path: "/booking",
    icon: () => (
      <BigPlusIcon className="-mt-4 shadow-lg shadow-highlight rounded-full" />
    ),
  },
  {
    name: "Lịch khám",
    path: "/schedule",
    icon: ChatIcon,
  },
  {
    name: "Cá nhân",
    path: "/profile",
    icon: ProfileIcon,
  },
];

export default function Footer() {
  const [handle] = useRouteHandle();
  if (handle.back) {
    return <></>;
  }

  return (
    <div className="w-full relative">
      <FooterWave
        className="absolute inset-x-0 bottom-sb z-10 h-24 -mb-6"
        style={{
          filter: "drop-shadow(0px 4px 20px rgba(0, 0, 0, 0.08))",
        }}
      />
      <div
        className="w-full px-4 pt-2 grid text-3xs relative z-20 justify-center pb-sb bg-white"
        style={{
          gridTemplateColumns: `repeat(${NAV_ITEMS.length}, 1fr)`,
        }}
      >
        {NAV_ITEMS.map((item) => {
          return (
            <TransitionLink
              to={item.path}
              key={item.path}
              className="flex flex-col items-center space-y-0.5 p-1 active:scale-105"
            >
              {({ isActive }) =>
                item.name ? (
                  <>
                    <div className="w-6 h-6 flex justify-center items-center">
                      <item.icon active={isActive} />
                    </div>
                    <div
                      className={`text-2xs truncate ${isActive ? "text-primary" : "text-disabled"}`}
                    >
                      {item.name}
                    </div>
                  </>
                ) : (
                  <item.icon active={isActive} />
                )
              }
            </TransitionLink>
          );
        })}
      </div>
    </div>
  );
}
