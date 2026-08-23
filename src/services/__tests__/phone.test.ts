import { describe, it, expect, vi } from "vitest";

// vi.mock được hoist lên đầu tệp, nên factory của nó không thấy biến khai báo
// theo lối thường. vi.hoisted nâng khai báo này lên cùng tầng.
const { getPhoneNumber } = vi.hoisted(() => ({
  getPhoneNumber: vi.fn(async () => ({ token: "token-that" })),
}));

vi.mock("zmp-sdk", () => ({
  getPhoneNumber,
  getStorage: vi.fn(async () => ({})),
  setStorage: vi.fn(async () => undefined),
  removeStorage: vi.fn(async () => undefined),
}));

import { layTokenSoDienThoai } from "@/services/phone";

/**
 * Bộ test chạy với VITE_USE_FAKE=true (vitest.config.mts).
 *
 * Một bản demo dữ liệu giả không được phụ thuộc vào quyền số điện thoại của
 * Zalo: quyền đó cần cấu hình phía Zalo và có thể chưa được duyệt. Nếu màn hình
 * liên kết gọi SDK thật thì người xem demo mắc kẹt ngay ở bước đầu tiên và
 * không thấy được gì phía sau.
 */
describe("layTokenSoDienThoai — chế độ giả", () => {
  it("không gọi SDK của Zalo", async () => {
    getPhoneNumber.mockClear();

    await layTokenSoDienThoai();

    expect(getPhoneNumber).not.toHaveBeenCalled();
  });

  it("vẫn trả về một token không rỗng để luồng liên kết đi tiếp", async () => {
    const token = await layTokenSoDienThoai();

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });
});
