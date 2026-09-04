import type { PatientProfile } from "@/types";

/**
 * Hồ sơ VỪA được liên kết trong một lần gọi `POST /link`.
 *
 * `LinkSuccess` không có trường nào chỉ ra hồ sơ mới; nó chỉ trả về cả danh
 * sách. Máy khách trước đây lấy `profiles[0]` và tin đó là hồ sơ vừa liên kết —
 * sai, vì `danhSachHoSo()` sắp `ORDER BY l.linked_at, l.id` TĂNG DẦN, nên
 * `[0]` là hồ sơ CŨ NHẤT. Phụ huynh đã có hồ sơ của mình, bấm "Liên kết thêm hồ
 * sơ người thân", liên kết xong hồ sơ của con thì app đặt hồ sơ MẸ làm hồ sơ
 * đang xem và về Trang chủ hiện dữ liệu của mẹ, kèm toast "thành công". Người
 * dùng vừa làm đúng thao tác cho con mà không thấy gì đổi.
 *
 * Sửa ở MÁY KHÁCH chứ không đổi `ORDER BY` của máy chủ: thứ tự ấy là hợp đồng
 * chung cho mọi bên gọi, còn ở đây máy khách đã biết dư một thứ máy chủ không
 * biết — danh sách hồ sơ TRƯỚC lần liên kết này. Hiệu của hai danh sách chính
 * là hồ sơ vừa thêm.
 *
 * Ba lối dự phòng, xếp theo mức chắc chắn giảm dần:
 * - đúng một hồ sơ mới  → chính nó;
 * - nhiều hồ sơ mới (danh sách "trước" đã cũ, ví dụ liên kết trên máy khác)
 *   → cái cuối, vì thứ tự tăng dần đưa hồ sơ mới nhất về cuối mảng;
 * - không hồ sơ nào mới (liên kết lại một hồ sơ đã có) → cũng lấy cái cuối,
 *   vẫn đúng hơn `[0]` và không bao giờ ném khi mảng rỗng.
 */
export function hoSoVuaLienKet(
  truoc: PatientProfile[],
  sau: PatientProfile[],
): PatientProfile | null {
  if (sau.length === 0) {
    return null;
  }

  const daBiet = new Set(truoc.map((p) => p.patientId));
  const moi = sau.filter((p) => !daBiet.has(p.patientId));

  return moi.length > 0 ? moi[moi.length - 1] : sau[sau.length - 1];
}
