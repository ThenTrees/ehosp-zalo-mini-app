import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { api } from "@/services";
import { AlertCircleIcon, ClockIcon, InfoIcon } from "@/components/icons";
import { Card, EmptyState } from "@/components/ui";
import { formatPrice } from "@/utils/format";
import type { VietQrPayload } from "@/types";

export default function InvoiceQrPage() {
  const { id } = useParams();
  const [payload, setPayload] = useState<VietQrPayload | null>(null);
  const [qrImage, setQrImage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;
    api
      .invoiceQr(Number(id))
      .then(async (data) => {
        if (cancel) return;
        setPayload(data);
        // Dựng ảnh QR ngay tại máy. Chuỗi thanh toán không đi qua dịch vụ nào
        // khác — đưa nó lên một API sinh ảnh bên ngoài là làm rò dữ liệu hoá
        // đơn của người bệnh cho bên thứ ba.
        const url = await QRCode.toDataURL(data.qrContent, {
          width: 480,
          margin: 1,
          errorCorrectionLevel: "M",
        });
        if (!cancel) setQrImage(url);
      })
      .catch((error) =>
        setError(
          error instanceof Error
            ? error.message
            : "Không lấy được mã thanh toán.",
        ),
      );
    return () => {
      cancel = true;
    };
  }, [id]);

  if (error) {
    return (
      <EmptyState
        icon={AlertCircleIcon}
        title="Không lấy được mã thanh toán"
        hint={error}
      />
    );
  }

  if (!payload) {
    return (
      <div className="space-y-3 p-4">
        <div className="h-72 animate-pulse rounded-md bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card className="text-center">
        <div className="text-sm text-ink-muted">Số tiền cần thanh toán</div>
        <div className="mt-1 text-2xl font-bold text-ink">
          {formatPrice(payload.amount)}
        </div>

        <div className="mt-4 flex justify-center">
          {qrImage ? (
            <img
              src={qrImage}
              alt="Mã QR thanh toán"
              className="h-60 w-60 rounded"
            />
          ) : (
            <div className="h-60 w-60 animate-pulse rounded bg-surface-sunken" />
          )}
        </div>

        <Countdown expiresAt={payload.expiresAt} />
      </Card>

      <div className="flex gap-3 rounded-md bg-surface-sunken p-4">
        <InfoIcon
          width={20}
          height={20}
          className="mt-0.5 shrink-0 text-primary-ink"
        />
        <p className="text-sm text-ink-muted">
          Đưa màn hình này cho nhân viên quầy thu ngân quét, hoặc quét bằng ứng
          dụng ngân hàng của bạn. Mã hết hạn thì quay lại để lấy mã mới.
        </p>
      </div>
    </div>
  );
}

/** Đồng hồ đếm ngược tới `expiresAt`, cập nhật mỗi giây. */
function Countdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)),
  );

  useEffect(() => {
    const tick = setInterval(() => {
      setRemaining(
        Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)),
      );
    }, 1000);
    return () => clearInterval(tick);
  }, [expiresAt]);

  if (remaining <= 0) {
    return (
      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-error-soft px-3 py-1.5 text-sm font-semibold text-error">
        <AlertCircleIcon width={16} height={16} />
        Mã đã hết hạn
      </div>
    );
  }

  return (
    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5 text-sm font-medium text-ink-muted">
      <ClockIcon width={16} height={16} />
      {remaining < 3600
        ? `Còn hiệu lực ${Math.floor(remaining / 60)}:${(remaining % 60)
            .toString()
            .padStart(2, "0")}`
        : `Có hiệu lực đến ${timeAndDate(expiresAt)}`}
    </div>
  );
}

/**
 * "14:30 ngày 24/08". Mã sống quá một giờ thì đồng hồ đếm ngược vô nghĩa —
 * mm:ss của một mã còn hạn tới cuối năm hiện ra thành "188032:03".
 */
function timeAndDate(iso: string) {
  const at = new Date(Date.parse(iso));
  const pad2 = (n: number) => n.toString().padStart(2, "0");
  return `${pad2(at.getHours())}:${pad2(at.getMinutes())} ngày ${pad2(
    at.getDate(),
  )}/${pad2(at.getMonth() + 1)}`;
}
