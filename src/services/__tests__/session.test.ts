import { describe, it, expect, vi, beforeEach } from "vitest";

const store: Record<string, string> = {};

vi.mock("zmp-sdk", () => ({
  getStorage: vi.fn(async ({ keys }: { keys: string[] }) => {
    const out: Record<string, string> = {};
    keys.forEach((k) => {
      out[k] = store[k];
    });
    return out;
  }),
  setStorage: vi.fn(async ({ data }: { data: Record<string, string> }) => {
    Object.assign(store, data);
  }),
  removeStorage: vi.fn(async ({ keys }: { keys: string[] }) => {
    keys.forEach((k) => delete store[k]);
  }),
}));

import { loadSession, saveSession, clearSession } from "@/services/session";

describe("session", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it("trả về null khi chưa có phiên nào", async () => {
    expect(await loadSession()).toBeNull();
  });

  it("lưu rồi đọc lại được nguyên vẹn", async () => {
    await saveSession({ token: "abc123", activePatientId: 42 });
    expect(await loadSession()).toEqual({
      token: "abc123",
      activePatientId: 42,
    });
  });

  /*
   * Phiên lưu từ bản cũ còn khoá `notificationsSeenAt`. Nó phải bị bỏ qua chứ
   * không được làm hỏng cả phiên — nếu không, người dùng cập nhật mini app sẽ
   * bị đăng xuất và phải liên kết lại bằng số điện thoại.
   */
  it("phiên lưu từ bản cũ vẫn nạp được, khoá thừa bị bỏ qua", async () => {
    store["patient_app_session"] = JSON.stringify({
      token: "abc123",
      activePatientId: 42,
      notificationsSeenAt: "2026-08-22T03:00:00.000Z",
    });
    expect(await loadSession()).toEqual({
      token: "abc123",
      activePatientId: 42,
    });
  });

  it("xoá phiên thì đọc lại ra null", async () => {
    await saveSession({ token: "abc123", activePatientId: 42 });
    await clearSession();
    expect(await loadSession()).toBeNull();
  });

  it("trả về null khi dữ liệu lưu bị hỏng, không ném lỗi", async () => {
    store["patient_app_session"] = "{ không phải JSON";
    expect(await loadSession()).toBeNull();
  });
});
