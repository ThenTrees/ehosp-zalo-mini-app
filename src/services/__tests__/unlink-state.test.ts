import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStore } from "jotai";
import type { PatientProfile } from "@/types";

const MEN = {
  patientId: 42,
  patientCode: "BN0000042",
  fullName: "Nguyễn Thị Lan",
  gender: "F",
  birthdate: "1988-04-11",
} as PatientProfile;

const CON = {
  patientId: 77,
  patientCode: "BN0000077",
  fullName: "Nguyễn Minh Khang",
  gender: "M",
  birthdate: "2019-10-02",
} as PatientProfile;

const h = vi.hoisted(() => ({
  getStorage: vi.fn(),
  setStorage: vi.fn(async () => undefined),
  removeStorage: vi.fn(async () => undefined),
  me: vi.fn(),
  unlink: vi.fn(async () => undefined),
  setSessionToken: vi.fn(),
}));

vi.mock("zmp-sdk", () => ({
  getStorage: h.getStorage,
  setStorage: h.setStorage,
  removeStorage: h.removeStorage,
}));

vi.mock("@/services", () => ({
  api: { me: h.me, unlink: h.unlink },
  setSessionToken: h.setSessionToken,
}));

import {
  activePatientIdState,
  hydrateSessionState,
  unlinkState,
} from "@/state";

/** Kho lưu trữ zmp-sdk đang giữ một phiên, hồ sơ đang xem là `activePatientId`. */
function coPhien(activePatientId: number) {
  h.getStorage.mockResolvedValue({
    patient_app_session: JSON.stringify({
      token: "phien-cua-chi-lan",
      activePatientId,
    }),
  });
}

/**
 * Máy chủ CỐ Ý chỉ thu hồi phiên khi hồ sơ vừa huỷ là hồ sơ CUỐI CÙNG:
 * `huyLienKet()` gọi `thuHoiTatCa()` chỉ khi `hoSoDuocPhep()` rỗng. Máy khách
 * phải theo đúng luật ấy.
 *
 * Lỗi này là mã chết cho tới 03/09/2026 vì lỗi 204 ở `http.ts` ném trước khi
 * tới dòng dọn phiên. Vá 204 xong nó sống dậy ngay, nên hai chỗ được sửa cùng
 * một lượt và ca thử dưới đây khoá lại phần hành vi.
 */
describe("unlinkState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.unlink.mockResolvedValue(undefined);
  });

  it("còn hồ sơ khác thì GIỮ phiên và chuyển sang hồ sơ còn lại", async () => {
    coPhien(42);
    h.me.mockResolvedValueOnce({ profiles: [MEN, CON] });
    h.me.mockResolvedValue({ profiles: [CON] });

    const store = createStore();
    await store.set(hydrateSessionState);
    expect(store.get(activePatientIdState)).toBe(42);

    await store.set(unlinkState, 42);

    expect(h.unlink).toHaveBeenCalledWith(42);
    // Phụ huynh huỷ một hồ sơ không được mất quyền xem hồ sơ còn lại: xoá phiên
    // ở đây là bắt họ chạy lại toàn bộ luồng Zalo + ngày sinh.
    expect(h.removeStorage).not.toHaveBeenCalled();
    expect(h.setSessionToken).not.toHaveBeenCalledWith(null);
    expect(store.get(activePatientIdState)).toBe(77);
  });

  it("huỷ hồ sơ CUỐI CÙNG thì mới xoá phiên", async () => {
    coPhien(42);
    h.me.mockResolvedValueOnce({ profiles: [MEN] });
    h.me.mockResolvedValue({ profiles: [] });

    const store = createStore();
    await store.set(hydrateSessionState);

    await store.set(unlinkState, 42);

    expect(h.removeStorage).toHaveBeenCalled();
    expect(h.setSessionToken).toHaveBeenCalledWith(null);
    expect(store.get(activePatientIdState)).toBeNull();
  });

  it("huỷ một hồ sơ KHÔNG phải hồ sơ đang xem thì không đổi hồ sơ đang xem", async () => {
    coPhien(42);
    h.me.mockResolvedValueOnce({ profiles: [MEN, CON] });
    h.me.mockResolvedValue({ profiles: [MEN] });

    const store = createStore();
    await store.set(hydrateSessionState);

    await store.set(unlinkState, 77);

    expect(h.removeStorage).not.toHaveBeenCalled();
    expect(store.get(activePatientIdState)).toBe(42);
  });

  /*
   * Máy chủ đã thu hồi liên kết THẬT rồi mới trả lỗi thì trạng thái máy khách
   * không cứu được ở đây — nhưng lỗi phải nổi lên tới nút bấm để nó kịp hiện
   * toast. `pages/profiles/index.tsx` bọc lời gọi này bằng try/catch chính vì
   * `ErrorBoundary` của react-router không bắt lỗi trong trình xử lý sự kiện.
   */
  it("lỗi từ máy chủ được ném tiếp cho trang, không nuốt", async () => {
    coPhien(42);
    h.me.mockResolvedValue({ profiles: [MEN, CON] });
    h.unlink.mockRejectedValue(new Error("Hồ sơ này chưa được liên kết."));

    const store = createStore();
    await store.set(hydrateSessionState);

    await expect(store.set(unlinkState, 42)).rejects.toThrow(
      "Hồ sơ này chưa được liên kết.",
    );
    expect(h.removeStorage).not.toHaveBeenCalled();
  });
});
