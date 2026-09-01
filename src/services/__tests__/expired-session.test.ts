import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStore } from "jotai";
import { ApiError } from "@/services/http";

const STORAGE_KEY = "patient_app_session";

/**
 * Hồi quy cho màn hình trắng ngày 2026-09-01.
 *
 * Người bệnh chưa liên kết mở app: `/me` trả 401, `http.ts` ném `ApiError`,
 * lỗi thoát ra khỏi atom bất đồng bộ và error boundary của React Router nuốt
 * cả cây — trắng màn hình. Trong khi `HomePage` đã có sẵn màn "Chào mừng bạn"
 * cho đúng tình huống `profiles.length === 0` mà không bao giờ chạy tới.
 *
 * Tầng giả trả `{ profiles: [] }` khi chưa liên kết còn máy chủ thật trả 401:
 * cùng loại lệch hợp đồng mà `doi-chieu-that.test.ts` canh, nhưng tuyến `/me`
 * lúc chưa có phiên thì không bộ nào phủ.
 */
const h = vi.hoisted(() => {
  const state = {
    token: null as string | null,
    tokenAtMeCall: [] as (string | null)[],
    meError: null as unknown,
    storage: null as string | null,
  };
  return {
    state,
    setSessionToken: vi.fn((token: string | null) => {
      state.token = token;
    }),
    me: vi.fn(async () => {
      state.tokenAtMeCall.push(state.token);
      if (state.meError) {
        throw state.meError;
      }
      return { profiles: [{ patientId: 101 }] };
    }),
    removeStorage: vi.fn(async () => {
      state.storage = null;
    }),
  };
});

vi.mock("zmp-sdk", () => ({
  getStorage: vi.fn(async () =>
    h.state.storage === null ? {} : { [STORAGE_KEY]: h.state.storage },
  ),
  setStorage: vi.fn(async () => undefined),
  removeStorage: h.removeStorage,
}));

vi.mock("@/services", () => ({
  api: { me: h.me },
  setSessionToken: h.setSessionToken,
}));

import {
  activePatientIdState,
  hydrateSessionState,
  profilesState,
} from "@/state";

beforeEach(() => {
  h.state.token = null;
  h.state.tokenAtMeCall = [];
  h.state.meError = null;
  h.state.storage = null;
  h.me.mockClear();
  h.removeStorage.mockClear();
});

describe("profilesState — phiên không hợp lệ", () => {
  it("401 trên /me trả về danh sách rỗng chứ không ném lỗi", async () => {
    h.state.meError = new ApiError(
      401,
      "Phiên đã hết hạn. Vui lòng liên kết lại.",
    );

    await expect(createStore().get(profilesState)).resolves.toEqual([]);
  });

  it("401 xoá luôn phiên đã lưu, không để lại token chết", async () => {
    h.state.storage = JSON.stringify({
      token: "phien-het-han",
      activePatientId: 101,
    });
    h.state.meError = new ApiError(401, "Phiên đã hết hạn.");

    await createStore().get(profilesState);

    expect(h.removeStorage).toHaveBeenCalled();
    expect(h.setSessionToken).toHaveBeenLastCalledWith(null);
  });

  it("lỗi khác 401 vẫn ném ra — không được nuốt sự cố máy chủ", async () => {
    h.state.meError = new ApiError(500, "Máy chủ gặp sự cố.");

    await expect(createStore().get(profilesState)).rejects.toThrow(ApiError);
  });

  /**
   * `Layout` nạp phiên trong `useEffect`, tức SAU khi render; `HomePage` đọc
   * `profilesState` TRONG lúc render. Nên lời gọi `/me` đầu tiên luôn đi
   * không kèm token và lĩnh 401, kể cả khi kho lưu trữ đang giữ phiên hợp lệ.
   * Phiên phải là phụ thuộc của `profilesState`, không phải một hiệu ứng chạy
   * đua với nó.
   */
  it("đọc phiên đã lưu TRƯỚC khi gọi /me", async () => {
    h.state.storage = JSON.stringify({
      token: "phien-hop-le",
      activePatientId: 101,
    });

    await createStore().get(profilesState);

    expect(h.state.tokenAtMeCall).toEqual(["phien-hop-le"]);
  });
});

/**
 * Hồi quy cho lỗi tìm ra ngày 2026-09-01 khi chạy thử với dữ liệu giả.
 *
 * `activePatientIdState` trả thẳng giá trị nạp từ kho lưu trữ, và các trang
 * dùng nó làm khoá cho `appointmentsState`/`invoicesState`. Nghĩa là một mã hồ
 * sơ cũ — của lần liên kết trước, hoặc của hồ sơ đã bị huỷ liên kết — vẫn đi
 * gọi API trước khi phiên kịp xác nhận nó còn hợp lệ. Máy chủ từ chối, lỗi
 * thoát ra khỏi atom và error boundary nuốt cả cây.
 *
 * Mã hồ sơ chỉ được dùng sau khi đã đối chiếu với danh sách hồ sơ của phiên.
 */
describe("activePatientIdState — mã hồ sơ phải được đối chiếu", () => {
  it("bỏ qua mã hồ sơ đã lưu nếu nó không thuộc phiên hiện tại", async () => {
    h.state.storage = JSON.stringify({
      token: "phien-hop-le",
      activePatientId: 999, // hồ sơ của lần liên kết trước
    });

    const store = createStore();
    await store.get(profilesState);
    await store.set(hydrateSessionState);

    // `me()` giả chỉ trả hồ sơ 101.
    await expect(store.get(activePatientIdState)).resolves.toBe(101);
  });

  it("trả null khi phiên không có hồ sơ nào", async () => {
    h.state.meError = new ApiError(401, "Phiên đã hết hạn.");

    await expect(createStore().get(activePatientIdState)).resolves.toBeNull();
  });
});
