import { readRuntimeConfig } from "./config";
import { createFakeApi } from "./fake";
import { createHttpApi, type PatientAppApi } from "./patient-app-api";

export const runtimeConfig = readRuntimeConfig(
  import.meta.env as unknown as Record<string, unknown>
);

/** Token Bearer hiện hành, do state.ts cập nhật sau khi liên kết. */
let phienHienTai: string | null = null;

export function setSessionToken(token: string | null): void {
  phienHienTai = token;
}

export const api: PatientAppApi = runtimeConfig.useFake
  ? createFakeApi()
  : createHttpApi(runtimeConfig.apiBaseUrl, () => phienHienTai);

export type { PatientAppApi };
