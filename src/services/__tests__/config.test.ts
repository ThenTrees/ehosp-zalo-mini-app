import { describe, it, expect } from "vitest";
import { readRuntimeConfig } from "@/services/config";

describe("readRuntimeConfig", () => {
  it("đọc được base URL và cắt dấu gạch chéo thừa ở cuối", () => {
    const config = readRuntimeConfig({
      VITE_API_BASE_URL: "https://api.phongkham.vn/api/patient-app/",
      VITE_USE_FAKE: "false",
    });
    expect(config.apiBaseUrl).toBe("https://api.phongkham.vn/api/patient-app");
    expect(config.useFake).toBe(false);
  });

  it("bật chế độ giả khi VITE_USE_FAKE=true, không cần base URL", () => {
    const config = readRuntimeConfig({ VITE_USE_FAKE: "true" });
    expect(config.useFake).toBe(true);
    expect(config.apiBaseUrl).toBe("");
  });

  it("báo lỗi tiếng Việt khi gọi API thật mà thiếu base URL", () => {
    expect(() => readRuntimeConfig({ VITE_USE_FAKE: "false" })).toThrow(
      /Thiếu VITE_API_BASE_URL/,
    );
  });
});

/* ═════════ SỐ ĐIỆN THOẠI THAY CHO SDK ZALO (nước thứ ba) ═════════ */

describe("VITE_ZALO_PHONE_GIA", () => {
  const THAT = {
    VITE_USE_FAKE: "false",
    VITE_API_BASE_URL: "http://127.0.0.1:3000/api/patient-app",
  };

  it("nhận số hợp lệ ở chế độ thật, và KHÔNG đổi tầng dữ liệu", () => {
    const c = readRuntimeConfig({ ...THAT, VITE_ZALO_PHONE_GIA: "0908220101" });
    expect(c.soDienThoaiGia).toBe("0908220101");
    // Đây là điều phân biệt cờ này với chế độ `hybrid` đã bỏ: mọi tuyến VẪN THẬT.
    expect(c.useFake).toBe(false);
    expect(c.mode).toBe("real");
  });

  it("BỊ BỎ QUA ở bản dựng phát hành — chốt quan trọng nhất", () => {
    /*
     * Một bản phát hành mà mọi người bệnh cùng đăng nhập bằng một số viết cứng
     * là một sự cố, không phải một lỗi. Chốt này là lý do cờ tồn tại được.
     */
    const c = readRuntimeConfig(
      { ...THAT, VITE_ZALO_PHONE_GIA: "0908220101" },
      true,
    );
    expect(c.soDienThoaiGia).toBe("");
  });

  it("bị bỏ qua ở chế độ giả — ở đó SDK vốn đã không được gọi", () => {
    const c = readRuntimeConfig({
      VITE_USE_FAKE: "true",
      VITE_ZALO_PHONE_GIA: "0908220101",
    });
    expect(c.soDienThoaiGia).toBe("");
  });

  it("ném lỗi khi trị không phải số Việt Nam — chặn nhét token thật vào đây", () => {
    expect(() =>
      readRuntimeConfig({ ...THAT, VITE_ZALO_PHONE_GIA: "abc-token-xyz" }),
    ).toThrow(/không phải số điện thoại Việt Nam/);
  });

  it("rỗng khi không đặt — đường mặc định vẫn gọi SDK", () => {
    expect(readRuntimeConfig(THAT).soDienThoaiGia).toBe("");
  });
});
