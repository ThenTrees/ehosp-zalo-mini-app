import { ReactNode, Suspense } from "react";
import { useAtomValue } from "jotai";
import { To, useLocation, useNavigate } from "react-router-dom";
import { useRouteHandle } from "@/hooks";
import {
  activePatientIdState,
  activeProfileState,
  customTitleState,
  unreadNotificationCountState,
} from "@/state";
import { getConfig } from "@/utils/miscellaneous";
import { ArrowLeftIcon, BellIcon, ChevronDownIcon } from "./icons";
import SilentBoundary from "./silent-boundary";

function CustomTitle() {
  return useAtomValue(customTitleState);
}

/**
 * Lời chào. Tên lấy từ hồ sơ người bệnh đang chọn, không phải tên tài khoản
 * Zalo — mini app cố ý không xin `getUserInfo`. Chạm vào thì sang trang chọn
 * hồ sơ, vì một tài khoản có thể giữ hồ sơ của nhiều người thân.
 */
function Greeting() {
  const navigate = useNavigate();
  const profile = useAtomValue(activeProfileState);

  if (!profile) {
    return (
      <div className="min-w-0 flex-1">
        <div className="text-2xs text-ink-muted">Chào bạn</div>
        <div className="truncate text-xl font-bold text-ink">
          {getConfig((c) => c.app.title)}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="min-w-0 flex-1 text-left active:opacity-70"
      onClick={() => navigate("/profiles", { viewTransition: true })}
    >
      <div className="text-2xs text-ink-muted">Xin chào,</div>
      <div className="flex items-center gap-1">
        <span className="truncate text-xl font-bold text-ink">
          {profile.fullName}
        </span>
        <ChevronDownIcon width={18} height={18} className="text-ink-muted" />
      </div>
    </button>
  );
}

/** Chuông trơn — luôn bấm được, kể cả khi không đếm được số thông báo. */
function BellButton({ chuaDoc = 0 }: { chuaDoc?: number }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      aria-label="Thông báo"
      className="relative -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-primary-ink active:bg-primary-soft"
      onClick={() => navigate("/notifications", { viewTransition: true })}
    >
      <BellIcon />
      {chuaDoc > 0 && (
        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-error" />
      )}
    </button>
  );
}

/** Chấm đỏ khi có thông báo mới hơn lần cuối người dùng mở màn Thông báo. */
function NotificationBell() {
  const patientId = useAtomValue(activePatientIdState);
  const chuaDoc = useAtomValue(unreadNotificationCountState(patientId));
  return <BellButton chuaDoc={chuaDoc} />;
}

/**
 * Chuông và lời chào đều đọc dữ liệu người bệnh, mà Header nằm ngoài
 * `ErrorBoundary` của route. Không bọc thì một lỗi mạng ở đây đá người dùng ra
 * khỏi trang họ đang xem.
 */
function PhanDong({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  return (
    <SilentBoundary fallback={fallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </SilentBoundary>
  );
}

function TenPhongKham({ className }: { className?: string }) {
  return <span className={className}>{getConfig((c) => c.app.title)}</span>;
}

function NutQuayLai() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      aria-label="Quay lại"
      className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink active:bg-surface-sunken"
      onClick={() => navigate(-1 as To, { viewTransition: true })}
    >
      <ArrowLeftIcon />
    </button>
  );
}

export default function Header() {
  const location = useLocation();
  const [handle] = useRouteHandle();

  const showBack = location.key !== "default" && handle?.back !== false;

  // `pr-[90px]` chừa chỗ cho cụm nút gốc của Zalo ở góc trên bên phải. Đặt bất
  // cứ thứ gì chạm được vào vùng đó là người dùng bấm không trúng.
  if (handle?.tab) {
    // Mũi tên quay lại ăn mất 40px, mà `pr-[90px]` đã giữ chỗ cho cụm nút gốc
    // của Zalo — còn lại không đủ cho "Phòng khám phường Sài Gòn". Bỏ tên đi
    // thay vì cắt cụt: tên trang đã nằm ngay dưới, cỡ 24px, do `PageHeading` vẽ.
    const hienNutQuayLai = Boolean(handle.back) && showBack;

    return (
      <header className="flex-none w-full bg-background px-4 pt-st pb-2 pr-[90px]">
        <div className="flex min-h-12 items-center gap-2">
          {hienNutQuayLai ? (
            <>
              <NutQuayLai />
              <span className="flex-1" />
            </>
          ) : (
            <TenPhongKham className="min-w-0 flex-1 truncate text-lg font-bold text-primary-ink" />
          )}
          <PhanDong fallback={<BellButton />}>
            <NotificationBell />
          </PhanDong>
        </div>
      </header>
    );
  }

  if (!handle?.back) {
    return (
      <header className="flex-none w-full bg-gradient-to-b from-primary-soft to-background px-4 pt-st pb-3 pr-[90px]">
        <div className="flex min-h-12 items-center gap-2">
          <PhanDong
            fallback={
              <div className="min-w-0 flex-1">
                <div className="text-2xs text-ink-muted">Chào bạn</div>
                <TenPhongKham className="block truncate text-xl font-bold text-ink" />
              </div>
            }
          >
            <Greeting />
          </PhanDong>
          <PhanDong fallback={<BellButton />}>
            <NotificationBell />
          </PhanDong>
        </div>
      </header>
    );
  }

  return (
    <header className="flex-none w-full border-b border-line bg-surface px-4 pt-st pb-2 pr-[90px]">
      <div className="flex min-h-12 items-center gap-1">
        {showBack && <NutQuayLai />}
        <div className="truncate text-lg font-semibold text-ink">
          {handle.title === "custom" ? (
            <Suspense fallback={null}>
              <CustomTitle />
            </Suspense>
          ) : (
            handle.title
          )}
        </div>
      </div>
    </header>
  );
}
