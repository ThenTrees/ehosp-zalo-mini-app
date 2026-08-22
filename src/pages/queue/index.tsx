import { useAtomValue } from "jotai";
import { activePatientIdState, queueState } from "@/state";

export default function QueuePage() {
  const patientId = useAtomValue(activePatientIdState);
  const queue = useAtomValue(queueState(patientId ?? 0));

  if (queue.myNumber === null) {
    return (
      <div className="p-4 text-disabled">
        Hôm nay bạn chưa có số thứ tự. Số được cấp khi bạn đến quầy tiếp đón.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl p-6 text-center">
        <div className="text-2xs text-disabled">Số của bạn</div>
        <div className="text-4xl font-semibold text-primary">
          {queue.myNumber}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-disabled">Đang gọi tới số</span>
          <span className="font-medium">{queue.currentNumber ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-disabled">Phòng khám</span>
          <span className="font-medium">{queue.roomName ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-disabled">Ước tính còn</span>
          <span className="font-medium">
            {queue.estimatedWaitMinutes === null
              ? "—"
              : `khoảng ${queue.estimatedWaitMinutes} phút`}
          </span>
        </div>
      </div>

      <p className="text-2xs text-disabled">
        Thời gian ước tính chỉ mang tính tham khảo và có thể thay đổi khi có ca
        cấp cứu.
      </p>
    </div>
  );
}
