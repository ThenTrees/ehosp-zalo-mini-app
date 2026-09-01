import { useAtomValue } from "jotai";
import { ChevronRightIcon } from "@/components/icons";
import { Card, StatusChip, trangThaiLuotKham } from "@/components/ui";
import { departmentNameState } from "@/state";
import { formatIsoDateLong } from "@/utils/format";
import type { VisitSummary } from "@/types";

/**
 * Một lần khám trong danh sách.
 *
 * Ngày đứng trước tên khoa vì đó là thứ người bệnh nhớ được ("hôm đầu tháng
 * tôi có đi khám"); mã lượt khám xuống cuối, cỡ nhỏ — nó chỉ có ích khi cần
 * đọc cho nhân viên nghe.
 */
export default function VisitCard({
  luot,
  onClick,
}: {
  luot: VisitSummary;
  onClick?: () => void;
}) {
  const tenKhoa = useAtomValue(departmentNameState);
  const { nhan, tone } = trangThaiLuotKham(luot);

  const noiDung = (
    <>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-ink">
            {formatIsoDateLong(luot.visitDate)}
          </div>
          <div className="mt-0.5 truncate text-sm text-ink-muted">
            {tenKhoa(luot.departmentId)}
          </div>
        </div>
        <StatusChip tone={tone}>{nhan}</StatusChip>
      </div>
      <div className="mt-3 flex items-center gap-1 border-t border-line pt-3">
        <span className="min-w-0 flex-1 truncate font-mono text-2xs text-ink-muted">
          {luot.visitCode}
        </span>
        {onClick && (
          <ChevronRightIcon
            width={18}
            height={18}
            className="shrink-0 text-line-strong"
          />
        )}
      </div>
    </>
  );

  if (!onClick) {
    return <Card>{noiDung}</Card>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left active:scale-[0.99]"
    >
      <Card>{noiDung}</Card>
    </button>
  );
}
