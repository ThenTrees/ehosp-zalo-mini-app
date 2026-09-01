import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import LinkRequired from "@/components/link-required";
import { Button } from "@/components/button";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ReceiptIcon,
} from "@/components/icons";
import {
  Card,
  EmptyState,
  PageHeading,
  SectionHeader,
  StatusChip,
  invoiceTone,
} from "@/components/ui";
import { activePatientIdState, invoicesState } from "@/state";
import { formatIsoDate, formatPrice } from "@/utils/format";
import type { InvoiceSummary } from "@/types";

export default function InvoicesPage() {
  const patientId = useAtomValue(activePatientIdState);
  const invoices = useAtomValue(invoicesState(patientId));

  if (patientId === null) {
    return <LinkRequired message="Liên kết hồ sơ để xem hoá đơn viện phí." />;
  }

  const unpaid = invoices.filter((invoice) => !invoice.paid && invoice.amountDue > 0);
  const paid = invoices.filter((invoice) => invoice.paid);
  const totalUnpaid = unpaid.reduce((sum, invoice) => sum + invoice.amountDue, 0);
  const totalPaid = paid.reduce((sum, invoice) => sum + invoice.amountDue, 0);

  return (
    <div>
      <PageHeading
        title="Hoá đơn & thanh toán"
        subtitle="Chi phí khám chữa bệnh của bạn tại phòng khám."
      />

      {invoices.length === 0 ? (
        <EmptyState
          icon={ReceiptIcon}
          title="Chưa có hoá đơn nào"
          hint="Hoá đơn xuất hiện ở đây sau mỗi lần bạn khám tại phòng khám."
        />
      ) : (
        <div className="space-y-6 p-4 pt-0">
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Cần thanh toán"
              amount={totalUnpaid}
              tone="error"
              caption={`${unpaid.length} hoá đơn`}
              icon={AlertCircleIcon}
            />
            <StatTile
              label="Đã thanh toán"
              amount={totalPaid}
              tone="success"
              caption={`${paid.length} hoá đơn`}
              icon={CheckCircleIcon}
            />
          </div>

          <div className="space-y-3">
            <SectionHeader title="Danh sách hoá đơn" />
            {invoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  amount,
  tone,
  caption,
  icon: Icon,
}: {
  label: string;
  amount: number;
  tone: "error" | "success";
  caption: string;
  icon: typeof AlertCircleIcon;
}) {
  return (
    <Card>
      <div className="text-sm text-ink-muted">{label}</div>
      <div
        className={`mt-1 text-xl font-bold ${tone === "error" ? "text-error" : "text-ink"}`}
      >
        {formatPrice(amount)}
      </div>
      <div
        className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-3xs font-semibold ${
          tone === "error"
            ? "bg-error-soft text-error"
            : "bg-success-soft text-success"
        }`}
      >
        <Icon width={14} height={14} />
        {caption}
      </div>
    </Card>
  );
}

function InvoiceCard({ invoice }: { invoice: InvoiceSummary }) {
  const navigate = useNavigate();
  const { label, tone } = invoiceTone(invoice);
  const payable = !invoice.paid && invoice.amountDue > 0;

  return (
    <Card accent={payable ? "error" : undefined} className="pl-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-ink">
            Khám ngày {formatIsoDate(invoice.visitDate)}
          </div>
          <div className="mt-1">
            <StatusChip tone={tone}>{label}</StatusChip>
          </div>
        </div>
        <div
          className={`shrink-0 text-lg font-bold ${payable ? "text-error" : "text-ink"}`}
        >
          {formatPrice(invoice.amountDue)}
        </div>
      </div>

      {payable && (
        <Button
          className="mt-4"
          onClick={() =>
            navigate(`/invoices/${invoice.id}/qr`, { viewTransition: true })
          }
        >
          Lấy mã thanh toán
        </Button>
      )}
    </Card>
  );
}
