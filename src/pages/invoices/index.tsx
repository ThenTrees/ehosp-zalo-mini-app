import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { activePatientIdState, invoicesState } from "@/state";
import { formatPrice } from "@/utils/format";

export default function InvoicesPage() {
  const navigate = useNavigate();
  const patientId = useAtomValue(activePatientIdState);
  const invoices = useAtomValue(invoicesState(patientId ?? 0));

  if (invoices.length === 0) {
    return <div className="p-4 text-disabled">Chưa có hoá đơn nào.</div>;
  }

  return (
    <div className="p-4 space-y-3">
      {invoices.map((hoaDon) => (
        <button
          key={hoaDon.id}
          disabled={hoaDon.paid || hoaDon.amountDue === 0}
          onClick={() =>
            navigate(`/invoices/${hoaDon.id}/qr`, { viewTransition: true })
          }
          className="w-full text-left p-3 rounded-xl bg-white disabled:opacity-60"
        >
          <div className="flex justify-between">
            <span className="font-medium">Khám ngày {hoaDon.visitDate}</span>
            <span className="text-2xs text-disabled">
              {hoaDon.paid
                ? "Đã thanh toán"
                : hoaDon.amountDue === 0
                  ? "BHYT chi trả toàn bộ"
                  : "Chưa thanh toán"}
            </span>
          </div>
          <div className="text-2xs text-primary">
            {formatPrice(hoaDon.amountDue)}
          </div>
        </button>
      ))}
    </div>
  );
}
