import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

import { api } from "@/services";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MÃ QR CHECK-IN — chìa ra ở quầy thay vì đọc mã bằng miệng
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Thay ô chữ "HK2026000003" mà người bệnh phải đọc cho nhân viên nghe. Ba thứ
 * nó sửa: đọc nhầm một ký tự, nhân viên gõ lại mười hai ký tự, và người bệnh
 * nói giọng địa phương mà nhân viên nghe không rõ.
 *
 * VÌ SAO QR CHỨ KHÔNG PHẢI MÃ VẠCH MỘT CHIỀU. Mã vạch 1D đọc trên màn hình LCD
 * rất chập chờn: máy quét laser dựa vào phản xạ, còn màn hình thì tự phát sáng.
 * Máy quét 2D (loại chụp ảnh) đọc màn hình tốt, và mọi điện thoại đều hiện QR
 * rõ ở kích thước nhỏ. Nếu quầy còn dùng máy quét laser đời cũ thì phải đổi
 * cách — in mã ra giấy, hoặc nhập tay.
 *
 * ⚠ VÉ HẾT HẠN THÌ TỰ ĐÚC LẠI. 15 phút đủ để chìa mã rồi xếp hàng, nhưng người
 * bệnh có thể mở màn hình từ lúc còn ở nhà. Đếm ngược hiện ra để họ biết mã
 * còn sống, và hết hạn thì màn hình tự lấy mã mới — KHÔNG bắt họ hiểu chuyện
 * gì vừa xảy ra rồi tự bấm.
 */
export function MaCheckIn({
  henId,
  patientId,
}: {
  henId: number;
  patientId: number;
}) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [conLai, datConLai] = useState<number | null>(null);
  const [loi, datLoi] = useState<string | null>(null);

  const lay = useCallback(async () => {
    datLoi(null);
    try {
      const { ve, hanMs } = await api.veCheckIn({ id: henId, patientId });
      if (canvas.current) {
        /*
         * Vẽ vào canvas chứ không dựng data URL: một chuỗi base64 dài vài KB
         * nằm trong DOM là thứ lọt vào mọi bản chụp lỗi và mọi công cụ gỡ rối.
         * Canvas thì không.
         */
        await QRCode.toCanvas(canvas.current, ve, {
          width: 220,
          margin: 1,
          errorCorrectionLevel: "M",
        });
      }
      datConLai(Math.floor(hanMs / 1000));
    } catch (e) {
      datLoi(e instanceof Error ? e.message : "Không lấy được mã check-in.");
    }
  }, [henId, patientId]);

  useEffect(() => {
    void lay();
  }, [lay]);

  // Đếm ngược, và tự đúc lại khi về 0.
  useEffect(() => {
    if (conLai === null) return undefined;
    if (conLai <= 0) {
      void lay();
      return undefined;
    }
    const t = setTimeout(() => datConLai((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [conLai, lay]);

  if (loi) {
    return (
      <div className="rounded-md bg-error-soft px-3 py-2 text-sm text-error">
        {loi}
      </div>
    );
  }

  const phut = conLai === null ? null : Math.floor(conLai / 60);
  const giay = conLai === null ? null : conLai % 60;

  return (
    <div className="flex flex-col items-center">
      {/*
        Nền TRẮNG và không bo góc quanh mã: máy quét đọc theo tương phản, và một
        nền màu hay một góc bị cắt là lý do quét mãi không ăn mà không ai hiểu vì sao.
      */}
      <div className="rounded-md bg-white p-3">
        <canvas ref={canvas} aria-label="Mã QR check-in" />
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        Đưa màn hình này cho nhân viên tiếp đón quét.
      </p>
      {conLai !== null && (
        <p className="mt-1 text-xs tabular-nums text-ink-muted">
          Mã còn hiệu lực {phut}:{String(giay).padStart(2, "0")} — hết hạn sẽ tự
          làm mới.
        </p>
      )}
    </div>
  );
}
