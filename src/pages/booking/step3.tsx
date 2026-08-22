import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useResetAtom } from "jotai/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "zmp-ui";
import toast from "react-hot-toast";
import { api } from "@/services";
import {
  activePatientIdState,
  appointmentsState,
  bookingFormState,
  departmentsState,
} from "@/state";

const TEN_BUOI = { SANG: "Buổi sáng", CHIEU: "Buổi chiều" } as const;

export default function Step3() {
  const navigate = useNavigate();
  const form = useAtomValue(bookingFormState);
  const resetForm = useResetAtom(bookingFormState);
  const departments = useAtomValue(departmentsState);
  const patientId = useAtomValue(activePatientIdState);
  const refreshAppointments = useSetAtom(appointmentsState(patientId));
  const [dangGui, setDangGui] = useState(false);

  const department = departments.find((d) => d.id === form.departmentId);

  async function xacNhan() {
    if (!patientId || !form.departmentId || !form.date || !form.session) {
      toast.error("Thiếu thông tin đặt lịch. Vui lòng chọn lại.");
      return;
    }
    setDangGui(true);
    try {
      const hen = await api.createAppointment({
        patientId,
        departmentId: form.departmentId,
        date: form.date,
        session: form.session,
        reason: form.reason,
      });
      refreshAppointments();
      resetForm();
      toast.success(`Đặt lịch thành công. Mã hẹn ${hen.appointmentCode}.`);
      navigate(`/appointments/${hen.id}`, { viewTransition: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không đặt được lịch. Vui lòng thử lại."
      );
    } finally {
      setDangGui(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-disabled">Chuyên khoa</span>
          <span className="font-medium">{department?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-disabled">Ngày khám</span>
          <span className="font-medium">{form.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-disabled">Buổi</span>
          <span className="font-medium">
            {form.session ? TEN_BUOI[form.session] : ""}
          </span>
        </div>
      </div>

      <p className="text-2xs text-disabled">
        Phòng khám sẽ phân công bác sĩ và phòng khám cụ thể khi bạn tới. Vui lòng
        mang theo thẻ BHYT.
      </p>

      <Button fullWidth onClick={xacNhan} loading={dangGui}>
        Xác nhận đặt lịch
      </Button>
    </div>
  );
}
