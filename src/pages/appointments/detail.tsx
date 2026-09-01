import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "@/services";
import LinkRequired from "@/components/link-required";
import { Button } from "@/components/button";
import { CalendarIcon, ClockIcon } from "@/components/icons";
import {
  Card,
  EmptyState,
  StatusChip,
  appointmentTone,
} from "@/components/ui";
import {
  activePatientIdState,
  appointmentByIdState,
  appointmentsState,
  customTitleState,
} from "@/state";
import { formatIsoDateLong, sessionName } from "@/utils/format";
import type { Appointment } from "@/types";

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const patientId = useAtomValue(activePatientIdState);

  if (patientId === null) {
    return <LinkRequired message="Liên kết hồ sơ để xem lịch hẹn." />;
  }

  return <Body id={Number(id)} patientId={patientId} />;
}

function Body({ id, patientId }: { id: number; patientId: number }) {
  const navigate = useNavigate();
  const appointment = useAtomValue(appointmentByIdState({ id, patientId }));
  const refreshAppointment = useSetAtom(appointmentByIdState({ id, patientId }));
  const refreshList = useSetAtom(appointmentsState(patientId));
  const setTitle = useSetAtom(customTitleState);
  const [submitting, setSubmitting] = useState(false);

  const title = appointment?.department.name ?? "Lịch hẹn";
  useEffect(() => {
    setTitle(title);
    return () => setTitle("");
  }, [title, setTitle]);

  async function run(task: () => Promise<unknown>, notify: string) {
    setSubmitting(true);
    try {
      await task();
      refreshAppointment();
      refreshList();
      toast.success(notify);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Thao tác thất bại.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!appointment) {
    return (
      <EmptyState
        icon={CalendarIcon}
        title="Không tìm thấy lịch hẹn"
        hint="Lịch hẹn này không thuộc hồ sơ đang xem."
        actionLabel="Về danh sách lịch hẹn"
        actionTo="/appointments"
      />
    );
  }

  /*
   * Chỉ trạng thái `Scheduled` mới đổi được — đúng chốt của
   * `doiTrangThaiHenTuApp()` ở máy chủ, chỗ trả 409 "Lịch hẹn không còn có thể
   * thay đổi". Hiện nút rồi để máy chủ từ chối là bắt người bệnh bấm để biết
   * mình không được bấm.
   */
  const isOpen = appointment.status === "Scheduled";

  return (
    <div className="space-y-4 p-4">
      <AppointmentCard appointment={appointment} />

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
          {appointment.appointmentCode}
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          Đọc mã này cho nhân viên tại quầy tiếp đón để nhận số thứ tự.
        </p>
      </Card>

      {isOpen && !appointment.patientConfirmed && (
        <Button
          loading={submitting}
          onClick={() =>
            run(
              () => api.confirmAppointment({ id: appointment.id, patientId }),
              "Đã xác nhận lịch hẹn.",
            )
          }
        >
          Xác nhận sẽ đến khám
        </Button>
      )}

      {isOpen && (
        <Button
          variant="danger"
          loading={submitting}
          onClick={async () => {
            await run(
              () =>
                api.cancelAppointment({
                  id: appointment.id,
                  patientId,
                  // Máy chủ từ chối lý do rỗng (400 "Phải nhập lý do huỷ"), nên
                  // luôn phải có một chuỗi ở đây.
                  reason: "Người bệnh huỷ từ mini app",
                }),
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

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const { label, tone } = appointmentTone(appointment);

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-2xs text-ink-muted">Chuyên khoa</div>
          <div className="mt-0.5 text-xl font-bold text-ink">
            {appointment.department.name}
          </div>
        </div>
        <StatusChip tone={tone}>{label}</StatusChip>
      </div>

      <div className="mt-4 space-y-3 border-t border-line pt-4">
        <div className="flex items-center gap-3">
          <CalendarIcon width={20} height={20} className="text-primary-ink" />
          <span className="text-base text-ink">
            {formatIsoDateLong(appointment.apptDate)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ClockIcon width={20} height={20} className="text-primary-ink" />
          <span className="text-base text-ink">{sessionName(appointment.session)}</span>
        </div>
      </div>
    </Card>
  );
}
