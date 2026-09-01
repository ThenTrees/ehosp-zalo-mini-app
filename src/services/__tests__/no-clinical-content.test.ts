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
const FORBIDDEN_WORDS = [
  "diagnosis",
  "chandoan",
  "icd",
  "labresult",
  "testresult",
  "drugname",
  "medicine",
  "dosage",
  "tenthuoc",
  "lieudung",
];

/** Trường được phép, theo đúng câu SELECT trong `patient-app/service.ts`. */
const ALLOWED_FIELDS: Record<string, string[]> = {
  VisitSummary: ["id", "visitCode", "visitDate", "status", "departmentId"],
  PrescriptionSummary: ["id", "code", "status", "issuedDate", "visitId"],
};

/** Lấy các tên trường khai trong một `interface` của tệp types. */
function fieldsOf(source: string, name: string): string[] {
  const body = new RegExp(`export interface ${name} \\{([\\s\\S]*?)\\n\\}`).exec(
    source,
  )?.[1];
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

  it("types.d.ts không khai báo trường lâm sàng nào", () => {
    const content = typesSource.toLowerCase().replace(/[^a-z]/g, "");

    for (const word of FORBIDDEN_WORDS) {
      expect(content).not.toContain(word);
    }
  });

  it("lượt khám và đơn thuốc chỉ có đúng các trường đã liệt kê trắng", () => {
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
