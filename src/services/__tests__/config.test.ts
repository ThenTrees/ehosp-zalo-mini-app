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

