import { describe, it, expect, vi } from "vitest";
import { buildUrl, request, ApiError } from "@/services/http";

const BASE = "https://api.phongkham.vn/api/patient-app";

function fakeFetch(status: number, payload: unknown) {
  return vi.fn(
    async () =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json" },
      })
  ) as unknown as typeof fetch;
}

function callOf(spy: typeof fetch, index = 0) {
  return (spy as unknown as ReturnType<typeof vi.fn>).mock.calls[index];
}

describe("buildUrl", () => {
  it("ghép đường dẫn và bỏ qua tham số undefined", () => {
    const url = buildUrl(BASE, "/slots", { department: 3, date: undefined });
    expect(url).toBe(`${BASE}/slots?department=3`);
  });

  it("không thêm dấu ? khi không có tham số nào", () => {
    expect(buildUrl(BASE, "/me")).toBe(`${BASE}/me`);
  });

  it("từ chối đưa bí mật vào query — đây là tiêu chí nghiệm thu của spec §6.2", () => {
    expect(() => buildUrl(BASE, "/redeem", { code: "HK260822123" })).toThrow(
      /không được nằm trong URL/
    );
    expect(() => buildUrl(BASE, "/queue", { token: "abc" })).toThrow(
      /không được nằm trong URL/
    );
  });
});

describe("request", () => {
  it("gắn header Bearer khi có token", async () => {
    const spy = fakeFetch(200, { ok: true });
    await request({ baseUrl: BASE, path: "/me", token: "abc", fetchImpl: spy });

    const [, init] = callOf(spy);
    expect(init.headers.Authorization).toBe("Bearer abc");
  });

  it("không gắn header Bearer khi không có token", async () => {
    const spy = fakeFetch(200, { ok: true });
    await request({ baseUrl: BASE, path: "/departments", fetchImpl: spy });

    const [, init] = callOf(spy);
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("gửi thân JSON với phương thức POST", async () => {
    const spy = fakeFetch(200, { ok: true });
    await request({
      baseUrl: BASE,
      path: "/redeem",
      method: "POST",
      body: { code: "HK260822123" },
      fetchImpl: spy,
    });

    const [url, init] = callOf(spy);
    expect(url).toBe(`${BASE}/redeem`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ code: "HK260822123" });
  });

  it("ném ApiError kèm thông báo của máy chủ khi lỗi", async () => {
    const spy = fakeFetch(429, { message: "Bạn đã thử quá nhiều lần." });
    await expect(
      request({ baseUrl: BASE, path: "/redeem", method: "POST", fetchImpl: spy })
    ).rejects.toMatchObject({ status: 429, message: "Bạn đã thử quá nhiều lần." });
  });

  it("ném ApiError với thông báo tiếng Việt khi máy chủ không trả JSON", async () => {
    const spy = vi.fn(
      async () => new Response("<html>502</html>", { status: 502 })
    ) as unknown as typeof fetch;
    await expect(
      request({ baseUrl: BASE, path: "/me", fetchImpl: spy })
    ).rejects.toThrow(/Không kết nối được máy chủ/);
  });
});

describe("ApiError", () => {
  it("giữ mã trạng thái", () => {
    expect(new ApiError(404, "Không tìm thấy").status).toBe(404);
  });
});
