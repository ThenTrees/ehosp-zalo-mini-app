import { describe, it, expect, vi } from "vitest";
import { createStore } from "jotai";

vi.mock("zmp-sdk", () => ({
  getStorage: vi.fn(async () => ({})),
  setStorage: vi.fn(async () => undefined),
  removeStorage: vi.fn(async () => undefined),
  getUserInfo: vi.fn(async () => ({ userInfo: { name: "Người dùng thử" } })),
}));

import { departmentsState, appointmentsState } from "@/state";

describe("state", () => {
  it("departmentsState trả về danh sách khoa từ tầng dữ liệu", async () => {
    const store = createStore();
    const khoa = await store.get(departmentsState);
    expect(khoa.map((k) => k.name)).toContain("Khoa Nội");
  });

  it("appointmentsState tách riêng theo từng hồ sơ", async () => {
    expect(appointmentsState(101)).not.toBe(appointmentsState(102));
  });
});
