import { useNavigate } from "react-router-dom";
import { CalendarIcon, ChevronRightIcon, ClockIcon } from "@/components/icons";
import { StatusChip, trangThaiLichHen } from "@/components/ui";
import { formatIsoDate, tenBuoi } from "@/utils/format";
import type { Appointment } from "@/types";

/**
 * Thẻ tóm tắt một lịch hẹn. Dùng chung giữa Trang chủ và danh sách Lịch hẹn,
 * nên hai chỗ không bao giờ hiển thị lệch nhau.
 *
 * Cố ý không in mã hẹn ở đây: mã hẹn là thứ dùng để nhận diện tại quầy, chỉ
 * hiện ở màn chi tiết khi người bệnh chủ động mở ra.
 */
export default function AppointmentCard({ hen }: { hen: Appointment }) {
  const navigate = useNavigate();
  const { nhan, tone } = trangThaiLichHen(hen);

  return (
    <button
      type="button"
      onClick={() =>
        navigate(`/appointments/${hen.id}`, { viewTransition: true })
      }
      className="relative w-full overflow-hidden rounded-md border border-line bg-surface p-4 pl-5 text-left shadow-card active:scale-[0.99]"
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${
          tone === "error"
            ? "bg-error"
            : tone === "warning"
              ? "bg-warning"
              : tone === "success"
                ? "bg-success"
                : "bg-primary"
        }`}
      />

      <div className="flex items-start gap-3">
        <span className="min-w-0 flex-1 text-lg font-semibold text-ink">
          {hen.department.name}
        </span>
        <StatusChip tone={tone}>{nhan}</StatusChip>
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-line pt-3 text-sm text-ink-muted">
        <span className="flex items-center gap-1.5">
          <CalendarIcon width={16} height={16} />
          {formatIsoDate(hen.apptDate)}
        </span>
        <span className="flex items-center gap-1.5">
          <ClockIcon width={16} height={16} />
          {tenBuoi(hen.session)}
        </span>
        <ChevronRightIcon
          width={18}
          height={18}
          className="ml-auto text-line-strong"
        />
      </div>
    </button>
  );
}
