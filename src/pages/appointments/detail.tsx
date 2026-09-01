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
  trangThaiLichHen,
} from "@/components/ui";
import {
  activePatientIdState,
  appointmentByIdState,
  appointmentsState,
  customTitleState,
} from "@/state";
import { formatIsoDateLong, tenBuoi } from "@/utils/format";
import type { Appointment } from "@/types";

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const patientId = useAtomValue(activePatientIdState);

  if (patientId === null) {
    return <LinkRequired loiNhan="Liên kết hồ sơ để xem lịch hẹn." />;
  }

  return <NoiDung id={Number(id)} patientId={patientId} />;
}

function NoiDung({ id, patientId }: { id: number; patientId: number }) {
  const navigate = useNavigate();
  const hen = useAtomValue(appointmentByIdState({ id, patientId }));
  const refreshHen = useSetAtom(appointmentByIdState({ id, patientId }));
  const refreshList = useSetAtom(appointmentsState(patientId));
  const setTitle = useSetAtom(customTitleState);
  const [dangGui, setDangGui] = useState(false);

  const tieuDe = hen?.department.name ?? "Lịch hẹn";
  useEffect(() => {
    setTitle(tieuDe);
    return () => setTitle("");
  }, [tieuDe, setTitle]);

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

  if (!hen) {
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
  const conMo = hen.status === "Scheduled";

  return (
    <div className="space-y-4 p-4">
      <TheLichHen hen={hen} />

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

      {conMo && !hen.patientConfirmed && (
        <Button
          loading={dangGui}
          onClick={() =>
            chay(
              () => api.confirmAppointment({ id: hen.id, patientId }),
              "Đã xác nhận lịch hẹn.",
            )
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
              () =>
                api.cancelAppointment({
                  id: hen.id,
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

function TheLichHen({ hen }: { hen: Appointment }) {
  const { nhan, tone } = trangThaiLichHen(hen);

  return (
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
  );
}
