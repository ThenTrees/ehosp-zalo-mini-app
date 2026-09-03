import { describe, it, expect } from "vitest";
import { hoSoVuaLienKet } from "@/utils/link-target";
import type { PatientProfile } from "@/types";

function hoSo(patientId: number, fullName: string): PatientProfile {
  return {
    patientId,
    patientCode: `BN${String(patientId).padStart(7, "0")}`,
    fullName,
    gender: "U",
    birthdate: "1990-01-01",
  };
}

const MEN = hoSo(42, "Nguyễn Thị Lan");
const CON = hoSo(77, "Nguyễn Minh Khang");
const BA = hoSo(9, "Nguyễn Văn Bảy");

/**
 * `danhSachHoSo()` của máy chủ sắp `ORDER BY l.linked_at, l.id` TĂNG DẦN, nên
 * `profiles[0]` là hồ sơ CŨ NHẤT — không phải hồ sơ vừa liên kết. Máy khách
 * từng tin ngược lại và đặt sai hồ sơ đang xem sau mỗi lần "Liên kết thêm hồ sơ
 * người thân".
 */
describe("hoSoVuaLienKet", () => {
  it("lần liên kết đầu tiên: hồ sơ duy nhất chính là hồ sơ vừa liên kết", () => {
    expect(hoSoVuaLienKet([], [MEN])).toEqual(MEN);
  });

  it("liên kết thêm hồ sơ con: chọn CON chứ không phải MẸ ở đầu mảng", () => {
    // Đây là cảnh hỏng thật: phụ huynh liên kết xong hồ sơ của con mà app về
    // Trang chủ hiện dữ liệu của mẹ, kèm toast "thành công".
    expect(hoSoVuaLienKet([MEN], [MEN, CON])).toEqual(CON);
    expect(hoSoVuaLienKet([MEN], [MEN, CON])).not.toEqual(MEN);
  });

  it("nhiều hồ sơ mới cùng lúc thì lấy hồ sơ mới nhất, tức cuối mảng", () => {
    expect(hoSoVuaLienKet([BA], [BA, MEN, CON])).toEqual(CON);
  });

  it("liên kết lại một hồ sơ đã có thì lấy cuối mảng, không lấy đầu mảng", () => {
    expect(hoSoVuaLienKet([MEN, CON], [MEN, CON])).toEqual(CON);
  });

  it("mảng rỗng trả null chứ không ném TypeError", () => {
    expect(hoSoVuaLienKet([MEN], [])).toBeNull();
  });
});
