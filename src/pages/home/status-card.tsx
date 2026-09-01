import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import {
  CalendarPlusIcon,
  ChevronRightIcon,
  ClockIcon,
} from "@/components/icons";
import { activePatientIdState, appointmentsState, queueState } from "@/state";
import { formatIsoDateLong, tenBuoi, todayIso } from "@/utils/format";

/**
 * Khối lớn nhất của Trang chủ. Nó trả lời đúng một câu hỏi: "ngay bây giờ tôi
 * cần biết gì?" — và câu trả lời đổi theo tình huống.
 *
 * 1. Đang có số thứ tự hôm nay -> số của tôi, số đang gọi, còn bao lâu.
 * 2. Chưa tới lượt nhưng có hẹn sắp tới -> ngày, buổi, chuyên khoa.
 * 3. Không có gì -> lời mời đặt lịch.
 *
 * Thứ tự này cố ý: người đang ngồi ở hành lang phòng khám không quan tâm tới
 * cái hẹn tháng sau.
 */
export default function StatusCard() {
  const navigate = useNavigate();
  const patientId = useAtomValue(activePatientIdState);
  const queue = useAtomValue(queueState(patientId));
  const appointments = useAtomValue(appointmentsState(patientId));

  if (queue && queue.myNumber !== null) {
    return (
      <HeroCard onClick={() => navigate("/queue", { viewTransition: true })}>
        <div className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-wide text-white/80">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          Đang khám{queue.roomName ? ` · ${queue.roomName}` : ""}
        </div>

        <div className="mt-3 flex items-end gap-3">
          <span className="text-6xl font-bold leading-none">
            {queue.myNumber}
          </span>
          <span className="pb-1.5 text-sm text-white/80">số của bạn</span>
        </div>

        <div className="mt-3 flex items-center gap-4 border-t border-white/20 pt-3 text-sm text-white/90">
          <span>Đang gọi số {queue.currentNumber ?? "—"}</span>
          {queue.estimatedWaitMinutes !== null && (
            <span className="flex items-center gap-1.5">
              <ClockIcon width={16} height={16} />
              còn khoảng {queue.estimatedWaitMinutes} phút
            </span>
          )}
          <ChevronRightIcon width={18} height={18} className="ml-auto" />
        </div>
      </HeroCard>
    );
  }

  const homNay = todayIso();
  const sapToi = appointments
    .filter((hen) => hen.status === "Scheduled" && hen.apptDate >= homNay)
    .sort((a, b) => a.apptDate.localeCompare(b.apptDate))[0];

  if (sapToi) {
    return (
      <HeroCard
        onClick={() =>
          navigate(`/appointments/${sapToi.id}`, { viewTransition: true })
        }
      >
        <div className="text-2xs font-semibold uppercase tracking-wide text-white/80">
          {sapToi.apptDate === homNay
            ? "Lịch khám hôm nay"
            : "Lịch khám sắp tới"}
        </div>

        <div className="mt-2 text-2xl font-bold">{sapToi.department.name}</div>
        <div className="mt-1 text-base text-white/90">
          {formatIsoDateLong(sapToi.apptDate)} · {tenBuoi(sapToi.session)}
        </div>

        <div className="mt-3 flex items-center border-t border-white/20 pt-3 text-sm text-white/90">
          {sapToi.patientConfirmed
            ? "Bạn đã xác nhận sẽ đến khám"
            : "Chạm để xác nhận sẽ đến khám"}
          <ChevronRightIcon width={18} height={18} className="ml-auto" />
        </div>
      </HeroCard>
    );
  }

  return (
    <HeroCard onClick={() => navigate("/booking", { viewTransition: true })}>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/20">
          <CalendarPlusIcon width={26} height={26} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold">
            Bạn chưa có lịch hẹn nào
          </span>
          <span className="mt-0.5 block text-sm text-white/85">
            Đặt lịch trước để khỏi phải chờ lấy số tại quầy
          </span>
        </span>
        <ChevronRightIcon width={20} height={20} className="shrink-0" />
      </div>
    </HeroCard>
  );
}

function HeroCard({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-md bg-gradient-to-br from-primary to-primary-gradient p-5 text-left text-white shadow-action active:scale-[0.99]"
    >
      {children}
    </button>
  );
}
