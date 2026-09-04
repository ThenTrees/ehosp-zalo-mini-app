import { describe, it, expect, vi } from "vitest";
import { createStore } from "jotai";

// `vi.mock` được kéo lên đầu tệp, nên biến dùng trong factory phải khai bằng
// `vi.hoisted` — khai bằng `const` thường sẽ chưa tồn tại lúc factory chạy.
const { removeStorage } = vi.hoisted(() => ({
  removeStorage: vi.fn(async () => undefined),
}));

vi.mock("zmp-sdk", () => ({
  getStorage: vi.fn(async () => ({})),
  setStorage: vi.fn(async () => undefined),
  removeStorage,
  getUserInfo: vi.fn(async () => ({ userInfo: { name: "Người dùng thử" } })),
}));

import {
  departmentsState,
  appointmentsState,
  queueState,
  nuot401,
  prescriptionsState,
  visitsState,
} from "@/state";
import { ApiError } from "@/services/http";

describe("state", () => {
  it("departmentsState trả về danh sách khoa từ tầng dữ liệu", async () => {
    const store = createStore();
    const departments = await store.get(departmentsState);
    expect(departments.map((k) => k.name)).toContain("Khoa Nội");
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
    await expect(store.get(visitsState(null))).resolves.toEqual([]);
    await expect(store.get(prescriptionsState(null))).resolves.toEqual([]);
    await expect(store.get(queueState(null))).resolves.toBeNull();
  });
});

/**
 * `nuot401` là lớp mà MỌI atom dữ liệu đi qua. Ranh giới của nó phải chính xác:
 * nuốt rộng hơn 401 là nguỵ trang sự cố máy chủ thành "bạn chưa có dữ liệu
 * nào"; nuốt hẹp hơn là để một phiên hết hạn giữa chừng ném người bệnh vào màn
 * hình lỗi thay vì đưa họ về lời mời liên kết.
 */
describe("nuot401", () => {
  it("trả thẳng kết quả khi không có lỗi", async () => {
    await expect(nuot401([], async () => [{ id: 1 }])).resolves.toEqual([
      { id: 1 },
    ]);
  });

  it("401 thành giá trị dự phòng và dọn luôn phiên đã lưu", async () => {
    removeStorage.mockClear();

    await expect(
      nuot401<number[]>([], async () => {
        throw new ApiError(401, "Phiên đã hết hạn. Vui lòng liên kết lại.");
      }),
    ).resolves.toEqual([]);
    expect(removeStorage).toHaveBeenCalled();
  });

  it("giá trị dự phòng không nhất thiết là mảng", async () => {
    await expect(
      nuot401<number | null>(null, async () => {
        throw new ApiError(401, "Phiên đã hết hạn.");
      }),
    ).resolves.toBeNull();
  });

  /*
   * Chốt của mục CHẶN ngày 03/09/2026: tuyến `/invoices` bị rút, máy chủ trả
   * 404 "Không có đường dẫn GET /api/patient-app/invoices". Nếu `nuot401` nuốt
   * cả 404 thì màn hình hiện rỗng và không ai biết một tuyến đã biến mất — lỗi
   * đó phải nổi lên để vách ngăn của route/thẻ bắt và báo.
   */
  it("404 của một tuyến đã bị rút vẫn nổi lên, không bị nuốt", async () => {
    await expect(
      nuot401([], async () => {
        throw new ApiError(
          404,
          "Không có đường dẫn GET /api/patient-app/invoices",
        );
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("lỗi không phải ApiError cũng nổi lên", async () => {
    await expect(
      nuot401([], async () => {
        throw new TypeError("Failed to fetch");
      }),
    ).rejects.toBeInstanceOf(TypeError);
  });
});
