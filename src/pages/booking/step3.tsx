import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useResetAtom } from "jotai/utils";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "@/services";
import { Button } from "@/components/button";
import { AlertCircleIcon, InfoIcon } from "@/components/icons";
import { Card } from "@/components/ui";
import {
  activePatientIdState,
  activeProfileState,
  appointmentsState,
  bookingFormState,
  departmentsState,
} from "@/state";
import { formatIsoDateLong, tenBuoi } from "@/utils/format";

export default function Step3({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const form = useAtomValue(bookingFormState);
  const resetForm = useResetAtom(bookingFormState);
  const departments = useAtomValue(departmentsState);
  const profile = useAtomValue(activeProfileState);
  const patientId = useAtomValue(activePatientIdState);
  const refreshAppointments = useSetAtom(appointmentsState(patientId));
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");

  const department = departments.find((d) => d.id === form.departmentId);

  async function xacNhan() {
    if (!patientId || !form.departmentId || !form.date || !form.session) {
      setLoi("Thiếu thông tin đặt lịch. Vui lòng chọn lại từ đầu.");
      return;
    }
    setDangGui(true);
    setLoi("");
    try {
      const hen = await api.createAppointment({
        patientId,
        departmentId: form.departmentId,
        date: form.date,
        session: form.session,
      });
      refreshAppointments();
      resetForm();
      toast.success("Đặt lịch thành công.");
      navigate(`/appointments/${hen.id}`, { viewTransition: true });
    } catch (error) {
      // Lỗi hết quota hoặc quá hai lịch hẹn đang mở là chuyện thường gặp và
      // cần đọc kỹ, nên nó ở lại trên màn hình chứ không trôi đi như toast.
      setLoi(
        error instanceof Error
          ? error.message
          : "Không đặt được lịch. Vui lòng thử lại.",
      );
    } finally {
      setDangGui(false);
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-xl font-bold text-ink">Kiểm tra lại thông tin</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Xác nhận đúng rồi bấm nút bên dưới để giữ chỗ.
        </p>
      </div>

      <Card bare>
        <Dong nhan="Người khám" giaTri={profile?.fullName ?? "—"} />
        <Dong nhan="Chuyên khoa" giaTri={department?.name ?? "—"} />
        <Dong
          nhan="Ngày khám"
          giaTri={form.date ? formatIsoDateLong(form.date) : "—"}
        />
        <Dong
          nhan="Buổi"
          giaTri={form.session ? tenBuoi(form.session) : "—"}
          cuoi
        />
      </Card>

      {loi && (
        <div className="flex gap-3 rounded-md bg-error-soft p-4">
          <AlertCircleIcon
            width={20}
            height={20}
            className="mt-0.5 shrink-0 text-error"
          />
          <p className="text-sm text-error">{loi}</p>
        </div>
      )}

      <div className="flex gap-3 rounded-md bg-surface-sunken p-4">
        <InfoIcon
          width={20}
          height={20}
          className="mt-0.5 shrink-0 text-primary-ink"
        />
        <p className="text-sm text-ink-muted">
          Phòng khám phân công bác sĩ và phòng cụ thể khi bạn tới. Vui lòng mang
          theo thẻ BHYT và giấy tờ tuỳ thân.
        </p>
      </div>

      <Button loading={dangGui} onClick={xacNhan}>
        Xác nhận đặt lịch
      </Button>
      <Button variant="ghost" onClick={onBack}>
        Chọn lại ngày khám
      </Button>
    </div>
  );
}

function Dong({
  nhan,
  giaTri,
  cuoi,
}: {
  nhan: string;
  giaTri: string;
  cuoi?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 px-4 py-3 ${
        cuoi ? "" : "border-b border-line"
      }`}
    >
      <span className="shrink-0 text-sm text-ink-muted">{nhan}</span>
      <span className="text-right text-base font-medium text-ink">
        {giaTri}
      </span>
    </div>
  );
}
