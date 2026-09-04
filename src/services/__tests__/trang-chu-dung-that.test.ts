/*
 * Sự cố 03/09/2026, dựng lại từ đầu đến cuối.
 *
 * Các tệp thử khác canh từng mảnh: `http.test.ts` canh `request()`,
 * `unlink-state.test.ts` canh atom với `api.unlink` đã bị mock, `dieu-huong.test.ts`
 * canh bằng mã nguồn. Không tệp nào NỐI được cả đường: một máy chủ có hành vi
 * thật → `http.ts` thật → atom thật → cây React thật.
 *
 * Tệp này làm việc đó. `api` ở đây là `createHttpApi` THẬT; chỉ `fetch` bị thay
 * bằng một emr-api giả CÓ TRẠNG THÁI, hành xử đúng như `router.ts` nhánh pr-15:
 * `/unlink` trả 204 thân rỗng và tự gỡ hồ sơ khỏi danh sách liên kết, hai tuyến
 * hoá đơn đã bị rút nên rơi vào bộ 404 tập trung. Trang chủ được DỰNG THẬT bằng
 * `renderToPipeableStream` — có sẵn trong `react-dom`, nên không phải thêm
 * `jsdom` lẫn `@testing-library/react` chỉ để trả lời một câu hỏi.
 *
 * Đã kiểm ngược cả hai chiều: gỡ nhánh 204 khỏi `http.ts` làm bốn ca đỏ; đặt
 * lại một lời đọc `invoices` vô điều kiện vào Trang chủ làm ca dựng React đỏ
 * với đúng câu "Không có đường dẫn GET /api/patient-app/invoices".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStore } from "jotai";

const g = vi.hoisted(() => {
  const BASE = "https://emr.test/api/patient-app";
  const MEN = {
    patientId: 42,
    patientCode: "BN0000042",
    fullName: "Nguyễn Thị Lan",
    gender: "F",
    birthdate: "1988-04-11",
  };
  const CON = {
    patientId: 77,
    patientCode: "BN0000077",
    fullName: "Nguyễn Minh Khang",
    gender: "M",
    birthdate: "2019-10-02",
  };

  const state = {
    BASE,
    /** Hồ sơ còn liên kết — /unlink gỡ khỏi đây, đúng như revoked_at ở máy chủ. */
    lienKet: [MEN, CON] as any[],
    goi: [] as { url: string; method: string; body: string | null }[],
    token: "phien-cua-chi-lan" as string | null,
    reset() {
      state.lienKet = [MEN, CON];
      state.goi = [];
      state.token = "phien-cua-chi-lan";
    },
  };

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  const mayChuGia = (async (input: any, init: any = {}) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    state.goi.push({ url, method, body: init?.body ?? null });
    const path = url.slice(BASE.length).split("?")[0];

    if (path === "/me") return json({ profiles: state.lienKet });
    if (path === "/appointments" && method === "GET")
      return json({ results: [] });
    if (path === "/queue") return json({ results: [] });
    if (path === "/visits" || path === "/prescriptions")
      return json({ results: [] });
    if (path === "/unlink") {
      const id = JSON.parse(init.body).patientId;
      state.lienKet = state.lienKet.filter((p) => p.patientId !== id);
      // router.ts pr-15: res.status(204).end() — THÂN RỖNG THẬT.
      return new Response(null, { status: 204 });
    }
    // Bộ 404 tập trung của emr-api, nguyên văn.
    return json(
      { error: `Không có đường dẫn ${method} /api/patient-app${path}` },
      404,
    );
  }) as typeof fetch;

  return {
    state,
    mayChuGia,
    getStorage: vi.fn(),
    setStorage: vi.fn(async () => undefined),
    removeStorage: vi.fn(async () => undefined),
    setSessionToken: vi.fn(),
  };
});

