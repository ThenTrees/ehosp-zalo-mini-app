/**
 * Hai chế độ dữ liệu, chọn bằng `VITE_USE_FAKE` trong `.env`.
 *
 * Từng có chế độ thứ ba, `hybrid`, ghép tuyến thật với tuyến giả trong khi
 * back-end về đích theo từng mảng. Nó đã bị bỏ: mọi tuyến mà mini app cần đều
 * đã có thật trong `modules/patient-app/router.ts`, và giữ lại một chế độ trộn
 * dữ liệu thật với dữ liệu bịa là giữ lại đúng thứ khiến người nghiệm thu không
 * phân biệt được màn hình nào đang nói thật.
 */
export type DataMode = "fake" | "real";

export interface RuntimeConfig {
  /** Địa chỉ gốc của API người bệnh, đã cắt dấu `/` ở cuối. */
  apiBaseUrl: string;
  mode: DataMode;
  /**
   * true = KHÔNG chạm mạng chút nào.
   *
   * `src/services/phone.ts` đọc cờ này để quyết định có gọi SDK
   * `getPhoneNumber` của Zalo hay không — SDK ấy chỉ chạy được bên trong ứng
   * dụng Zalo thật, nên phải tắt được khi phát triển trên trình duyệt.
   */
  useFake: boolean;
}

export function readRuntimeConfig(env: Record<string, unknown>): RuntimeConfig {
  const raw = String(env.VITE_USE_FAKE ?? "")
    .toLowerCase()
    .trim();
  const mode: DataMode = raw === "true" ? "fake" : "real";
  const apiBaseUrl = String(env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

  if (mode !== "fake" && !apiBaseUrl) {
    throw new Error(
      "Thiếu VITE_API_BASE_URL: đặt biến này trong .env, hoặc bật VITE_USE_FAKE=true để chạy với dữ liệu giả.",
    );
  }

  return { apiBaseUrl, mode, useFake: mode === "fake" };
}
