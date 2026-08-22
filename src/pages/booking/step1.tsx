import { useAtomValue, useSetAtom } from "jotai";
import { departmentsState, bookingFormState } from "@/state";

export default function Step1({ onNext }: { onNext: () => void }) {
  const departments = useAtomValue(departmentsState);
  const setForm = useSetAtom(bookingFormState);

  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-disabled">Chọn chuyên khoa bạn muốn khám.</p>
      {departments.map((department) => (
        <button
          key={department.id}
          className="w-full text-left p-3 rounded-xl bg-white active:scale-[0.99]"
          onClick={() => {
            setForm((form) => ({ ...form, departmentId: department.id }));
            onNext();
          }}
        >
          <div className="font-medium">{department.name}</div>
          {department.description && (
            <div className="text-2xs text-disabled">{department.description}</div>
          )}
        </button>
      ))}
    </div>
  );
}
