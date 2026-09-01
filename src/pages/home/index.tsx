import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/button";
import {
  CalendarPlusIcon,
  ClipboardIcon,
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

const QUICK_ACTIONS: QuickAction[] = [
  { icon: CalendarPlusIcon, label: "Đặt lịch khám", to: "/booking" },
  { icon: TicketIcon, label: "Số thứ tự", to: "/queue" },
  { icon: ClipboardIcon, label: "Lịch sử khám", to: "/records" },
  { icon: ReceiptIcon, label: "Hoá đơn", to: "/invoices" },
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

  const today = todayIso();
  const upcoming = appointments
    .filter((appointment) => appointment.status === "Scheduled" && appointment.apptDate >= today)
    .sort((a, b) => a.apptDate.localeCompare(b.apptDate));

  const unpaid = invoices.filter((invoice) => !invoice.paid && invoice.amountDue > 0);
  const totalUnpaid = unpaid.reduce((sum, invoice) => sum + invoice.amountDue, 0);

  return (
    <div className="space-y-6 p-4">
      <StatusCard />

      <QuickActions actions={QUICK_ACTIONS} />

      {unpaid.length > 0 && (
        <Card accent="error" className="pl-5">
          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-ink-muted">
                {unpaid.length} hoá đơn chưa thanh toán
              </span>
              <span className="mt-0.5 block text-xl font-bold text-error">
                {formatPrice(totalUnpaid)}
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
            .map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />)
        )}
      </div>
    </div>
  );
}
