import { ChevronRightIcon, PillIcon } from "@/components/icons";
import { Card, StatusChip, prescriptionTone } from "@/components/ui";
import { formatIsoDate } from "@/utils/format";
import type { PrescriptionSummary } from "@/types";

/**
 * Một đơn thuốc trong danh sách.
 *
 * Cố ý không có chỗ nào cho tên thuốc, liều hay số lượng — spec §6.1 quy tắc 1.
 * Thứ duy nhất đơn này trả lời được là "đã lấy thuốc chưa", và đó cũng đúng là
 * câu người bệnh hay hỏi nhất khi mở lại một đơn cũ.
 */
export default function PrescriptionCard({
  prescription,
  onClick,
}: {
  prescription: PrescriptionSummary;
  onClick?: () => void;
}) {
  const { label, tone } = prescriptionTone(prescription);

  const content = (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary-soft text-primary-ink">
        <PillIcon width={20} height={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-base font-semibold text-ink">
          {prescription.code}
        </span>
        <span className="mt-0.5 block text-sm text-ink-muted">
          Kê ngày {formatIsoDate(prescription.issuedDate)}
        </span>
        <span className="mt-2 block">
          <StatusChip tone={tone}>{label}</StatusChip>
        </span>
      </span>
      {onClick && (
        <ChevronRightIcon
          width={18}
          height={18}
          className="mt-1 shrink-0 text-line-strong"
        />
      )}
    </div>
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
