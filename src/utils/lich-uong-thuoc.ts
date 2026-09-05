import type { ThuocDaKe } from "@/types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DỰNG LỊCH UỐNG THUỐC TỪ ĐƠN — và những chỗ CỐ Ý KHÔNG tự quyết
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Nhắc sai liều không phải một tiện ích hỏng, nó là một việc nguy hiểm. Nên
 * chỗ này chia đôi rất rõ:
 *
 *   MÁY LÀM  — gom thuốc vào bốn buổi theo BỐN CỘT SỐ của đơn (`lieuSang`…),
 *              và đề nghị số ngày theo `soNgay` của thuốc dài ngày nhất.
 *   NGƯỜI LÀM — chọn GIỜ cho từng buổi, sửa số ngày, và nhìn tận mắt danh sách
 *              thuốc trong mỗi buổi trước khi bật nhắc.
 *
 * Máy không bao giờ tự bật nhắc. Người bệnh phải bấm, và lúc bấm họ đã đọc
 * đúng thứ họ sắp được nhắc.
 *
 * ⚠ ĐỌC SỐ, KHÔNG PARSE CHUỖI `soLan`. Chuỗi "Sáng 1, Trưa 1, Tối 1" là bản
 * DẪN XUẤT máy chủ tự sinh từ chính bốn cột số ấy. Parse nó là dựng nguồn sự
 * thật thứ hai, và hai nguồn sẽ lệch nhau đúng vào hôm ai đó đổi cách sinh
 * chuỗi — mà lệch ở đây nghĩa là nhắc sai buổi.
 */

export type MaBuoi = "SANG" | "TRUA" | "CHIEU" | "TOI";

export const TEN_BUOI: Record<MaBuoi, string> = {
  SANG: "Sáng",
  TRUA: "Trưa",
  CHIEU: "Chiều",
  TOI: "Tối",
};

/** Giờ gợi ý ban đầu. Người bệnh đổi được — đây chỉ là điểm xuất phát. */
export const GIO_GOI_Y: Record<MaBuoi, string> = {
  SANG: "07:00",
  TRUA: "11:30",
  CHIEU: "15:00",
  TOI: "19:00",
};

export type BuaAn = "TRUOC_AN" | "SAU_AN" | "KHONG_RO";

export const TEN_BUA_AN: Record<BuaAn, string> = {
  TRUOC_AN: "Trước ăn",
  SAU_AN: "Sau ăn",
  KHONG_RO: "Không ghi rõ",
};

/**
 * Đọc "trước ăn / sau ăn" từ lời dặn.
 *
 * ⚠ ĐÂY LÀ CHỖ DUY NHẤT CỦA TỆP NÀY ĐỌC CHỮ TỰ DO, và nó chấp nhận được vì hai
 * lẽ: cơ sở dữ liệu KHÔNG có cột nào ghi việc này (đo trên lược đồ
 * `emr_prescription_item`), và kết quả được BÀY RA cho người bệnh xem trước
 * khi họ bật nhắc — họ là lớp kiểm cuối, không phải hàm này.
 *
 * Không đoán khi không chắc: trả `KHONG_RO` và để màn hình nói "không ghi rõ"
 * thay vì bịa ra một trong hai. Một lời nhắc "uống trước ăn" cho thuốc phải
 * uống sau ăn còn tệ hơn một lời nhắc không nói gì.
 */
export function docBuaAn(loiDan: string | null): BuaAn {
  const s = (loiDan ?? "").toLowerCase();
  const truoc = /tr(ướ|uo)c\s*(khi\s*)?(ăn|an)/.test(s);
  const sau = /sau\s*(khi\s*)?(ăn|an)/.test(s);
  // Có cả hai (ví dụ "trước ăn sáng, sau ăn tối") thì KHÔNG chọn bừa.
  if (truoc && sau) return "KHONG_RO";
  if (truoc) return "TRUOC_AN";
  if (sau) return "SAU_AN";
  return "KHONG_RO";
}

/**
 * Thuốc này có nhắc uống được không.
 *
 * `duongDungThat` là cột `route`. Chỉ nhận đường UỐNG: nhắc "uống" một tuýp
 * thuốc bôi hay một ống tiêm là sai kiểu nguy hiểm. Không rõ đường dùng thì
 * cũng KHÔNG nhắc — im lặng an toàn hơn đoán.
 */
export const nhacDuoc = (t: ThuocDaKe): boolean =>
  /^u(ố|o)ng$/i.test((t.duongDungThat ?? "").trim());

export interface NhomNhac {
  buoi: MaBuoi;
  bua: BuaAn;
  thuoc: { ten: string; lieu: number; donVi: string | null }[];
}

const LIEU_THEO_BUOI: Record<MaBuoi, (t: ThuocDaKe) => number | null> = {
  SANG: (t) => t.lieuSang,
  TRUA: (t) => t.lieuTrua,
  CHIEU: (t) => t.lieuChieu,
  TOI: (t) => t.lieuToi,
};

/**
 * Gom thuốc thành các nhóm (buổi × bữa ăn).
 *
 * Tách theo BỮA ĂN chứ không chỉ theo buổi: hai thuốc cùng uống buổi sáng
 * nhưng một trước ăn một sau ăn là HAI lời nhắc ở hai giờ khác nhau. Gộp
 * chúng vào một dòng là làm hỏng đúng cái thông tin bác sĩ đã ghi.
 */
export function gomNhomNhac(thuoc: ThuocDaKe[]): NhomNhac[] {
  const map = new Map<string, NhomNhac>();
  for (const t of thuoc) {
    if (!nhacDuoc(t)) continue;
    const bua = docBuaAn(t.loiDan);
    for (const buoi of ["SANG", "TRUA", "CHIEU", "TOI"] as MaBuoi[]) {
      const lieu = LIEU_THEO_BUOI[buoi](t);
      if (lieu === null || lieu <= 0) continue;
      const khoa = `${buoi}|${bua}`;
      const nhom = map.get(khoa) ?? { buoi, bua, thuoc: [] };
      nhom.thuoc.push({ ten: t.ten, lieu, donVi: t.donVi });
      map.set(khoa, nhom);
    }
  }
  const thuTu: MaBuoi[] = ["SANG", "TRUA", "CHIEU", "TOI"];
  return [...map.values()].sort(
    (a, b) =>
      thuTu.indexOf(a.buoi) - thuTu.indexOf(b.buoi) ||
      a.bua.localeCompare(b.bua),
  );
}

/**
 * Số ngày đề nghị: theo thuốc DÀI NGÀY NHẤT trong đơn.
 *
 * Lấy max chứ không min: nhắc thiếu ngày thì người bệnh bỏ thuốc giữa chừng —
 * đúng cái hại mà "uống đủ liều đủ ngày" trong lời dặn nhắm tới. Thừa vài ngày
 * thì họ tắt nhắc, một thao tác.
 *
 * `null` khi không thuốc nào ghi số ngày — lúc ấy màn hình phải HỎI, không tự
 * điền một con số nào.
 */
export function soNgayDeNghi(thuoc: ThuocDaKe[]): number | null {
  const ds = thuoc
    .filter(nhacDuoc)
    .map((t) => t.soNgay)
    .filter((n): n is number => typeof n === "number" && n > 0);
  return ds.length ? Math.max(...ds) : null;
}
