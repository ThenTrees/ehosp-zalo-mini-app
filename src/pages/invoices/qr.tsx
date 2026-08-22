import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/services";
import { formatPrice } from "@/utils/format";
import type { VietQrPayload } from "@/types";

export default function InvoiceQrPage() {
  const { id } = useParams();
  const [payload, setPayload] = useState<VietQrPayload | null>(null);
  const [loi, setLoi] = useState("");

  useEffect(() => {
    api
      .invoiceQr(Number(id))
      .then(setPayload)
      .catch((error) =>
        setLoi(
          error instanceof Error
            ? error.message
            : "Không lấy được mã thanh toán."
        )
      );
  }, [id]);

  if (loi) {
    return <div className="p-4 text-disabled">{loi}</div>;
  }
  if (!payload) {
    return <div className="p-4 text-disabled">Đang lấy mã thanh toán…</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl p-6 text-center space-y-2">
        <div className="text-2xs text-disabled">Số tiền cần thanh toán</div>
        <div className="text-2xl font-semibold text-primary">
          {formatPrice(payload.amount)}
        </div>
        <div className="text-2xs text-disabled break-all pt-4">
          {payload.qrContent}
        </div>
      </div>
      <p className="text-2xs text-disabled">
        Đưa mã này cho nhân viên quầy thu ngân. Mã có hiệu lực đến{" "}
        {payload.expiresAt}.
      </p>
    </div>
  );
}
