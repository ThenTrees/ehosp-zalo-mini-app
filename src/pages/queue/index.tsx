import { useAtomValue, useSetAtom } from "jotai";
import LinkRequired from "@/components/link-required";
import { Button } from "@/components/button";
import { InfoIcon, RefreshIcon, TicketIcon } from "@/components/icons";
import { Card, EmptyState } from "@/components/ui";
import { activePatientIdState, queueState } from "@/state";

export default function QueuePage() {
  const patientId = useAtomValue(activePatientIdState);
  const queue = useAtomValue(queueState(patientId));
  const lamMoi = useSetAtom(queueState(patientId));

  if (queue === null) {
    return (
      <LinkRequired loiNhan="Liên kết hồ sơ để xem số thứ tự khám của bạn hôm nay." />
    );
  }

  if (queue.myNumber === null) {
    return (
      <EmptyState
        icon={TicketIcon}
        title="Hôm nay bạn chưa có số"
        hint="Số thứ tự được cấp khi bạn đến quầy tiếp đón và đọc mã lịch hẹn."
        actionLabel="Xem lịch hẹn của tôi"
        actionTo="/appointments"
      />
    );
  }

  const conLai =
    queue.currentNumber === null ? null : queue.myNumber - queue.currentNumber;

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-md bg-gradient-to-br from-primary to-primary-gradient p-6 text-center text-white shadow-action">
        <div className="text-2xs uppercase tracking-wide text-white/80">
          Số thứ tự của bạn
        </div>
        <div className="mt-1 text-6xl font-bold leading-none">
          {queue.myNumber}
        </div>
        {queue.roomName && (
          <div className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
            {queue.roomName}
          </div>
        )}
      </div>

      <Card bare>
        <Dong nhan="Đang gọi tới số" giaTri={queue.currentNumber ?? "—"} />
        <Dong
          nhan="Còn trước bạn"
          giaTri={
            conLai === null
              ? "—"
              : conLai <= 0
                ? "Đến lượt bạn"
                : `${conLai} người`
          }
        />
        <Dong
          nhan="Ước tính còn"
          giaTri={
            queue.estimatedWaitMinutes === null
              ? "—"
              : `khoảng ${queue.estimatedWaitMinutes} phút`
          }
          cuoi
        />
      </Card>

      <Button variant="secondary" onClick={() => lamMoi()}>
        <RefreshIcon width={20} height={20} />
        Làm mới
      </Button>

      <div className="flex gap-3 rounded-md bg-surface-sunken p-4">
        <InfoIcon
          width={20}
          height={20}
          className="mt-0.5 shrink-0 text-primary-ink"
        />
        <p className="text-sm text-ink-muted">
          Thời gian ước tính chỉ mang tính tham khảo và có thể thay đổi khi
          phòng khám tiếp nhận ca cấp cứu.
        </p>
      </div>
    </div>
  );
}

function Dong({
  nhan,
  giaTri,
  cuoi,
}: {
  nhan: string;
  giaTri: string | number;
  cuoi?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 px-4 py-3 ${
        cuoi ? "" : "border-b border-line"
      }`}
    >
      <span className="text-sm text-ink-muted">{nhan}</span>
      <span className="text-base font-semibold text-ink">{giaTri}</span>
    </div>
  );
}
