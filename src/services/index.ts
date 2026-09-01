import { readRuntimeConfig } from "./config";
import { createFakeApi } from "./fake";
import { createHttpApi, type PatientAppApi } from "./patient-app-api";

/**
 * Phải trích từng biến bằng tên đầy đủ, không truyền cả `import.meta.env`:
 * `define` trong vite.config.mts thay thế theo văn bản, nên nó chỉ nhận ra
 * đúng chuỗi `import.meta.env.VITE_API_BASE_URL`. Truyền cả object thì bản
 * build ra không có khoá VITE_* nào và ứng dụng trắng màn hình.
 */
export const runtimeConfig = readRuntimeConfig({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_USE_FAKE: import.meta.env.VITE_USE_FAKE,
});

/** Mã phiên hiện hành, do state.ts cập nhật sau khi liên kết. */
let phienHienTai: string | null = null;

export function setSessionToken(token: string | null): void {
  phienHienTai = token;
}

function chonApi(): PatientAppApi {
  return runtimeConfig.cheDo === "fake"
    ? createFakeApi()
    : createHttpApi(runtimeConfig.apiBaseUrl, () => phienHienTai);
}

export const api: PatientAppApi = chonApi();

export type { PatientAppApi };
