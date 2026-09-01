import { useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  ChevronRightIcon,
  SearchIcon,
  StethoscopeIcon,
} from "@/components/icons";
import { EmptyState } from "@/components/ui";
import { bookingFormState, departmentsState } from "@/state";
import { toLowerCaseNonAccentVietnamese } from "@/utils/miscellaneous";

export default function Step1({ onNext }: { onNext: () => void }) {
  const departments = useAtomValue(departmentsState);
  const setForm = useSetAtom(bookingFormState);
  const [keyword, setKeyword] = useState("");

  // Người bệnh gõ "khoa noi" phải ra "Khoa Nội" — so sánh chuỗi có dấu thì
  // không bao giờ khớp.
  const results = useMemo(() => {
    const department = toLowerCaseNonAccentVietnamese(keyword.trim());
    if (!department) return departments;
    return departments.filter((d) =>
      toLowerCaseNonAccentVietnamese(
        `${d.name} ${d.description ?? ""}`,
      ).includes(department),
    );
  }, [departments, keyword]);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-xl font-bold text-ink">Bạn muốn khám department nào?</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Phòng khám sẽ phân công bác sĩ trực của buổi bạn chọn.
        </p>
      </div>

      <div className="flex h-12 items-center gap-2 rounded border border-line bg-surface px-3 focus-within:border-2 focus-within:border-primary">
        <SearchIcon
          width={20}
          height={20}
          className="shrink-0 text-ink-muted"
        />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm chuyên khoa…"
          className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted"
        />
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="Không tìm thấy chuyên khoa"
          hint="Thử bỏ bớt từ khoá, hoặc xem toàn bộ danh sách."
          actionLabel="Xoá tìm kiếm"
          onAction={() => setKeyword("")}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {results.map((department) => (
            <button
              key={department.id}
              type="button"
              className="flex flex-col rounded-md border border-line bg-surface p-4 text-left shadow-card active:scale-[0.98]"
              onClick={() => {
                setForm((form) => ({ ...form, departmentId: department.id }));
                onNext();
              }}
            >
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded bg-primary-soft text-primary-ink">
                <StethoscopeIcon width={22} height={22} />
              </span>
              <span className="flex items-center gap-1 text-base font-semibold text-ink">
                <span className="min-w-0 flex-1">{department.name}</span>
                <ChevronRightIcon
                  width={16}
                  height={16}
                  className="shrink-0 text-line-strong"
                />
              </span>
              {department.description && (
                <span className="mt-1 text-sm text-ink-muted">
                  {department.description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
