import { useAtomValue } from "jotai";
import { To, useLocation, useNavigate } from "react-router-dom";
import { useRouteHandle } from "@/hooks";
import { BackIcon } from "./icons/back";
import { customTitleState, userState } from "@/state";
import { getConfig } from "@/utils/miscellaneous";
import HeaderShieldIcon from "./icons/header-shield";

function ProfileHeader() {
  const { userInfo } = useAtomValue(userState);

  return (
    <div className="flex items-center justify-center space-x-3">
      <img
        src={userInfo.avatar}
        className="rounded-full h-10 w-10 object-cover border border-white"
      />
      <div className="w-40 font-medium">{userInfo.name}</div>
    </div>
  );
}

function CustomTitle() {
  const title = useAtomValue(customTitleState);
  return title;
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [handle, match] = useRouteHandle();

  const showMainHeader = !handle?.back;
  const showBack = location.key !== "default" && handle?.back !== false;

  return (
    <header
      className={`flex-none w-full min-h-12 pr-[90px] px-4 pt-st pb-2 space-x-2 ${showMainHeader ? "" : "bg-white"}`}
    >
      <div className="flex items-center min-h-12">
        {showMainHeader ? (
          <>
            <div className="fixed inset-0 h-[230px] z-0 bg-gradient-to-br from-highlight from-[1.36%] to-background to-[61.49%]" />
            <HeaderShieldIcon className="fixed top-0 right-0" />
            <div className="relative z-10">
              {handle.profile ? (
                <ProfileHeader />
              ) : (
                <div className="flex items-center text-primary space-x-1.5">
                  <h1 className="text-xl font-bold">
                    {getConfig((c) => c.app.title)}
                  </h1>
                  <span>|</span>
                  <span className="text-base">Chào bạn</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {showBack && (
              <div
                className="py-1 px-2 cursor-pointer"
                onClick={() =>
                  navigate(-1 as To, {
                    viewTransition: true,
                  })
                }
              >
                <BackIcon />
              </div>
            )}
            <div className="text-xl font-medium truncate">
              {handle.title === "custom" ? <CustomTitle /> : handle.title}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
