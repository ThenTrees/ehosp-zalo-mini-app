import { describe, it, expect, vi } from "vitest";
import { createStore } from "jotai";

vi.mock("zmp-sdk", () => ({
  getStorage: vi.fn(async () => ({})),
  setStorage: vi.fn(async () => undefined),
  removeStorage: vi.fn(async () => undefined),
  getUserInfo: vi.fn(async () => ({ userInfo: { name: "Người dùng thử" } })),
}));

import {
  departmentsState,
  appointmentsState,
  queueState,
  invoicesState,
  notificationsState,
} from "@/state";

describe("state", () => {
  it("departmentsState trả về danh sách khoa từ tầng dữ liệu", async () => {
    const store = createStore();
    const khoa = await store.get(departmentsState);
    expect(khoa.map((k) => k.name)).toContain("Khoa Nội");
  });

  it("appointmentsState tách riêng theo từng hồ sơ", async () => {
    expect(appointmentsState(101)).not.toBe(appointmentsState(102));
  });

  /**
   * Hồi quy cho lỗi "Vui lòng liên kết tài khoản trước." ngày 2026-08-22.
   *
   * Trang đọc atom bằng `patientId ?? 0`, tức bịa ra một mã bệnh nhân không
   * thuộc về ai rồi đi hỏi dữ liệu của mã đó. Hook không đặt điều kiện được
   * nên guard "chưa liên kết" của trang luôn chạy sau, quá muộn.
   *
   * Khi chưa chọn hồ sơ, atom phải trả về rỗng chứ không được gọi API.
   */
  it("không gọi API khi chưa chọn hồ sơ nào", async () => {
    const store = createStore();

    await expect(store.get(appointmentsState(null))).resolves.toEqual([]);
    await expect(store.get(invoicesState(null))).resolves.toEqual([]);
    await expect(store.get(notificationsState(null))).resolves.toEqual([]);
    await expect(store.get(queueState(null))).resolves.toBeNull();
  });
});
