import { describe, it, expect } from "vitest";
// `?raw` của Vite: nạp tệp thành chuỗi, không cần @types/node — thêm "node" vào
// tsconfig sẽ phơi biến toàn cục của Node ra mã chạy trong webview Zalo.
import typesSource from "../../types.d.ts?raw";

/**
 * Ràng buộc quan trọng nhất của dự án, biến thành một phép thử chạy được:
 * hợp đồng dữ liệu của mini app không được mang nội dung lâm sàng. Spec §6.1
 * quy tắc 1 và tiêu chí nghiệm thu §10.
 *
 * Từ "prescription" KHÔNG còn nằm trong danh sách cấm từ 2026-08-30. Hợp đồng
 * nay có `PrescriptionSummary` — một hình dạng chỉ mang mã đơn, ngày kê và
 * trạng thái phát thuốc. Cấm theo tên kiểu dữ liệu là cấm nhầm chỗ: thứ phải
 * chặn là TÊN THUỐC và LIỀU DÙNG, không phải chữ "đơn thuốc". Vì vậy phép thử
 * thứ hai bên dưới liệt kê trắng đúng các trường được phép, chặt hơn hẳn một
 * danh sách từ cấm.
 */
/*
 * ⚠ DANH SÁCH TỪ CẤM ĐÃ BỎ HẲN NGÀY 2026-09-03, VÀ ĐÂY LÀ LÝ DO.
 *
 * Chủ phòng khám quyết cho người bệnh xem toàn bộ bệnh sử của CHÍNH MÌNH trong
 * app — chẩn đoán, đơn thuốc có tên và liều, kết quả xét nghiệm, bảng kê. Đó là
 * quyền của họ theo Điều 10 Luật KCB 15/2023, nên đây là lựa chọn về NƠI cung
 * cấp chứ không phải một lần nới lỏng.
 *
 * Cấm theo TỪ vì thế hết nghĩa: "diagnosis" và "drugname" nay là những thứ hợp
 * đồng PHẢI có. Nhưng phép thử KHÔNG bị xoá, vì thứ nó thật sự canh chưa bao
 * giờ là mấy cái từ — mà là "hợp đồng chỉ mang đúng những trường đã được ai đó
 * quyết". Danh sách trắng bên dưới làm đúng việc ấy, và chặt hơn: thêm một
 * trường mới vào `types.d.ts` mà không sửa danh sách là phép thử đỏ ngay.
 *
 * MỘT THỨ VẪN CẤM TUYỆT ĐỐI, và nó nằm ở `KHONG_BAO_GIO`: ghi chú nội bộ của
 * nhân viên. Bệnh sử là của người bệnh; lời bác sĩ ghi cho đồng nghiệp đọc thì
 * không, và trộn hai thứ ấy vào một màn hình là chuyện không rút lại được.
 */
const KHONG_BAO_GIO = [
  "ghichunoibo",
  "internalnote",
  "staffnote",
  "nhanxetnoibo",
];

/**
 * Trường được phép, theo đúng câu SELECT trong `patient-app/service.ts` và hai
 * tuyến nội bộ `ketQuaNoiBo.ts` / `bangKeNoiBo.ts`.
 *
 * Danh sách này là HỢP ĐỒNG, không phải ảnh chụp. Thêm một trường vào
 * `types.d.ts` mà không thêm vào đây thì phép thử đỏ — và đó là lúc người sửa
 * phải dừng lại tự hỏi trường ấy có đáng nằm trên màn hình người bệnh không.
 */
