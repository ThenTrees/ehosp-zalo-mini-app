import { useState } from "react";
import { useAtomValue } from "jotai";
import LinkRequired from "@/components/link-required";
import { CalendarIcon } from "@/components/icons";
import { EmptyState, PageHeading, Segmented } from "@/components/ui";
import AppointmentCard from "./appointment-card";
import { activePatientIdState, appointmentsState } from "@/state";
import { todayIso } from "@/utils/format";

type Tab = "SAP_TOI" | "DA_QUA";

export default function AppointmentsPage() {
  const patientId = useAtomValue(activePatientIdState);
  const appointments = useAtomValue(appointmentsState(patientId));
  const [tab, setTab] = useState<Tab>("SAP_TOI");

  if (patientId === null) {
    return <LinkRequired message="Liên kết hồ sơ để xem lịch hẹn của bạn." />;
  }

  const today = todayIso();
  // "Sắp tới" là những hẹn còn hiệu lực và chưa qua ngày; mọi thứ khác — đã
  // khám, đã huỷ, lỡ hẹn, hoặc quá ngày — nằm ở nhánh "Đã qua".
  const isActive = (status: string) =>
    status === "Scheduled" || status === "CheckedIn";

  const upcoming = appointments
    .filter((appointment) => isActive(appointment.status) && appointment.apptDate >= today)
    .sort((a, b) => a.apptDate.localeCompare(b.apptDate));

  const past = appointments
    .filter((appointment) => !(isActive(appointment.status) && appointment.apptDate >= today))
    .sort((a, b) => b.apptDate.localeCompare(a.apptDate));

  const list = tab === "SAP_TOI" ? upcoming : past;

  return (
    <div>
      <PageHeading
        title="Lịch hẹn của tôi"
        subtitle="Theo dõi và xác nhận các lịch khám đã đặt."
      />

      <div className="px-4">
        <Segmented
          value={tab}
          onChange={(value) => setTab(value)}
          options={[
            { value: "SAP_TOI", label: "Sắp tới", count: upcoming.length },
            { value: "DA_QUA", label: "Đã qua", count: past.length },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title={
            tab === "SAP_TOI"
              ? "Chưa có lịch hẹn sắp tới"
              : "Chưa có lịch hẹn cũ"
          }
          hint={
            tab === "SAP_TOI"
              ? "Đặt lịch trước để khỏi phải chờ lấy số tại quầy tiếp đón."
              : "Những lịch hẹn đã khám xong hoặc đã huỷ sẽ được lưu ở đây."
          }
          actionLabel={tab === "SAP_TOI" ? "Đặt lịch khám" : undefined}
          actionTo="/booking"
        />
      ) : (
        <div className="space-y-3 p-4">
          {list.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      )}
    </div>
  );
}
