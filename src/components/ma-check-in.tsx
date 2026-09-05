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
  /*
   * ⚠ GIỮ MỐC HẾT HẠN, KHÔNG GIỮ SỐ GIÂY CÒN LẠI.
   *
   * Bản đầu đếm ngược bằng một chuỗi `setTimeout` trừ dần một biến. Trình duyệt
   * trong webview GIẢM NHỊP hoặc DỪNG HẲN bộ đếm giờ khi màn hình tắt hay app
   * lùi xuống nền — mà đó chính là lúc người bệnh bỏ điện thoại vào túi để xếp
   * hàng. Quay lại thì đồng hồ trên màn hình nói "còn 12 phút" trong khi vé đã
   * chết từ lâu, và nhân viên quét mãi không được.
   *
   * Giữ MỐC rồi so với `Date.now()` ở mỗi nhịp thì mọi lượt ngủ đều tự bù.
   */
  const [hetLuc, datHetLuc] = useState<number | null>(null);
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
      datHetLuc(Date.now() + hanMs);
    } catch (e) {
      datLoi(e instanceof Error ? e.message : "Không lấy được mã check-in.");
    }
  }, [henId, patientId]);

  useEffect(() => {
    void lay();
  }, [lay]);

  /*
   * Đếm ngược bằng cách SO VỚI ĐỒNG HỒ mỗi giây, và tự đúc lại khi hết hạn.
   * `setInterval` một cái duy nhất thay cho chuỗi `setTimeout` nối nhau: một
   * nhịp bị bỏ lỡ không làm lệch những nhịp sau.
   */
  useEffect(() => {
    if (hetLuc === null) return undefined;
    const nhip = () => {
      const con = Math.max(0, Math.round((hetLuc - Date.now()) / 1000));
      datConLai(con);
      if (con === 0) void lay();
    };
    nhip();
    const id = setInterval(nhip, 1000);
    return () => clearInterval(id);
  }, [hetLuc, lay]);

  if (loi) {
    /*
     * CÓ ĐƯỜNG RA. Bản đầu chỉ in câu lỗi rồi dừng — người bệnh đứng ở quầy,
     * mã không hiện, và cách duy nhất là thoát hẳn màn hình rồi vào lại. Một
     * nút bấm rẻ hơn nhiều so với một người quay ra hỏi nhân viên.
     */
    return (
      <div className="rounded-md bg-error-soft px-3 py-3 text-sm text-error">
        <p>{loi}</p>
        <button
          type="button"
          onClick={() => void lay()}
          className="mt-2 min-h-[44px] w-full rounded-md bg-error px-3 text-white"
        >
          Thử lại
        </button>
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
        {/*
          `role="img"` đi CÙNG `aria-label`: một <canvas> trần không có vai trò
          ngầm định nào, nên trình đọc màn hình bỏ qua cả nhãn. Thiếu nó thì
          người dùng VoiceOver không biết trên màn hình có mã gì.
        */}
        <canvas ref={canvas} role="img" aria-label="Mã QR check-in" />
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
