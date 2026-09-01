import { ReactNode, Suspense } from "react";
import { useAtomValue } from "jotai";
import { To, useLocation, useNavigate } from "react-router-dom";
import { useRouteHandle } from "@/hooks";
import { activeProfileState, customTitleState } from "@/state";
import { getConfig } from "@/utils/miscellaneous";
import { ArrowLeftIcon, ChevronDownIcon } from "./icons";
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

/**
 * Lời chào đọc dữ liệu người bệnh, mà Header nằm ngoài `ErrorBoundary` của
 * route. Không bọc thì một lỗi mạng ở phần trang trí sẽ đá người dùng ra khỏi
 * trang họ đang xem.
 */
function GreetingBlock({
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

function ClinicName({ className }: { className?: string }) {
  return <span className={className}>{getConfig((c) => c.app.title)}</span>;
}

function BackButton() {
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
    const showBackButton = Boolean(handle.back) && showBack;

    return (
      <header className="flex-none w-full bg-background px-4 pt-st pb-2 pr-[90px]">
        <div className="flex min-h-12 items-center gap-2">
          {showBackButton ? (
            <BackButton />
          ) : (
            <ClinicName className="min-w-0 flex-1 truncate text-lg font-bold text-primary-ink" />
          )}
        </div>
      </header>
    );
  }

  if (!handle?.back) {
    return (
      <header className="flex-none w-full bg-gradient-to-b from-primary-soft to-background px-4 pt-st pb-3 pr-[90px]">
        <div className="flex min-h-12 items-center gap-2">
          <GreetingBlock
            fallback={
              <div className="min-w-0 flex-1">
                <div className="text-2xs text-ink-muted">Chào bạn</div>
                <ClinicName className="block truncate text-xl font-bold text-ink" />
              </div>
            }
          >
            <Greeting />
          </GreetingBlock>
        </div>
      </header>
    );
  }

  return (
    <header className="flex-none w-full border-b border-line bg-surface px-4 pt-st pb-2 pr-[90px]">
      <div className="flex min-h-12 items-center gap-1">
        {showBack && <BackButton />}
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
