import { useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { bookingFormState, slotsState } from "@/state";
import type { Session } from "@/types";

function bayNgayToi(): string[] {
  const homNay = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const ngay = new Date(homNay);
    ngay.setDate(homNay.getDate() + i + 1);
    return ngay.toISOString().slice(0, 10);
  });
}

const TEN_BUOI: Record<Session, string> = {
  SANG: "Buổi sáng",
  CHIEU: "Buổi chiều",
};

export default function Step2({ onNext }: { onNext: () => void }) {
  const [form, setForm] = useAtom(bookingFormState);
  const ngayList = useMemo(bayNgayToi, []);
  const [ngay, setNgay] = useState(ngayList[0]);

  const slots = useAtomValue(
    slotsState({ departmentId: form.departmentId!, date: ngay })
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {ngayList.map((d) => (
          <button
            key={d}
            onClick={() => setNgay(d)}
            className={`shrink-0 px-3 py-2 rounded-xl text-2xs ${
              d === ngay ? "bg-primary text-white" : "bg-white text-disabled"
            }`}
          >
            {d.slice(8)}/{d.slice(5, 7)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {slots.map((slot) => (
          <button
            key={slot.session}
            disabled={slot.remaining <= 0}
            onClick={() => {
              setForm((f) => ({ ...f, date: slot.date, session: slot.session }));
              onNext();
            }}
            className="w-full flex justify-between items-center p-3 rounded-xl bg-white disabled:opacity-50"
          >
            <span className="font-medium">{TEN_BUOI[slot.session]}</span>
            <span className="text-2xs text-disabled">
              {slot.remaining > 0 ? `Còn ${slot.remaining} chỗ` : "Hết chỗ"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
