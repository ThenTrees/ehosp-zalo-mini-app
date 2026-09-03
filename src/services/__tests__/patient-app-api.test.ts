import { describe, it, expect, vi } from "vitest";
import { createHttpApi } from "@/services/patient-app-api";

const BASE = "https://api.phongkham.vn/api/patient-app";

/**
 * Nhận cả một `Response` dựng sẵn.
 *
 * Bản trước LUÔN dựng `new Response(JSON.stringify(payload), {status:200})`,
 * nên không ca nào chạm được tới phản hồi thân rỗng — kể cả ca `unlink` bên
 * dưới, vốn truyền `null` và vì thế gửi đi chuỗi `"null"`, một thân JSON hợp lệ.
 * Đúng chỗ mù ấy che lỗi 204 suốt từ đầu.
 */
function spyFetch(payload: unknown = { ok: true }) {
  return vi.fn(async () =>
    payload instanceof Response
      ? payload.clone()
      : new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
  ) as unknown as typeof fetch;
}

function callOf(spy: typeof fetch, index = 0) {
  return (spy as unknown as ReturnType<typeof vi.fn>).mock.calls[index];
}

const urlOf = (spy: typeof fetch, index = 0) => String(callOf(spy, index)[0]);
const bodyOf = (spy: typeof fetch, index = 0) =>
  JSON.parse(callOf(spy, index)[1].body);

describe("createHttpApi — phiên và bí mật", () => {
  it("gọi departments mà không cần token", async () => {
    const spy = spyFetch([]);
    const api = createHttpApi(BASE, () => null, spy);

    await api.departments();

    expect(callOf(spy)[1].headers["X-Patient-Session"]).toBeUndefined();
  });

  it("lấy token mới ở mỗi lời gọi, không giữ bản sao cũ", async () => {
    const spy = spyFetch({ profiles: [] });
    let token: string | null = null;
    const api = createHttpApi(BASE, () => token, spy);

    await api.me();
    token = "sau-khi-lien-ket";
    await api.me();

    expect(callOf(spy, 0)[1].headers["X-Patient-Session"]).toBeUndefined();
    expect(callOf(spy, 1)[1].headers["X-Patient-Session"]).toBe(
      "sau-khi-lien-ket",
    );
  });

  it("mã xác thực số điện thoại đi trong thân JSON, không trong URL", async () => {
    const spy = spyFetch({ outcome: "CHALLENGE", need: "BIRTHDATE" });
    const api = createHttpApi(BASE, () => null, spy);

    await api.link({
      zaloPhoneToken: "zalo-token-bi-mat",
      zaloAccessToken: "access-token-cua-nguoi-dung",
    });

    expect(urlOf(spy)).toBe(`${BASE}/link`);
    expect(urlOf(spy)).not.toContain("zalo-token-bi-mat");
    expect(bodyOf(spy)).toEqual({
      zaloPhoneToken: "zalo-token-bi-mat",
      zaloAccessToken: "access-token-cua-nguoi-dung",
    });
  });
});

/**
 * Nhóm này khoá lại đúng ba kiểu lệch đã tìm thấy khi đối chiếu tệp này với
 * `eHosp/services/emr-api/src/modules/patient-app/router.ts` ngày 2026-08-30.
 * Cả ba đều hỏng IM LẶNG: màn hình hiện rỗng, hoặc 404 với một thông báo
 * không hề gợi ý rằng lỗi nằm ở tên tham số.
 */
