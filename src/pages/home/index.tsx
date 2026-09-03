import { ReactNode, Suspense } from "react";
import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/button";
import SilentBoundary from "@/components/silent-boundary";
import {
  AlertCircleIcon,
  CalendarPlusIcon,
  ClipboardIcon,
  ShieldIcon,
  TicketIcon,
} from "@/components/icons";
import {
  Card,
  EmptyState,
  QuickActions,
  SectionHeader,
  type QuickAction,
} from "@/components/ui";
import AppointmentCard from "@/pages/appointments/appointment-card";
import StatusCard from "./status-card";
import {
  activePatientIdState,
  appointmentsState,
  profilesState,
} from "@/state";
import { todayIso } from "@/utils/format";

/*
 * KHÔNG có ô "Hoá đơn". `GET /patient-app/invoices` đã bị rút khỏi `emr-api`
 * (29/08/2026, mô-đun thanh toán theo dịch vụ tài chính đi). Một ô thao tác
 * nhanh dẫn tới màn hình không có dữ liệu là lời hứa suông; ô ấy quay lại cùng
 * lúc với tuyến.
 */
const QUICK_ACTIONS: QuickAction[] = [
  { icon: CalendarPlusIcon, label: "Đặt lịch khám", to: "/booking" },
  { icon: TicketIcon, label: "Số thứ tự", to: "/queue" },
  { icon: ClipboardIcon, label: "Lịch sử khám", to: "/records" },
];

export default function HomePage() {
  const profiles = useAtomValue(profilesState);

  if (profiles.length === 0) {
    return (
      <EmptyState
        icon={ShieldIcon}
        title="Chào mừng bạn"
        hint="Liên kết tài khoản Zalo với hồ sơ tại phòng khám để đặt lịch khám và xem số thứ tự."
        actionLabel="Liên kết hồ sơ"
        actionTo="/link"
      />
    );
  }

  return (
    <div className="space-y-6 p-4">
      <Khoi loi="Không xem được tình trạng khám hôm nay.">
        <StatusCard />
      </Khoi>

      <QuickActions actions={QUICK_ACTIONS} />

      <Khoi loi="Không tải được lịch khám sắp tới.">
        <LichSapToi />
      </Khoi>
    </div>
  );
}

/**
 * Một thẻ của Trang chủ, có vách ngăn riêng.
 *
 * Ngày 03/09/2026 Trang chủ đọc `invoicesState` không điều kiện; tuyến
 * `/invoices` đã bị rút, `ApiError` nổi lên khỏi atom trong lúc render, và
 * `ErrorBoundary` ở route gốc thay luôn cả `<Layout/>` — mất Header, mất thanh
 * tab, mọi người bệnh đã liên kết đều thấy 404 toàn màn hình dù bảy tuyến còn
 * lại vẫn chạy tốt.
 *
 * Vách ngăn này là bài học đó viết thành mã: một tuyến hỏng chỉ được lấy đi
 * MỘT thẻ. `router.tsx` gắn thêm `ErrorBoundary` cho từng route con để lớp
 * ngoài cũng có cùng tính chất.
 */
function Khoi({ children, loi }: { children: ReactNode; loi: string }) {
  return (
    <SilentBoundary fallback={<TheLoi>{loi}</TheLoi>}>
      <Suspense
        fallback={<div className="h-28 animate-pulse rounded-md bg-white" />}
      >
        {children}
      </Suspense>
    </SilentBoundary>
  );
}

function TheLoi({ children }: { children: ReactNode }) {
  return (
    <Card>
      <div className="flex gap-3">
        <AlertCircleIcon
          width={20}
          height={20}
          className="mt-0.5 shrink-0 text-ink-muted"
        />
        <p className="text-sm text-ink-muted">
          {children} Các phần còn lại của ứng dụng vẫn dùng được; mở lại màn
          hình sau ít phút.
        </p>
      </div>
    </Card>
  );
}

function LichSapToi() {
  const navigate = useNavigate();
  const patientId = useAtomValue(activePatientIdState);
  const appointments = useAtomValue(appointmentsState(patientId));

  const today = todayIso();
  const upcoming = appointments
    .filter(
      (appointment) =>
        appointment.status === "Scheduled" && appointment.apptDate >= today,
    )
    .sort((a, b) => a.apptDate.localeCompare(b.apptDate));

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Lịch khám sắp tới"
        moreTo={upcoming.length > 0 ? "/appointments" : undefined}
      />
      {upcoming.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">
            Bạn chưa có lịch hẹn nào sắp tới.
          </p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => navigate("/booking", { viewTransition: true })}
          >
            Đặt lịch khám
          </Button>
        </Card>
      ) : (
        upcoming
          .slice(0, 3)
          .map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))
      )}
    </div>
  );
}
