import { describe, it, expect, vi } from "vitest";
import { createHttpApi } from "@/services/patient-app-api";

const BASE = "https://api.phongkham.vn/api/patient-app";

function spyFetch(payload: unknown = { ok: true }) {
  return vi.fn(
    async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
  ) as unknown as typeof fetch;
}

function callOf(spy: typeof fetch, index = 0) {
  return (spy as unknown as ReturnType<typeof vi.fn>).mock.calls[index];
}

describe("createHttpApi", () => {
  it("gửi mã hẹn trong thân JSON, không phải trong URL", async () => {
    const spy = spyFetch({ token: "t", appointmentId: 9 });
    const api = createHttpApi(BASE, () => null, spy);

    await api.redeem({ code: "HK260822088" });

    const [url, init] = callOf(spy);
    expect(url).toBe(`${BASE}/redeem`);
    expect(String(url)).not.toContain("HK260822088");
    expect(JSON.parse(init.body)).toEqual({ code: "HK260822088" });
  });

  it("truyền patient_id vào query khi đọc lịch hẹn", async () => {
    const spy = spyFetch([]);
    const api = createHttpApi(BASE, () => "abc", spy);

    await api.appointments({ patientId: 42 });

    expect(String(callOf(spy)[0])).toBe(`${BASE}/appointments?patient_id=42`);
  });

  it("gọi departments mà không cần token", async () => {
    const spy = spyFetch([]);
    const api = createHttpApi(BASE, () => null, spy);

    await api.departments();

    expect(callOf(spy)[1].headers.Authorization).toBeUndefined();
  });

  it("lấy token mới ở mỗi lời gọi, không giữ bản sao cũ", async () => {
    const spy = spyFetch({ profiles: [] });
    let token: string | null = null;
    const api = createHttpApi(BASE, () => token, spy);

    await api.me();
    token = "sau-khi-lien-ket";
    await api.me();

    expect(callOf(spy, 0)[1].headers.Authorization).toBeUndefined();
    expect(callOf(spy, 1)[1].headers.Authorization).toBe(
      "Bearer sau-khi-lien-ket"
    );
  });

  it("huỷ lịch hẹn gửi lý do trong thân JSON", async () => {
    const spy = spyFetch({ id: 9 });
    const api = createHttpApi(BASE, () => "abc", spy);

    await api.cancelAppointment(9, "Bận việc đột xuất");

    const [url, init] = callOf(spy);
    expect(url).toBe(`${BASE}/appointments/9/cancel`);
    expect(JSON.parse(init.body)).toEqual({ reason: "Bận việc đột xuất" });
  });
});
