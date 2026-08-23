import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "@/services";
import { Button } from "@/components/button";
import { AlertCircleIcon, CalendarIcon, ClockIcon } from "@/components/icons";
import { Card, StatusChip, trangThaiLichHen } from "@/components/ui";
import {
  activePatientIdState,
  appointmentByIdState,
  appointmentsState,
  customTitleState,
} from "@/state";
import { formatIsoDateLong, tenBuoi } from "@/utils/format";

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const appointmentId = Number(id);
  const hen = useAtomValue(appointmentByIdState(appointmentId));
  const refreshHen = useSetAtom(appointmentByIdState(appointmentId));
  const patientId = useAtomValue(activePatientIdState);
  const refreshList = useSetAtom(appointmentsState(patientId));
  const setTitle = useSetAtom(customTitleState);
  const [dangGui, setDangGui] = useState(false);

  useEffect(() => {
    setTitle(hen.department.name);
    return () => setTitle("");
  }, [hen.department.name, setTitle]);

  async function chay(viec: () => Promise<unknown>, thongBao: string) {
    setDangGui(true);
    try {
      await viec();
      refreshHen();
      refreshList();
      toast.success(thongBao);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Thao tác thất bại.",
      );
    } finally {
      setDangGui(false);
    }
  }

  const { nhan, tone } = trangThaiLichHen(hen);
  const conMo = hen.status === "Scheduled" || hen.status === "WaitListed";

  return (
    <div className="space-y-4 p-4">
      <Card>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-2xs text-ink-muted">Chuyên khoa</div>
            <div className="mt-0.5 text-xl font-bold text-ink">
              {hen.department.name}
            </div>
          </div>
          <StatusChip tone={tone}>{nhan}</StatusChip>
        </div>

        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <div className="flex items-center gap-3">
            <CalendarIcon width={20} height={20} className="text-primary-ink" />
            <span className="text-base text-ink">
              {formatIsoDateLong(hen.apptDate)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ClockIcon width={20} height={20} className="text-primary-ink" />
            <span className="text-base text-ink">{tenBuoi(hen.session)}</span>
          </div>
        </div>
      </Card>

      {/*
        Mã hẹn là thứ người bệnh đọc cho nhân viên tiếp đón. Nó được cỡ chữ lớn
        và giãn ký tự để đọc to không nhầm, nhưng chỉ nằm ở màn chi tiết chứ
        không rải ra danh sách.
      */}
      <Card className="text-center">
        <div className="text-2xs uppercase tracking-wide text-ink-muted">
          Mã lịch hẹn
        </div>
        <div className="mt-1 font-mono text-2xl font-bold tracking-widest text-primary-ink">
          {hen.appointmentCode}
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          Đọc mã này cho nhân viên tại quầy tiếp đón để nhận số thứ tự.
        </p>
      </Card>

      {hen.prepNote && (
        <div className="flex gap-3 rounded-md bg-warning-soft p-4">
          <AlertCircleIcon
            width={20}
            height={20}
            className="mt-0.5 shrink-0 text-warning"
          />
          <div>
            <div className="text-base font-semibold text-warning">
              Chuẩn bị trước khi khám
            </div>
            <p className="mt-1 text-sm text-ink">{hen.prepNote}</p>
          </div>
        </div>
      )}

      {conMo && !hen.patientConfirmed && (
        <Button
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
          variant="danger"
          loading={dangGui}
          onClick={async () => {
            await chay(
              () => api.cancelAppointment(hen.id, "Người bệnh huỷ từ mini app"),
              "Đã huỷ lịch hẹn.",
            );
            navigate("/appointments", { viewTransition: true });
          }}
        >
          Huỷ lịch hẹn
        </Button>
      )}

      <p className="px-1 text-sm text-ink-muted">
        Phòng khám phân công bác sĩ và phòng cụ thể khi bạn tới. Vui lòng mang
        theo thẻ BHYT và giấy tờ tuỳ thân.
      </p>
    </div>
  );
}
