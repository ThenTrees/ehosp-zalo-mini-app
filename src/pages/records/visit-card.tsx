import { useAtomValue } from "jotai";
import { ChevronRightIcon } from "@/components/icons";
import { Card, StatusChip, visitTone } from "@/components/ui";
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
  visit,
  onClick,
}: {
  visit: VisitSummary;
  onClick?: () => void;
}) {
  const departmentName = useAtomValue(departmentNameState);
  const { label, tone } = visitTone(visit);

  const content = (
    <>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-ink">
            {formatIsoDateLong(visit.visitDate)}
          </div>
          <div className="mt-0.5 truncate text-sm text-ink-muted">
            {departmentName(visit.departmentId)}
          </div>
          {/*
            CHẨN ĐOÁN CHÍNH NGAY TRÊN DÒNG DANH SÁCH. Người bệnh tìm "lần tôi bị
            viêm phế quản", không tìm "VK2026090200049". `null` thì IM LẶNG —
            vẽ một dòng trống là bảo họ lần ấy có chẩn đoán mà không đọc được.
          */}
          {visit.chanDoanChinh ? (
            <div className="mt-1.5 flex items-start gap-1.5">
              <span className="mt-px shrink-0 rounded bg-primary-soft px-1.5 py-0.5 text-3xs font-medium text-primary-ink">
                {visit.chanDoanChinh.ma}
              </span>
              <span className="min-w-0 flex-1 text-sm text-ink">
                {visit.chanDoanChinh.ten}
              </span>
            </div>
          ) : null}
        </div>
        <StatusChip tone={tone}>{label}</StatusChip>
      </div>
      <div className="mt-3 flex items-center gap-1 border-t border-line pt-3">
        <span className="min-w-0 flex-1 truncate font-mono text-2xs text-ink-muted">
          {visit.visitCode}
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
    return <Card>{content}</Card>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left active:scale-[0.99]"
    >
      <Card>{content}</Card>
    </button>
  );
}
