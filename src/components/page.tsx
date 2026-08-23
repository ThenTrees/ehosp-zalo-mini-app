import { useRouteHandle } from "@/hooks";
import { Suspense } from "react";
import { Outlet } from "react-router-dom";

/** Khung xương lúc trang còn đang chờ dữ liệu. Giữ nhịp bố cục, không nhảy. */
function PageSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="h-28 animate-pulse rounded-md bg-white" />
      <div className="h-20 animate-pulse rounded-md bg-white" />
      <div className="h-20 animate-pulse rounded-md bg-white" />
    </div>
  );
}

function Page() {
  const [handle] = useRouteHandle();

  return (
    <div
      className={`z-10 flex flex-1 flex-col ${
        handle.noScroll ? "overflow-hidden" : "overflow-y-auto"
      }`}
    >
      {/* Chừa chỗ cho nút "+" nhô lên khỏi thanh tab. */}
      <div className={`flex flex-1 flex-col ${handle.back ? "" : "pb-8"}`}>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}

export default Page;
