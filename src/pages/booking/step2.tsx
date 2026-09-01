import { Suspense, useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Button } from "@/components/button";
import { CheckCircleIcon, ClockIcon } from "@/components/icons";
import { bookingFormState, slotsState } from "@/state";
import { formatDayShort, tenBuoi, toIsoDate } from "@/utils/format";
import type { Session } from "@/types";

/** Bảy ngày kể từ ngày mai — hôm nay đã hết chỗ đặt trước qua app. */
function bayNgayToi(): string[] {
  const homNay = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const ngay = new Date(homNay);
    ngay.setDate(homNay.getDate() + i + 1);
    return toIsoDate(ngay);
  });
}

export default function Step2({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const [form, setForm] = useAtom(bookingFormState);
  const ngayList = useMemo(bayNgayToi, []);
  const [ngay, setNgay] = useState(ngayList[0]);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-xl font-bold text-ink">Chọn ngày và buổi khám</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Phòng khám xếp bác sĩ và giờ cụ thể khi bạn tới nơi.
        </p>
      </div>

      <div className="an-thanh-cuon -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {ngayList.map((d) => {
          const [nam, thang, ngayTrongThang] = d.split("-").map(Number);
          const date = new Date(nam, thang - 1, ngayTrongThang);
          const dangChon = d === ngay;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setNgay(d)}
              className={`flex w-16 shrink-0 flex-col items-center rounded-md border py-2.5 ${
                dangChon
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-ink"
              }`}
            >
              <span
                className={`text-3xs ${dangChon ? "text-white/80" : "text-ink-muted"}`}
              >
                {formatDayShort(date)}
              </span>
              <span className="text-lg font-bold leading-6">
                {ngayTrongThang}
              </span>
              <span
                className={`text-3xs ${dangChon ? "text-white/80" : "text-ink-muted"}`}
              >
                th.{thang}
              </span>
            </button>
          );
        })}
      </div>

      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-md bg-white" />
            <div className="h-20 animate-pulse rounded-md bg-white" />
          </div>
        }
      >
        <DanhSachBuoi
          departmentId={form.departmentId!}
          ngay={ngay}
          onChon={(session, date) => {
            setForm((f) => ({ ...f, date, session }));
            onNext();
          }}
        />
      </Suspense>

      <Button variant="ghost" onClick={onBack}>
        Chọn lại chuyên khoa
      </Button>
    </div>
  );
}

function DanhSachBuoi({
  departmentId,
  ngay,
  onChon,
}: {
  departmentId: number;
  ngay: string;
  onChon: (session: Session, date: string) => void;
}) {
  const slots = useAtomValue(slotsState({ departmentId, date: ngay }));

  if (slots.length === 0) {
    return (
      <div className="rounded-md bg-surface-sunken p-4 text-center text-sm text-ink-muted">
        Ngày này phòng khám không nhận đặt lịch trực tuyến.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {slots.map((slot) => {
        const hetCho = !slot.available;
        return (
          <button
            key={slot.session}
            type="button"
            disabled={hetCho}
            onClick={() => onChon(slot.session, slot.date)}
            className="flex w-full items-center gap-3 rounded-md border border-line bg-surface p-4 text-left shadow-card disabled:opacity-50 disabled:shadow-none [&:not(:disabled)]:active:scale-[0.99]"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded ${
                hetCho
                  ? "bg-surface-sunken text-ink-muted"
                  : "bg-primary-soft text-primary-ink"
              }`}
            >
              <ClockIcon width={22} height={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-ink">
                {tenBuoi(slot.session)}
              </span>
              <span
                className={`mt-0.5 block text-sm ${hetCho ? "text-ink-muted" : "text-success"}`}
              >
                {hetCho ? "Đã hết chỗ" : "Còn nhận đặt lịch"}
              </span>
            </span>
            {!hetCho && (
              <CheckCircleIcon
                width={20}
                height={20}
                className="shrink-0 text-line-strong"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
