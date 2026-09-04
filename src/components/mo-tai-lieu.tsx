import { useState } from "react";

import { api } from "@/services";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NÚT MỞ TỆP TÀI LIỆU — đúc vé trước, rồi mới điều hướng
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * VÌ SAO KHÔNG CÒN LÀ MỘT THẺ `<a href>`. Phiên người bệnh đi bằng header
 * `X-Patient-Session`, mà một lượt ĐIỀU HƯỚNG không gửi được header tuỳ biến;
 * webview của Zalo cũng không dùng được cookie. Đo trên cụm thật ngày
 * 05/09/2026: `GET /api/patient-app/tai-lieu/1/tep` trả **401** — người bệnh
 * bấm "Mở bản PDF đã ký" và nhận một trang JSON báo hết phiên.
 *
 * Nên: gọi `veTaiLieu()` (lời gọi `fetch` bình thường, CÓ header) để đúc một vé
 * dùng-một-lần hạn 120 giây, rồi mở URL kèm vé đó.
 *
 * ⚠ CỬA SỔ PHẢI MỞ ĐỒNG BỘ, TRƯỚC `await`. Trình duyệt chỉ cho `window.open`
 * khi nó chạy TRỰC TIẾP trong lượt xử lý cú bấm; gọi sau một `await` là mất dấu
 * "do người dùng bấm" và bị chặn popup — trên webview thì im lặng, không có
 * thông báo nào. Nên mở một cửa sổ trống ngay, rồi gán `location` sau khi có vé.
 *
 * ⚠ KHÔNG dùng `blob:` như bề mặt nhân viên. System WebView của Android không
 * có bộ dựng PDF, và ở đó một URL http chạy được CHÍNH VÌ nó bàn giao sang ứng
 * dụng đọc PDF bên ngoài — mà `blob:` thì không bàn giao ra ngoài được.
 */
export function MoTaiLieu({
  id,
  patientId,
  className,
  children,
}: {
  id: number;
  patientId: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [dangMo, datDangMo] = useState(false);
  const [loi, datLoi] = useState<string | null>(null);

  const mo = async () => {
    if (dangMo) return;
    datLoi(null);
    // Mở TRƯỚC await — xem khối lý lẽ ở trên.
    const cua = window.open("", "_blank");
    datDangMo(true);
    try {
      const { ve } = await api.veTaiLieu({ id, patientId });
      const url = api.taiLieuUrl({ id, ve });
      if (cua) cua.location.href = url;
      else window.location.href = url; // popup bị chặn: đi thẳng, còn hơn không mở được
    } catch (e) {
      cua?.close();
      /*
       * Nói ra, đừng im. Ẩn lỗi đi làm người bệnh tưởng chức năng hỏng và gọi
       * lên quầy — đúng chuyện đã xảy ra ngày 2026-09-04 với một nút bị ẩn.
       */
      datLoi(e instanceof Error ? e.message : "Không mở được tài liệu.");
    } finally {
      datDangMo(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-end">
      <button type="button" onClick={mo} disabled={dangMo} className={className}>
        {dangMo ? "Đang mở…" : children}
      </button>
      {loi ? (
        <span role="alert" className="mt-1 text-xs text-danger">
          {loi}
        </span>
      ) : null}
    </span>
  );
}
