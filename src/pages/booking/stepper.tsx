const TEN_BUOC = ["Chuyên khoa", "Ngày khám", "Xác nhận"];

/**
 * Ba chấm nối nhau ở đầu luồng đặt lịch. Người bệnh cần biết còn bao nhiêu
 * bước nữa trước khi bấm nút đầu tiên, nếu không họ bỏ giữa chừng.
 */
export default function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-start gap-1 bg-surface px-4 pb-4 pt-3">
      {TEN_BUOC.map((ten, i) => {
        const so = i + 1;
        const xong = so < current;
        const dangO = so === current;
        return (
          <div key={ten} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center gap-1">
              <span
                className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : xong || dangO ? "bg-primary" : "bg-line"}`}
              />
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-bold ${
                  xong || dangO
                    ? "bg-primary text-white"
                    : "bg-surface-sunken text-ink-muted"
                }`}
              >
                {so}
              </span>
              <span
                className={`h-0.5 flex-1 ${i === TEN_BUOC.length - 1 ? "opacity-0" : xong ? "bg-primary" : "bg-line"}`}
              />
            </div>
            <span
              className={`text-3xs ${dangO ? "font-semibold text-primary" : "text-ink-muted"}`}
            >
              {ten}
            </span>
          </div>
        );
      })}
    </div>
  );
}
