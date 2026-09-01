import { useAtomValue, useSetAtom } from "jotai";
import LinkRequired from "@/components/link-required";
import { Button } from "@/components/button";
import { InfoIcon, RefreshIcon, TicketIcon } from "@/components/icons";
import { Card, EmptyState } from "@/components/ui";
import { activePatientIdState, queueState } from "@/state";

export default function QueuePage() {
  const patientId = useAtomValue(activePatientIdState);
  const queue = useAtomValue(queueState(patientId));
  const refresh = useSetAtom(queueState(patientId));

  if (queue === null) {
    return (
      <LinkRequired message="Liên kết hồ sơ để xem số thứ tự khám của bạn hôm nay." />
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

  const ahead =
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
        <Row label="Đang gọi tới số" value={queue.currentNumber ?? "—"} />
        <Row
          label="Còn trước bạn"
          value={
            ahead === null
              ? "—"
              : ahead <= 0
                ? "Đến lượt bạn"
                : `${ahead} người`
          }
        />
        <Row
          label="Ước tính còn"
          value={
            queue.estimatedWaitMinutes === null
              ? "—"
              : `khoảng ${queue.estimatedWaitMinutes} phút`
          }
          last
        />
      </Card>

      <Button variant="secondary" onClick={() => refresh()}>
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

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string | number;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 px-4 py-3 ${
        last ? "" : "border-b border-line"
      }`}
    >
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-base font-semibold text-ink">{value}</span>
    </div>
  );
}
