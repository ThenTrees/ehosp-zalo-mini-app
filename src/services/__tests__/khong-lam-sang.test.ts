import { describe, it, expect } from "vitest";
// `?raw` của Vite: nạp tệp thành chuỗi, không cần @types/node — thêm "node" vào
// tsconfig sẽ phơi biến toàn cục của Node ra mã chạy trong webview Zalo.
import typesSource from "../../types.d.ts?raw";

/**
 * Những từ này không được xuất hiện trong hợp đồng dữ liệu của mini app.
 * Spec §6.1 quy tắc 1 và tiêu chí nghiệm thu §10.
 */
const TU_CAM = [
  "diagnosis",
  "chandoan",
  "icd",
  "labresult",
  "testresult",
  "prescription",
  "drug",
  "medicine",
  "dosage",
];

describe("hợp đồng dữ liệu không chứa nội dung lâm sàng", () => {
  // Không có chốt này thì một chuỗi rỗng cũng làm mọi khẳng định bên dưới "qua".
  it("thực sự nạp được nội dung types.d.ts", () => {
    expect(typesSource.length).toBeGreaterThan(500);
    expect(typesSource).toContain("PatientProfile");
    expect(typesSource).toContain("AppNotification");
  });

  it("types.d.ts không khai báo trường lâm sàng nào", () => {
    const noiDung = typesSource.toLowerCase().replace(/[^a-z]/g, "");

    for (const tu of TU_CAM) {
      expect(noiDung).not.toContain(tu);
    }
  });
});
