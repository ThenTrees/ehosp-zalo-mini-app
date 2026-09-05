import { describe, expect, it } from "vitest";

import {
  docBuaAn,
  gomNhomNhac,
  nhacDuoc,
  soNgayDeNghi,
} from "@/utils/lich-uong-thuoc";
import type { ThuocDaKe } from "@/types";

const thuoc = (p: Partial<ThuocDaKe>): ThuocDaKe => ({
  ten: "Paracetamol",
  tenThuongMai: null,
  hamLuong: "500mg",
  duongDung: null,
  soLuong: 9,
  donVi: "Viên",
  lieu: "1 viên",
  soLan: "Sáng 1, Trưa 1, Tối 1",
  soNgay: 3,
  loiDan: "Uống sau ăn",
  lieuSang: 1,
  lieuTrua: 1,
  lieuChieu: null,
  lieuToi: 1,
  duongDungThat: "Uống",
  ...p,
});

/*
 * Nhắc sai liều không phải một tiện ích hỏng, nó là một việc nguy hiểm. Nhóm
 * phép thử này canh đúng những chỗ hàm KHÔNG được tự quyết.
 */
describe("chỉ nhắc thuốc UỐNG", () => {
  it("nhận đường uống", () => {
    expect(nhacDuoc(thuoc({ duongDungThat: "Uống" }))).toBe(true);
    expect(nhacDuoc(thuoc({ duongDungThat: " uống " }))).toBe(true);
  });

  it("TỪ CHỐI mọi đường khác — nhắc uống một tuýp bôi là sai kiểu nguy hiểm", () => {
    for (const d of ["Bôi ngoài da", "Tiêm bắp", "Nhỏ mắt", "Đặt hậu môn", "Xịt"]) {
      expect(nhacDuoc(thuoc({ duongDungThat: d })), d).toBe(false);
    }
  });

  it("KHÔNG rõ đường dùng thì KHÔNG nhắc — im lặng an toàn hơn đoán", () => {
    expect(nhacDuoc(thuoc({ duongDungThat: null }))).toBe(false);
    expect(nhacDuoc(thuoc({ duongDungThat: "" }))).toBe(false);
  });
});

describe("đọc trước/sau ăn từ lời dặn", () => {
  it("đọc được hai dạng thường gặp", () => {
    expect(docBuaAn("Uống sau ăn")).toBe("SAU_AN");
    expect(docBuaAn("Uống trước ăn 30 phút")).toBe("TRUOC_AN");
    expect(docBuaAn("uống trước khi ăn")).toBe("TRUOC_AN");
    expect(docBuaAn("Uống sau khi an")).toBe("SAU_AN");
  });

  /*
   * Có CẢ HAI thì không chọn bừa. Một lời nhắc "uống trước ăn" cho thuốc phải
   * uống sau ăn còn tệ hơn một lời nhắc không nói gì.
   */
  it("có cả hai thì trả KHONG_RO, không chọn bừa", () => {
    expect(docBuaAn("Trước ăn sáng, sau ăn tối")).toBe("KHONG_RO");
  });

  it("không nhắc gì tới bữa ăn thì KHONG_RO", () => {
    expect(docBuaAn(null)).toBe("KHONG_RO");
    expect(docBuaAn("Uống nhiều nước")).toBe("KHONG_RO");
  });
});

describe("gom nhóm nhắc", () => {
  it("gom theo buổi, dùng SỐ chứ không parse chuỗi soLan", () => {
    // `soLan` cố ý nói SAI để chứng minh hàm không đọc nó.
    const n = gomNhomNhac([
      thuoc({ soLan: "CHUỖI NÀY SAI HOÀN TOÀN", lieuSang: 2, lieuTrua: null,
              lieuChieu: null, lieuToi: 1 }),
    ]);
    expect(n.map((x) => x.buoi)).toEqual(["SANG", "TOI"]);
    expect(n[0].thuoc[0].lieu).toBe(2);
  });

  /*
   * Hai thuốc cùng buổi sáng nhưng một trước ăn một sau ăn là HAI lời nhắc ở
   * hai giờ khác nhau. Gộp chúng là làm hỏng đúng thông tin bác sĩ đã ghi.
   */
  it("TÁCH theo bữa ăn, không gộp chung một buổi", () => {
    const n = gomNhomNhac([
      thuoc({ ten: "A", loiDan: "Uống trước ăn", lieuSang: 1, lieuTrua: null,
              lieuChieu: null, lieuToi: null }),
      thuoc({ ten: "B", loiDan: "Uống sau ăn", lieuSang: 1, lieuTrua: null,
              lieuChieu: null, lieuToi: null }),
    ]);
    expect(n).toHaveLength(2);
    expect(n.map((x) => x.bua).sort()).toEqual(["SAU_AN", "TRUOC_AN"]);
  });

  it("bỏ qua liều 0 và null", () => {
    const n = gomNhomNhac([
      thuoc({ lieuSang: 0, lieuTrua: null, lieuChieu: null, lieuToi: 1 }),
    ]);
    expect(n.map((x) => x.buoi)).toEqual(["TOI"]);
  });

  it("thuốc không uống được thì không vào nhóm nào", () => {
    expect(gomNhomNhac([thuoc({ duongDungThat: "Bôi ngoài da" })])).toEqual([]);
  });
});

describe("số ngày đề nghị", () => {
  /*
   * Lấy MAX chứ không MIN: nhắc thiếu ngày thì người bệnh bỏ thuốc giữa chừng
   * — đúng cái hại mà "uống đủ liều đủ ngày" nhắm tới. Thừa thì họ tắt nhắc.
   */
  it("theo thuốc DÀI NGÀY NHẤT", () => {
    expect(soNgayDeNghi([thuoc({ soNgay: 3 }), thuoc({ soNgay: 7 })])).toBe(7);
  });

  it("không thuốc nào ghi số ngày thì trả null — màn hình phải HỎI", () => {
    expect(soNgayDeNghi([thuoc({ soNgay: null })])).toBeNull();
  });

  it("không tính thuốc không uống được", () => {
    expect(soNgayDeNghi([thuoc({ soNgay: 30, duongDungThat: "Bôi ngoài da" })]))
      .toBeNull();
  });
});
