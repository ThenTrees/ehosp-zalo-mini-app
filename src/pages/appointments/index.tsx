import { useState } from "react";
import { useAtomValue } from "jotai";
import LinkRequired from "@/components/link-required";
import { CalendarIcon } from "@/components/icons";
import { EmptyState, PageHeading, Segmented } from "@/components/ui";
import AppointmentCard from "./appointment-card";
import { activePatientIdState, appointmentsState } from "@/state";
import { todayIso } from "@/utils/format";

type Lat = "SAP_TOI" | "DA_QUA";

export default function AppointmentsPage() {
  const patientId = useAtomValue(activePatientIdState);
  const appointments = useAtomValue(appointmentsState(patientId));
  const [lat, setLat] = useState<Lat>("SAP_TOI");

  if (patientId === null) {
    return <LinkRequired loiNhan="Liên kết hồ sơ để xem lịch hẹn của bạn." />;
  }

  const homNay = todayIso();
  // "Sắp tới" là những hẹn còn hiệu lực và chưa qua ngày; mọi thứ khác — đã
  // khám, đã huỷ, lỡ hẹn, hoặc quá ngày — nằm ở nhánh "Đã qua".
  const conHieuLuc = (status: string) =>
    status === "Scheduled" || status === "WaitListed" || status === "CheckedIn";

  const sapToi = appointments
    .filter((hen) => conHieuLuc(hen.status) && hen.apptDate >= homNay)
    .sort((a, b) => a.apptDate.localeCompare(b.apptDate));

  const daQua = appointments
    .filter((hen) => !(conHieuLuc(hen.status) && hen.apptDate >= homNay))
    .sort((a, b) => b.apptDate.localeCompare(a.apptDate));

  const danhSach = lat === "SAP_TOI" ? sapToi : daQua;

  return (
    <div>
      <PageHeading
        title="Lịch hẹn của tôi"
        subtitle="Theo dõi và xác nhận các lịch khám đã đặt."
      />

      <div className="px-4">
        <Segmented
          value={lat}
          onChange={(gia) => setLat(gia)}
          options={[
            { value: "SAP_TOI", label: "Sắp tới", count: sapToi.length },
            { value: "DA_QUA", label: "Đã qua", count: daQua.length },
          ]}
        />
      </div>

      {danhSach.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title={
            lat === "SAP_TOI"
              ? "Chưa có lịch hẹn sắp tới"
              : "Chưa có lịch hẹn cũ"
          }
          hint={
            lat === "SAP_TOI"
              ? "Đặt lịch trước để khỏi phải chờ lấy số tại quầy tiếp đón."
              : "Những lịch hẹn đã khám xong hoặc đã huỷ sẽ được lưu ở đây."
          }
          actionLabel={lat === "SAP_TOI" ? "Đặt lịch khám" : undefined}
          actionTo="/booking"
        />
      ) : (
        <div className="space-y-3 p-4">
          {danhSach.map((hen) => (
            <AppointmentCard key={hen.id} hen={hen} />
          ))}
        </div>
      )}
    </div>
  );
}