vi.mock("zmp-sdk", () => ({
  getStorage: g.getStorage,
  setStorage: g.setStorage,
  removeStorage: g.removeStorage,
  getUserInfo: vi.fn(async () => ({ userInfo: { name: "Người dùng thử" } })),
}));

vi.mock("@/services", async () => {
  const mod = await vi.importActual<
    typeof import("@/services/patient-app-api")
  >("@/services/patient-app-api");
  return {
    api: mod.createHttpApi(g.state.BASE, () => g.state.token, g.mayChuGia),
    setSessionToken: g.setSessionToken,
  };
});

import { createHttpApi } from "@/services/patient-app-api";
import {
  profilesState,
  appointmentsState,
  activePatientIdState,
  hydrateSessionState,
  unlinkState,
} from "@/state";

const apiThat = createHttpApi(g.state.BASE, () => g.state.token, g.mayChuGia);

function coPhien(activePatientId: number) {
  g.getStorage.mockResolvedValue({
    patient_app_session: JSON.stringify({
      token: "phien-cua-chi-lan",
      activePatientId,
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  g.state.reset();
});

describe("Trang chủ dựng được khi /invoices trả 404", () => {
  it("tiền đề: máy chủ giả THẬT SỰ trả 404 cho /invoices", async () => {
    await expect(apiThat.invoices({ patientId: 42 })).rejects.toMatchObject({
      status: 404,
    });
  });

  it("mọi atom Trang chủ đọc đều giải quyết được, không atom nào ném", async () => {
    coPhien(42);
    const store = createStore();
    await store.set(hydrateSessionState);

    const profiles = await store.get(profilesState);
    expect(profiles.length).toBe(2);

    const patientId = store.get(activePatientIdState);
    expect(patientId).toBe(42);
    await expect(store.get(appointmentsState(patientId))).resolves.toEqual([]);
  });

  it("không lời gọi mạng nào trên đường dựng Trang chủ chạm /invoices", async () => {
    coPhien(42);
    const store = createStore();
    await store.set(hydrateSessionState);
    await store.get(profilesState);
    await store.get(appointmentsState(store.get(activePatientIdState)));

    expect(g.state.goi.length).toBeGreaterThan(0);
    expect(
      g.state.goi.map((x) => x.url).filter((u) => u.includes("/invoices")),
    ).toEqual([]);
  });
});

describe("/unlink 204 thân rỗng — canh cả hai vế", () => {
  it("VẾ 1: 204 đi qua http.ts mà KHÔNG ném", async () => {
    await expect(apiThat.unlink(42)).resolves.toBeUndefined();
    const goi = g.state.goi.find((x) => x.url.includes("/unlink"));
    expect(goi?.method).toBe("POST");
    // Hợp đồng: /unlink là chỗ DUY NHẤT gửi camelCase.
    expect(JSON.parse(goi!.body!)).toEqual({ patientId: 42 });
  });

  it("VẾ 2: còn hồ sơ khác → GIỮ phiên, chuyển hồ sơ đang xem", async () => {
    coPhien(42);
    const store = createStore();
    await store.set(hydrateSessionState);
    await store.get(profilesState);

    await store.set(unlinkState, 42);

    expect(g.removeStorage).not.toHaveBeenCalled();
    expect(g.setSessionToken).not.toHaveBeenCalledWith(null);
    expect(store.get(activePatientIdState)).toBe(77);
    await expect(store.get(profilesState)).resolves.toHaveLength(1);
  });

  it("VẾ 2: hồ sơ CUỐI CÙNG → bốn dòng dọn dẹp đều chạy", async () => {
    coPhien(42);
    const store = createStore();
    await store.set(hydrateSessionState);
    await store.get(profilesState);

    await store.set(unlinkState, 42);
    await store.set(unlinkState, 77);

    expect(g.removeStorage).toHaveBeenCalled();
    expect(g.setSessionToken).toHaveBeenCalledWith(null);
    expect(store.get(activePatientIdState)).toBeNull();
    await expect(store.get(profilesState)).resolves.toEqual([]);
  });
});

describe("Khoá gửi đi — đối chiếu hợp đồng máy chủ", () => {
  it("bảy chỗ gửi patient_id snake_case, đúng /unlink gửi patientId", async () => {
    await apiThat.appointments({ patientId: 42 });
    await apiThat.queue({ patientId: 42 });
    await apiThat.visits({ patientId: 42 });
    await apiThat.prescriptions({ patientId: 42 });
    await apiThat
      .createAppointment({
        patientId: 42,
        departmentId: 1,
        date: "2026-09-10",
        session: "MORNING" as any,
      })
      .catch(() => undefined);
    await apiThat.unlink(42);

    const query = g.state.goi.filter((x) => x.url.includes("?"));
    for (const q of query) {
      expect(q.url, `query của ${q.url} phải dùng patient_id`).not.toMatch(
        /[?&]patientId=/,
      );
    }
    const bodies = g.state.goi
      .filter((x) => x.body)
      .map((x) => ({ url: x.url, b: JSON.parse(x.body!) }));
    for (const { url, b } of bodies) {
      if (url.includes("/unlink")) {
        expect(b).toHaveProperty("patientId");
        expect(b).not.toHaveProperty("patient_id");
      } else if ("patientId" in b || "patient_id" in b) {
        expect(b, `${url} phải gửi patient_id`).toHaveProperty("patient_id");
        expect(b).not.toHaveProperty("patientId");
      }
    }
  });
});

/*
 * Phép đo mạnh nhất: DỰNG THẬT cây React của Trang chủ bằng
 * `renderToPipeableStream` (không cần jsdom; nó chờ được Suspense của jotai)
 * trong khi máy chủ giả trả 404 cho /invoices.
 */
describe("Trang chủ — dựng THẬT cây React", () => {
  it("Trang chủ ra HTML đủ ba ô thao tác nhanh, không rơi vào thẻ lỗi", async () => {
    coPhien(42);
    const store = createStore();
    await store.set(hydrateSessionState);

    const React = await import("react");
    /*
     * `react-dom/server.browser` chứ không phải bản Node: nó trả về một
     * `ReadableStream` của Web nên không phải import `node:stream`, mà kho này
     * cố ý không cài `@types/node` (`lib` của tsconfig dừng ở es2017).
     */
    const { renderToReadableStream } = await import("react-dom/server.browser");
    const { Provider } = await import("jotai");
    const { MemoryRouter } = await import("react-router-dom");
    const HomePage = (await import("@/pages/home")).default;

    const cay = React.createElement(
      MemoryRouter as any,
      null,
      React.createElement(
        Provider as any,
        { store },
        React.createElement(
          React.Suspense as any,
          { fallback: "DANG-TAI-NGOAI" },
          React.createElement(HomePage as any, null),
        ),
      ),
    );

    const loi: unknown[] = [];
    const stream = await renderToReadableStream(cay, {
      onError: (e: unknown) => {
        loi.push(e);
      },
    });
    await stream.allReady;
    const html = await new Response(stream as any).text();

    // Không lỗi nào bị nuốt trong lúc dựng.
    expect(loi).toEqual([]);
    expect(html).toContain("Đặt lịch khám");
    expect(html).toContain("Số thứ tự");
    expect(html).toContain("Lịch sử khám");
    expect(html).toContain("Lịch khám sắp tới");
    expect(html).not.toContain("Hoá đơn");
    // Không thẻ nào rơi vào vách ngăn lỗi.
    expect(html).not.toContain("Không tải được lịch khám sắp tới");
    expect(html).not.toContain("Không xem được tình trạng khám hôm nay");
    expect(html).not.toContain("DANG-TAI-NGOAI");
    // Và trên toàn bộ đường dựng, không một lời gọi /invoices nào.
    expect(
      g.state.goi.map((x) => x.url).filter((u) => u.includes("/invoices")),
    ).toEqual([]);
  });
});
