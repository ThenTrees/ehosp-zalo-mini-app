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
  trangThaiHoaDon,
} from "@/components/ui";
import { activePatientIdState, invoicesState } from "@/state";
import { formatIsoDate, formatPrice } from "@/utils/format";
import type { InvoiceSummary } from "@/types";

export default function InvoicesPage() {
  const patientId = useAtomValue(activePatientIdState);
  const invoices = useAtomValue(invoicesState(patientId));

  if (patientId === null) {
    return <LinkRequired loiNhan="Liên kết hồ sơ để xem hoá đơn viện phí." />;
  }

  const canTra = invoices.filter((hd) => !hd.paid && hd.amountDue > 0);
  const daTra = invoices.filter((hd) => hd.paid);
  const tongCanTra = canTra.reduce((tong, hd) => tong + hd.amountDue, 0);
  const tongDaTra = daTra.reduce((tong, hd) => tong + hd.amountDue, 0);

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
            <TheThongKe
              nhan="Cần thanh toán"
              soTien={tongCanTra}
              tone="error"
              chuThich={`${canTra.length} hoá đơn`}
              icon={AlertCircleIcon}
            />
            <TheThongKe
              nhan="Đã thanh toán"
              soTien={tongDaTra}
              tone="success"
              chuThich={`${daTra.length} hoá đơn`}
              icon={CheckCircleIcon}
            />
          </div>

          <div className="space-y-3">
            <SectionHeader title="Danh sách hoá đơn" />
            {invoices.map((hoaDon) => (
              <TheHoaDon key={hoaDon.id} hoaDon={hoaDon} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TheThongKe({
  nhan,
  soTien,
  tone,
  chuThich,
  icon: Icon,
}: {
  nhan: string;
  soTien: number;
  tone: "error" | "success";
  chuThich: string;
  icon: typeof AlertCircleIcon;
}) {
  return (
    <Card>
      <div className="text-sm text-ink-muted">{nhan}</div>
      <div
        className={`mt-1 text-xl font-bold ${tone === "error" ? "text-error" : "text-ink"}`}
      >
        {formatPrice(soTien)}
      </div>
      <div
        className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-3xs font-semibold ${
          tone === "error"
            ? "bg-error-soft text-error"
            : "bg-success-soft text-success"
        }`}
      >
        <Icon width={14} height={14} />
        {chuThich}
      </div>
    </Card>
  );
}

function TheHoaDon({ hoaDon }: { hoaDon: InvoiceSummary }) {
  const navigate = useNavigate();
  const { nhan, tone } = trangThaiHoaDon(hoaDon);
  const traDuoc = !hoaDon.paid && hoaDon.amountDue > 0;

  return (
    <Card accent={traDuoc ? "error" : undefined} className="pl-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-ink">
            Khám ngày {formatIsoDate(hoaDon.visitDate)}
          </div>
          <div className="mt-1">
            <StatusChip tone={tone}>{nhan}</StatusChip>
          </div>
        </div>
        <div
          className={`shrink-0 text-lg font-bold ${traDuoc ? "text-error" : "text-ink"}`}
        >
          {formatPrice(hoaDon.amountDue)}
        </div>
      </div>

      {traDuoc && (
        <Button
          className="mt-4"
          onClick={() =>
            navigate(`/invoices/${hoaDon.id}/qr`, { viewTransition: true })
          }
        >
          Lấy mã thanh toán
        </Button>
      )}
    </Card>
  );
}
