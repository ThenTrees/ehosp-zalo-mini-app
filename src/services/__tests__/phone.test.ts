import { describe, it, expect, vi } from "vitest";

// vi.mock được hoist lên đầu tệp, nên factory của nó không thấy biến khai báo
// theo lối thường. vi.hoisted nâng khai báo này lên cùng tầng.
const { getPhoneNumber, getAccessToken } = vi.hoisted(() => ({
  getPhoneNumber: vi.fn(async () => ({ token: "token-that" })),
  getAccessToken: vi.fn(async () => "access-token-that"),
}));

vi.mock("zmp-sdk", () => ({
  getPhoneNumber,
  getAccessToken,
  getStorage: vi.fn(async () => ({})),
  setStorage: vi.fn(async () => undefined),
  removeStorage: vi.fn(async () => undefined),
}));

import { getPhoneToken, getUserAccessToken } from "@/services/phone";

/**
 * Bộ test chạy với VITE_USE_FAKE=true (vitest.config.mts).
 *
 * Một bản demo dữ liệu giả không được phụ thuộc vào quyền số điện thoại của
 * Zalo: quyền đó cần cấu hình phía Zalo và có thể chưa được duyệt. Nếu màn hình
 * liên kết gọi SDK thật thì người xem demo mắc kẹt ngay ở bước đầu tiên và
 * không thấy được gì phía sau.
 */
describe("getPhoneToken — chế độ giả", () => {
  it("không gọi SDK của Zalo", async () => {
    getPhoneNumber.mockClear();

    await getPhoneToken();

    expect(getPhoneNumber).not.toHaveBeenCalled();
  });

  it("vẫn trả về một token không rỗng để luồng liên kết đi tiếp", async () => {
    const token = await getPhoneToken();

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });
});

/**
 * Zalo cần HAI thứ để đổi mã ra số điện thoại, không phải một.
 *
 * `GET graph.zalo.me/v2.0/me/info` đòi ba header: `code` (mã của
 * getPhoneNumber), `secret_key` (bí mật, chỉ máy chủ giữ) và `access_token` —
 * token phiên của CHÍNH người dùng, lấy từ `getAccessToken()` phía client.
 *
 * Bỏ sót `access_token`, hoặc nhét app id vào đó, thì Zalo trả lỗi 452
 * "Session key invalid… incorrect format" — đo được trên máy thật ngày
 * 2026-09-01, và người bệnh chỉ thấy "Mã xác thực số điện thoại không hợp lệ
 * hoặc đã hết hạn."
 */
describe("getUserAccessToken — chế độ giả", () => {
  it("không gọi SDK của Zalo", async () => {
    getAccessToken.mockClear();

    await getUserAccessToken();

    expect(getAccessToken).not.toHaveBeenCalled();
  });

  it("vẫn trả về một token không rỗng để luồng liên kết đi tiếp", async () => {
    const token = await getUserAccessToken();

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });
});
