import { Suspense, useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Button } from "@/components/button";
import { CheckCircleIcon, ClockIcon } from "@/components/icons";
import { bookingFormState, slotsState } from "@/state";
import { formatDayShort, sessionName, toIsoDate } from "@/utils/format";
import type { Session } from "@/types";

/** Bảy ngày kể từ ngày mai — hôm nay đã hết chỗ đặt trước qua app. */
function nextSevenDays(): string[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() + i + 1);
    return toIsoDate(day);
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
  const days = useMemo(nextSevenDays, []);
  const [day, setDay] = useState(days[0]);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-xl font-bold text-ink">Chọn ngày và buổi khám</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Phòng khám xếp bác sĩ và giờ cụ thể khi bạn tới nơi.
        </p>
      </div>

      <div className="an-thanh-cuon -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {days.map((d) => {
          const [year, month, dayOfMonth] = d.split("-").map(Number);
          const date = new Date(year, month - 1, dayOfMonth);
          const selected = d === day;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              className={`flex w-16 shrink-0 flex-col items-center rounded-md border py-2.5 ${
                selected
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-ink"
              }`}
            >
              <span
                className={`text-3xs ${selected ? "text-white/80" : "text-ink-muted"}`}
              >
                {formatDayShort(date)}
              </span>
              <span className="text-lg font-bold leading-6">
                {dayOfMonth}
              </span>
              <span
                className={`text-3xs ${selected ? "text-white/80" : "text-ink-muted"}`}
              >
                th.{month}
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
        <SessionList
          departmentId={form.departmentId!}
          day={day}
          onSelect={(session, date) => {
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

function SessionList({
  departmentId,
  day,
  onSelect,
}: {
  departmentId: number;
  day: string;
  onSelect: (session: Session, date: string) => void;
}) {
  const slots = useAtomValue(slotsState({ departmentId, date: day }));

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
        const isFull = !slot.available;
        return (
          <button
            key={slot.session}
            type="button"
            disabled={isFull}
            onClick={() => onSelect(slot.session, slot.date)}
            className="flex w-full items-center gap-3 rounded-md border border-line bg-surface p-4 text-left shadow-card disabled:opacity-50 disabled:shadow-none [&:not(:disabled)]:active:scale-[0.99]"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded ${
                isFull
                  ? "bg-surface-sunken text-ink-muted"
                  : "bg-primary-soft text-primary-ink"
              }`}
            >
              <ClockIcon width={22} height={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-ink">
                {sessionName(slot.session)}
              </span>
              <span
                className={`mt-0.5 block text-sm ${isFull ? "text-ink-muted" : "text-success"}`}
              >
                {isFull ? "Đã hết chỗ" : "Còn nhận đặt lịch"}
              </span>
            </span>
            {!isFull && (
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
