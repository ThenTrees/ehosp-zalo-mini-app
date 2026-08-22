export interface RuntimeConfig {
  /** Địa chỉ gốc của API người bệnh, đã cắt dấu `/` ở cuối. */
  apiBaseUrl: string;
  /** true = dùng tầng dữ liệu giả, không chạm mạng. */
  useFake: boolean;
}

export function readRuntimeConfig(
  env: Record<string, unknown>
): RuntimeConfig {
  const useFake = String(env.VITE_USE_FAKE ?? "").toLowerCase() === "true";
  const apiBaseUrl = String(env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

  if (!useFake && !apiBaseUrl) {
    throw new Error(
      "Thiếu VITE_API_BASE_URL: đặt biến này trong .env, hoặc bật VITE_USE_FAKE=true để chạy với dữ liệu giả."
    );
  }

  return { apiBaseUrl, useFake };
}