describe("createHttpApi — hợp đồng §6", () => {
  it("bóc {results} cho các tuyến danh sách", async () => {
    const spy = spyFetch({ results: [{ id: 7 }] });
    const api = createHttpApi(BASE, () => "abc", spy);

    await expect(api.appointments({ patientId: 42 })).resolves.toEqual([
      { id: 7 },
    ]);
  });

  it("mảng trần của /invoices vẫn đọc được", async () => {
    const spy = spyFetch([{ id: 9001 }]);
    const api = createHttpApi(BASE, () => "abc", spy);

    await expect(api.invoices({ patientId: 42 })).resolves.toEqual([
      { id: 9001 },
    ]);
  });

  it("thân trả về lạ thì ra mảng rỗng chứ không ném", async () => {
    const spy = spyFetch({ notAList: "phai danh sach" });
    const api = createHttpApi(BASE, () => "abc", spy);

    await expect(api.visits({ patientId: 42 })).resolves.toEqual([]);
  });

  it("mọi tuyến đọc theo hồ sơ đều gửi patient_id", async () => {
    const spy = spyFetch({ results: [] });
    const api = createHttpApi(BASE, () => "abc", spy);

    await api.appointments({ patientId: 42 });
    await api.visits({ patientId: 42 });
    await api.prescriptions({ patientId: 42 });
    await api.invoices({ patientId: 42 });
    await api.queue({ patientId: 42 });
    await api.appointment({ id: 9, patientId: 42 });

    expect(urlOf(spy, 0)).toBe(`${BASE}/appointments?patient_id=42`);
    expect(urlOf(spy, 1)).toBe(`${BASE}/visits?patient_id=42`);
    expect(urlOf(spy, 2)).toBe(`${BASE}/prescriptions?patient_id=42`);
    expect(urlOf(spy, 3)).toBe(`${BASE}/invoices?patient_id=42`);
    expect(urlOf(spy, 4)).toBe(`${BASE}/queue?patient_id=42`);
    expect(urlOf(spy, 5)).toBe(`${BASE}/appointments/9?patient_id=42`);
  });

  it("slots gửi department_id, không gửi departmentId", async () => {
    const spy = spyFetch({ results: [] });
    const api = createHttpApi(BASE, () => "abc", spy);

    await api.slots({ departmentId: 3, date: "2026-09-01" });

    expect(urlOf(spy)).toBe(`${BASE}/slots?department_id=3&date=2026-09-01`);
  });

  it("đặt lịch gửi thân snake_case đúng như router đọc", async () => {
    const spy = spyFetch({ id: 1 });
    const api = createHttpApi(BASE, () => "abc", spy);

    await api.createAppointment({
      patientId: 42,
      departmentId: 3,
      date: "2026-09-01",
      session: "SANG",
    });

    expect(bodyOf(spy)).toEqual({
      patient_id: 42,
      department_id: 3,
      date: "2026-09-01",
      session: "SANG",
    });
  });

  it("xác nhận và huỷ đều gửi patient_id trong thân", async () => {
    const spy = spyFetch({ id: 9 });
    const api = createHttpApi(BASE, () => "abc", spy);

    await api.confirmAppointment({ id: 9, patientId: 42 });
    await api.cancelAppointment({
      id: 9,
      patientId: 42,
      reason: "Bận việc đột xuất",
    });

    expect(urlOf(spy, 0)).toBe(`${BASE}/appointments/9/confirm`);
    expect(bodyOf(spy, 0)).toEqual({ patient_id: 42 });
    expect(urlOf(spy, 1)).toBe(`${BASE}/appointments/9/cancel`);
    expect(bodyOf(spy, 1)).toEqual({
      patient_id: 42,
      reason: "Bận việc đột xuất",
    });
  });

  // Tuyến duy nhất nhận camelCase — router đọc `req.body.patientId`.
  // Và tuyến duy nhất trả 204 thân rỗng, nên ca này dựng ĐÚNG phản hồi ấy:
  // với `new Response("null")` như trước thì lỗi 204 không bao giờ lộ ra.
  it("unlink gửi patientId camelCase và chịu được 204 thân rỗng", async () => {
    const spy = spyFetch(new Response(null, { status: 204 }));
    const api = createHttpApi(BASE, () => "abc", spy);

    await expect(api.unlink(42)).resolves.toBeUndefined();
    expect(urlOf(spy)).toBe(`${BASE}/unlink`);
    expect(bodyOf(spy)).toEqual({ patientId: 42 });
  });
});
