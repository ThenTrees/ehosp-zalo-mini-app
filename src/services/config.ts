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
   * Trước đây cờ này gác HAI thứ: tầng dữ liệu và SDK điện thoại của Zalo.
   * Đường SDK ấy đã bỏ cùng luồng đăng nhập bằng số điện thoại, nên nay nó chỉ
   * còn gác đúng một thứ — và đó là điều tốt: một cờ gác hai thứ là một cờ
   * không tắt riêng được thứ nào.
   */
  useFake: boolean;
}


export function readRuntimeConfig(
  env: Record<string, unknown>,
  laBanPhatHanh = false,
): RuntimeConfig {
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
