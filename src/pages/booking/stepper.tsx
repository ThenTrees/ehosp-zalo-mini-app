const STEP_NAMES = ["Chuyên khoa", "Ngày khám", "Xác nhận"];

/**
 * Ba chấm nối nhau ở đầu luồng đặt lịch. Người bệnh cần biết còn bao nhiêu
 * bước nữa trước khi bấm nút đầu tiên, nếu không họ bỏ giữa chừng.
 */
export default function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-start gap-1 bg-surface px-4 pb-4 pt-3">
      {STEP_NAMES.map((name, i) => {
        const index = i + 1;
        const isDone = index < current;
        const isCurrent = index === current;
        return (
          <div key={name} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center gap-1">
              <span
                className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : isDone || isCurrent ? "bg-primary" : "bg-line"}`}
              />
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-bold ${
                  isDone || isCurrent
                    ? "bg-primary text-white"
                    : "bg-surface-sunken text-ink-muted"
                }`}
              >
                {index}
              </span>
              <span
                className={`h-0.5 flex-1 ${i === STEP_NAMES.length - 1 ? "opacity-0" : isDone ? "bg-primary" : "bg-line"}`}
              />
            </div>
            <span
              className={`text-3xs ${isCurrent ? "font-semibold text-primary" : "text-ink-muted"}`}
            >
              {name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
