import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/button";
import {
  BellIcon,
  CalendarPlusIcon,
  ReceiptIcon,
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
  invoicesState,
  profilesState,
} from "@/state";
import { formatPrice, todayIso } from "@/utils/format";

const THAO_TAC: QuickAction[] = [
  { icon: CalendarPlusIcon, label: "Đặt lịch khám", to: "/booking" },
  { icon: TicketIcon, label: "Số thứ tự", to: "/queue" },
  { icon: ReceiptIcon, label: "Hoá đơn", to: "/invoices" },
  { icon: BellIcon, label: "Thông báo", to: "/notifications" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const profiles = useAtomValue(profilesState);
  const patientId = useAtomValue(activePatientIdState);
  const appointments = useAtomValue(appointmentsState(patientId));
  const invoices = useAtomValue(invoicesState(patientId));

  if (profiles.length === 0) {
    return (
      <EmptyState
        icon={ShieldIcon}
        title="Chào mừng bạn"
        hint="Liên kết tài khoản Zalo với hồ sơ tại phòng khám để đặt lịch khám, xem số thứ tự và hoá đơn viện phí."
        actionLabel="Liên kết hồ sơ"
        actionTo="/link"
      />
    );
  }

  const homNay = todayIso();
  const sapToi = appointments
    .filter(
      (hen) =>
        (hen.status === "Scheduled" || hen.status === "WaitListed") &&
        hen.apptDate >= homNay,
    )
    .sort((a, b) => a.apptDate.localeCompare(b.apptDate));

  const canTra = invoices.filter((hd) => !hd.paid && hd.amountDue > 0);
  const tongCanTra = canTra.reduce((tong, hd) => tong + hd.amountDue, 0);

  return (
    <div className="space-y-6 p-4">
      <StatusCard />

      <QuickActions actions={THAO_TAC} />

      {canTra.length > 0 && (
        <Card accent="error" className="pl-5">
          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-ink-muted">
                {canTra.length} hoá đơn chưa thanh toán
              </span>
              <span className="mt-0.5 block text-xl font-bold text-error">
                {formatPrice(tongCanTra)}
              </span>
            </span>
            <Button
              variant="secondary"
              fullWidth={false}
              className="px-4"
              onClick={() => navigate("/invoices", { viewTransition: true })}
            >
              Xem
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        <SectionHeader
          title="Lịch khám sắp tới"
          moreTo={sapToi.length > 0 ? "/appointments" : undefined}
        />
        {sapToi.length === 0 ? (
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
          sapToi
            .slice(0, 3)
            .map((hen) => <AppointmentCard key={hen.id} hen={hen} />)
        )}
      </div>
    </div>
  );
}
