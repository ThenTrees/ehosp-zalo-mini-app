import { useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
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
  bacSiCuaKhoaState,
} from "@/state";
import { formatIsoDateLong, sessionName } from "@/utils/format";

export default function Step3({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  // `useAtom` chứ không `useAtomValue`: bước này nay GHI vào form (ô lý do).
  const [form, setForm] = useAtom(bookingFormState);
  const resetForm = useResetAtom(bookingFormState);
  const departments = useAtomValue(departmentsState);
  const profile = useAtomValue(activeProfileState);
  const patientId = useAtomValue(activePatientIdState);
  const refreshAppointments = useSetAtom(appointmentsState(patientId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const department = departments.find((d) => d.id === form.departmentId);
  const bacSi = useAtomValue(bacSiCuaKhoaState(form.departmentId ?? null));

  async function confirm() {
    if (!patientId || !form.departmentId || !form.date || !form.session) {
      setError("Thiếu thông tin đặt lịch. Vui lòng chọn lại từ đầu.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const appointment = await api.createAppointment({
        patientId,
        departmentId: form.departmentId,
        date: form.date,
        session: form.session,
        reason: form.reason,
        doctorId: form.doctorId,
      });
      refreshAppointments();
      resetForm();
      toast.success("Đặt lịch thành công.");
      navigate(`/appointments/${appointment.id}`, { viewTransition: true });
    } catch (error) {
      // Lỗi hết quota hoặc quá hai lịch hẹn đang mở là chuyện thường gặp và
      // cần đọc kỹ, nên nó ở lại trên màn hình chứ không trôi đi như toast.
      setError(
        error instanceof Error
          ? error.message
          : "Không đặt được lịch. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
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
        <Row label="Người khám" value={profile?.fullName ?? "—"} />
        <Row label="Chuyên khoa" value={department?.name ?? "—"} />
        <Row
          label="Ngày khám"
          value={form.date ? formatIsoDateLong(form.date) : "—"}
        />
        <Row
          label="Buổi"
          value={form.session ? sessionName(form.session) : "—"}
          isLast
        />
      </Card>

      {/*
        BÁC SĨ MONG MUỐN — KHÔNG BẮT BUỘC, VÀ KHÔNG PHẢI MỘT CHỖ ĐÃ GIỮ.

        Phép kiểm sức chứa của máy chủ đếm theo KHOA, không theo bác sĩ. Nên
        cái hẹn ghi tên bác sĩ vẫn có thể được xếp cho người khác lúc tiếp đón,
        và câu chú dưới ô nói đúng điều đó. Viết "đã đặt bác sĩ X" ở đây là hứa
        một chỗ hệ thống không giữ — người bệnh tới nơi, gặp người khác, và họ
        nhớ lời hứa chứ không nhớ dòng chữ nhỏ.

        Mặc định "Bác sĩ nào cũng được": phần lớn người bệnh không có nguyện
        vọng, và bắt họ chọn một cái tên lạ là thêm một bước không sinh ra gì.
      */}
      {bacSi.length > 0 && (
        <Card>
          <label htmlFor="bac-si" className="block text-sm font-medium text-ink">
            Bác sĩ mong muốn{" "}
            <span className="font-normal text-ink-muted">(không bắt buộc)</span>
          </label>
          <select
            id="bac-si"
            value={form.doctorId ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                doctorId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-base text-ink"
          >
            <option value="">Bác sĩ nào cũng được</option>
            {bacSi.map((b) => (
              <option key={b.id} value={b.id}>
                {b.hocVi ? `${b.hocVi} ` : ""}
                {b.hoTen}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-muted">
            Phòng khám sẽ cố gắng xếp theo nguyện vọng, nhưng chưa chắc chắn —
            lịch của bác sĩ có thể thay đổi trong ngày.
          </p>
        </Card>
      )}

      {/*
        LÝ DO ĐI KHÁM — KHÔNG BẮT BUỘC, và đó là một quyết định chứ không phải
        sự lười.

        Bắt buộc một ô tự luận trên điện thoại chỉ sinh ra hàng loạt dòng "kham
        benh": người ta gõ cho qua để bấm được nút. Tệ hơn để trống, vì ô trống
        thì buồng khám biết là chưa hỏi, còn một dòng "kham benh" trông như đã
        hỏi rồi.

        Gợi ý viết gì thì đặt trong `placeholder` chứ không đặt thành nhãn dài:
        người bệnh đang đứng, đọc trên màn hình nhỏ.
      */}
      <Card>
        <label
          htmlFor="ly-do"
          className="block text-sm font-medium text-ink"
        >
          Lý do đi khám{" "}
          <span className="font-normal text-ink-muted">(không bắt buộc)</span>
        </label>
        <textarea
          id="ly-do"
          rows={3}
          maxLength={500}
          value={form.reason ?? ""}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="Ví dụ: ho kéo dài 5 ngày, sốt về chiều"
          className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-base text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-xs text-ink-muted">
          Viết ngắn cũng được — bác sĩ đọc trước khi gọi vào phòng.
        </p>
      </Card>

      {error && (
        <div className="flex gap-3 rounded-md bg-error-soft p-4">
          <AlertCircleIcon
            width={20}
            height={20}
            className="mt-0.5 shrink-0 text-error"
          />
          <p className="text-sm text-error">{error}</p>
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

      <Button loading={submitting} onClick={confirm}>
        Xác nhận đặt lịch
      </Button>
      <Button variant="ghost" onClick={onBack}>
        Chọn lại ngày khám
      </Button>
    </div>
  );
}

function Row({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 px-4 py-3 ${
        isLast ? "" : "border-b border-line"
      }`}
    >
      <span className="shrink-0 text-sm text-ink-muted">{label}</span>
      <span className="text-right text-base font-medium text-ink">
        {value}
      </span>
    </div>
  );
}