const ALLOWED_FIELDS: Record<string, string[]> = {
  VisitSummary: [
    "id",
    "visitCode",
    "visitDate",
    "status",
    "departmentId",
    "chanDoanChinh",
  ],
  TaiLieuDaKy: ["id", "loai", "banSo", "tenHienThi", "soByte"],
  PrescriptionSummary: ["id", "code", "status", "issuedDate", "visitId"],
  ChanDoan: ["ma", "ten", "chinh"],
  ThuocDaKe: [
    "ten",
    "tenThuongMai",
    "hamLuong",
    "duongDung",
    "soLuong",
    "donVi",
    "lieu",
    "soLan",
    "soNgay",
    "loiDan",
  ],
  DonThuocChiTiet: ["code", "issuedDate", "status", "thuoc", "taiLieuId"],
  ChiSoXetNghiem: [
    "ma",
    "ten",
    "tri",
    "donVi",
    "thapNhat",
    "caoNhat",
    "khoangChu",
    "co",
    "ghiChu",
  ],
  PhieuXetNghiem: ["accessionNo", "serviceName", "ketQuaLuc", "chiSo"],
  ChiTietLuotKham: [
    "visitId",
    "visitCode",
    "visitDate",
    "status",
    "departmentName",
    "chanDoan",
    /*
     * THÊM 2026-09-05, và ba trường này khai có chủ ý chứ không phải cho xanh:
     *
     * · `sinhHieu` — số đo của chính người bệnh trong lần khám của họ. Cùng
     *   hạng với chẩn đoán và đơn thuốc, thứ đã được quyết cho xem từ 03/09.
     *   Màn hình hiện SỐ THÔ, không tô màu, không so với khoảng bình thường:
     *   một nhãn "cao" do phần mềm gắn là một chẩn đoán mà phần mềm không đủ
     *   dữ kiện để đưa ra.
     * · `loiDan` — cột `advice`, thứ bác sĩ viết ĐỂ người bệnh đọc. Trước đây
     *   chỉ có trên tờ giấy in, và đó là tờ hay mất nhất.
     * · `ngayTaiKham` — cột `recheck_date`.
     *
     * KHÔNG lấy ba cột còn lại của cùng bảng `emr_visit_clinical`:
     * `clinical_symptoms` (ghi chép thô của buồng khám, viết cho đồng nghiệp —
     * đúng hạng `KHONG_BAO_GIO` ở trên), `diagnosis_provisional` (chẩn đoán SƠ
     * BỘ; người bệnh đọc nó như kết luận, và một dòng đã bị bỏ sau xét nghiệm
     * vẫn ở lại trong đầu họ), và `examined_by` (danh tính nhân sự).
     */
    "sinhHieu",
    "loiDan",
    "ngayTaiKham",
    "donThuoc",
    "xetNghiem",
    "bangKe",
    "taiLieu",
  ],
};

/** Lấy các tên trường khai trong một `interface` của tệp types. */
function fieldsOf(source: string, name: string): string[] {
  const body = new RegExp(
    `export interface ${name} \\{([\\s\\S]*?)\\n\\}`,
  ).exec(source)?.[1];
  if (body === undefined) {
    throw new Error(`Không tìm thấy interface ${name} trong types.d.ts`);
  }
  const re = /^\s{2}(\w+)\??:/gm;
  const names: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    names.push(match[1]);
  }
  return names;
}

describe("hợp đồng dữ liệu không chứa nội dung lâm sàng", () => {
  // Không có chốt này thì một chuỗi rỗng cũng làm mọi khẳng định bên dưới "qua".
  it("thực sự nạp được nội dung types.d.ts", () => {
    expect(typesSource.length).toBeGreaterThan(500);
    expect(typesSource).toContain("PatientProfile");
    expect(typesSource).toContain("VisitSummary");
  });

  it("không bao giờ mang ghi chú nội bộ của nhân viên", () => {
    const content = typesSource.toLowerCase().replace(/[^a-z]/g, "");

    for (const word of KHONG_BAO_GIO) {
      expect(content).not.toContain(word);
    }
  });

  it("mọi kiểu dữ liệu lâm sàng chỉ có đúng các trường đã liệt kê trắng", () => {
    for (const [name, allowed] of Object.entries(ALLOWED_FIELDS)) {
      expect(fieldsOf(typesSource, name).sort()).toEqual([...allowed].sort());
    }
  });

  /**
   * Đơn nháp là thứ bác sĩ đang gõ dở. Máy chủ lọc chúng ra
   * (`tomTatDonThuoc()`), nên kiểu trạng thái ở đây cũng không được có DRAFT —
   * để cái tên ấy nằm lại là mời người sau viết một nhánh giao diện cho một
   * trạng thái không bao giờ tới.
   */
  it("trạng thái đơn thuốc không có DRAFT", () => {
    const body = /export type PrescriptionStatus =([\s\S]*?);/.exec(
      typesSource,
    )?.[1];
    expect(body).toBeTruthy();
    expect(body).not.toContain("DRAFT");
  });
});
