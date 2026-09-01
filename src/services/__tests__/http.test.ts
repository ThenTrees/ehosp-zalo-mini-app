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
  it("gắn header X-Patient-Session khi có token", async () => {
    const spy = fakeFetch(200, { ok: true });
    await request({ baseUrl: BASE, path: "/me", token: "abc", fetchImpl: spy });

    const [, init] = callOf(spy);
    expect(init.headers["X-Patient-Session"]).toBe("abc");
  });

  it("không dùng Authorization: emr-api không đọc header đó", async () => {
    const spy = fakeFetch(200, { ok: true });
    await request({ baseUrl: BASE, path: "/me", token: "abc", fetchImpl: spy });

    const [, init] = callOf(spy);
    expect(init.headers.Authorization).toBeUndefined();
  });

  /*
   * ngrok bản miễn phí chèn một trang HTML cảnh báo trước mọi request có
   * User-Agent giống trình duyệt — webview Zalo chính là loại đó. Đo trên
   * tunnel thật ngày 2026-09-01: UA của curl nhận `application/json`, UA giả
   * lập Android nhận `text/html`. App khi ấy nhận HTML, `response.json()` ném
   * lỗi, và người dùng thấy "Không kết nối được máy chủ" — đúng lớp lỗi đã gây
   * trắng màn hình trước đó. Header dưới đây tắt trang chắn ấy.
   */
  it("gắn header bỏ qua trang chắn khi API đi qua tunnel ngrok", async () => {
    const spy = fakeFetch(200, { ok: true });
    await request({
      baseUrl: "https://fdce-1234.ngrok-free.app/api/patient-app",
      path: "/departments",
      fetchImpl: spy,
    });

    const [, init] = callOf(spy);
    expect(init.headers["ngrok-skip-browser-warning"]).toBe("1");
  });

  it("không gắn header ngrok khi trỏ về tên miền thật", async () => {
    const spy = fakeFetch(200, { ok: true });
    await request({ baseUrl: BASE, path: "/departments", fetchImpl: spy });

    const [, init] = callOf(spy);
    expect(init.headers["ngrok-skip-browser-warning"]).toBeUndefined();
  });

  it("không gắn header phiên khi không có token", async () => {
    const spy = fakeFetch(200, { ok: true });
    await request({ baseUrl: BASE, path: "/departments", fetchImpl: spy });

    const [, init] = callOf(spy);
    expect(init.headers["X-Patient-Session"]).toBeUndefined();
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

  /*
   * Bộ xử lý lỗi tập trung của emr-api (`src/index.ts`) trả `{ error, detail }`
   * cho MỌI lỗi — không có `message`, không có `code`. Test này từng dựng sẵn
   * `{ message: ... }` rồi tự nghiệm thu chính điều mình bịa ra, nên thông báo
   * tiếng Việt của máy chủ không bao giờ tới được người dùng: 401 thật nói
   * "Phiên đã hết hạn. Vui lòng liên kết lại." mà app hiện "Đã có lỗi xảy ra."
   */
  it("ném ApiError kèm thông báo của máy chủ khi lỗi", async () => {
    const spy = fakeFetch(429, { error: "Bạn đã thử quá nhiều lần." });
    await expect(
      request({ baseUrl: BASE, path: "/redeem", method: "POST", fetchImpl: spy })
    ).rejects.toMatchObject({ status: 429, message: "Bạn đã thử quá nhiều lần." });
  });

  it("giữ lại `detail` của máy chủ để chẩn đoán, không đưa vào thông báo", async () => {
    const spy = fakeFetch(409, {
      error: "Dữ liệu đã tồn tại",
      detail: "Duplicate entry 'BN0000101'",
    });
    await expect(
      request({ baseUrl: BASE, path: "/appointments", method: "POST", fetchImpl: spy })
    ).rejects.toMatchObject({
      status: 409,
      message: "Dữ liệu đã tồn tại",
      detail: "Duplicate entry 'BN0000101'",
    });
  });

  it("lỗi thiếu trường `error` vẫn có thông báo tiếng Việt dùng được", async () => {
    const spy = fakeFetch(500, {});
    await expect(
      request({ baseUrl: BASE, path: "/me", fetchImpl: spy })
    ).rejects.toThrow(/Đã có lỗi xảy ra/);
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
