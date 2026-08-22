import { useRouteHandle } from "@/hooks";
import { Suspense } from "react";
import { Outlet } from "react-router-dom";

function Page() {
  const [handle] = useRouteHandle();

  return (
    <div
      className={`flex-1 flex flex-col z-10 ${handle.noScroll ? "overflow-hidden" : "overflow-y-auto"}`}
    >
      <Suspense>
        <Outlet />
      </Suspense>
    </div>
  );
}

export default Page;
