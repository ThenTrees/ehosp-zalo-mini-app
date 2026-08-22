import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import LinkRequired from "@/components/link-required";
import { activePatientIdState, appointmentsState } from "@/state";
import type { AppointmentStatus } from "@/types";

const NHAN_TRANG_THAI: Record<AppointmentStatus, string> = {
  Scheduled: "Đã đặt",
  CheckedIn: "Đã đến",
  Completed: "Đã khám",
  Cancelled: "Đã huỷ",
  Missed: "Lỡ hẹn",
  WaitListed: "Chờ chỗ trống",
};

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const patientId = useAtomValue(activePatientIdState);
  const appointments = useAtomValue(appointmentsState(patientId));

  if (patientId === null) {
    return <LinkRequired loiNhan="Liên kết hồ sơ để xem lịch hẹn của bạn." />;
  }

  if (appointments.length === 0) {
    return <div className="p-4 text-disabled">Bạn chưa có lịch hẹn nào.</div>;
  }

  return (
    <div className="p-4 space-y-3">
      {appointments.map((hen) => (
        <button
          key={hen.id}
          onClick={() =>
            navigate(`/appointments/${hen.id}`, { viewTransition: true })
          }
          className="w-full text-left p-3 rounded-xl bg-white"
        >
          <div className="flex justify-between">
            <span className="font-medium">{hen.department.name}</span>
            <span className="text-2xs text-primary">
              {NHAN_TRANG_THAI[hen.status]}
            </span>
          </div>
          <div className="text-2xs text-disabled">
            {hen.apptDate} · {hen.session === "SANG" ? "Buổi sáng" : "Buổi chiều"}{" "}
            · Mã {hen.appointmentCode}
          </div>
        </button>
      ))}
    </div>
  );
}
