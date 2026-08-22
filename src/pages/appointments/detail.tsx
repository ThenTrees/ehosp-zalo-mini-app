import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "zmp-ui";
import toast from "react-hot-toast";
import { api } from "@/services";
import {
  activePatientIdState,
  appointmentByIdState,
  appointmentsState,
  customTitleState,
} from "@/state";

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const appointmentId = Number(id);
  const hen = useAtomValue(appointmentByIdState(appointmentId));
  const refreshHen = useSetAtom(appointmentByIdState(appointmentId));
  const patientId = useAtomValue(activePatientIdState);
  const refreshList = useSetAtom(appointmentsState(patientId ?? 0));
  const setTitle = useSetAtom(customTitleState);
  const [dangGui, setDangGui] = useState(false);

  useEffect(() => {
    setTitle(`Mã hẹn ${hen.appointmentCode}`);
    return () => setTitle("");
  }, [hen.appointmentCode, setTitle]);

  async function chay(viec: () => Promise<unknown>, thongBao: string) {
    setDangGui(true);
    try {
      await viec();
      refreshHen();
      refreshList();
      toast.success(thongBao);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thao tác thất bại.");
    } finally {
      setDangGui(false);
    }
  }

  const conMo = hen.status === "Scheduled" || hen.status === "WaitListed";

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-disabled">Chuyên khoa</span>
          <span className="font-medium">{hen.department.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-disabled">Ngày khám</span>
          <span className="font-medium">{hen.apptDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-disabled">Buổi</span>
          <span className="font-medium">
            {hen.session === "SANG" ? "Buổi sáng" : "Buổi chiều"}
          </span>
        </div>
        {hen.prepNote && (
          <div className="text-2xs text-primary pt-2">{hen.prepNote}</div>
        )}
      </div>

      {conMo && !hen.patientConfirmed && (
        <Button
          fullWidth
          loading={dangGui}
          onClick={() =>
            chay(() => api.confirmAppointment(hen.id), "Đã xác nhận lịch hẹn.")
          }
        >
          Xác nhận sẽ đến khám
        </Button>
      )}

      {conMo && (
        <Button
          fullWidth
          variant="tertiary"
          loading={dangGui}
          onClick={async () => {
            await chay(
              () => api.cancelAppointment(hen.id, "Người bệnh huỷ từ mini app"),
              "Đã huỷ lịch hẹn."
            );
            navigate("/appointments", { viewTransition: true });
          }}
        >
          Huỷ lịch hẹn
        </Button>
      )}
    </div>
  );
}
