import { describe, it, expect } from "vitest";
import indexSource from "../index.ts?raw";
import viteConfigSource from "../../../vite.config.mts?raw";

/**
 * Hồi quy cho lỗi màn hình trắng ngày 2026-08-22.
 *
 * `zmp build` **không tôn trọng `envDir`** trong vite.config.mts (đã kiểm bằng
 * thí nghiệm: bỏ khối `define` ra thì bundle không còn khoá VITE_* nào). Khi
 * đó `readRuntimeConfig` nhận undefined, ném lỗi ngay lúc nạp module, và
 * `src/app.ts` không kịp gọi createRoot().render() — không có gì được vẽ,
 * không ErrorBoundary, không toast. Chỉ một màn hình trắng.
 *
 * Hai điều kiện phải giữ để chuyện đó không lặp lại.
 */
describe("biến môi trường phải vào được bundle", () => {
  it("vite.config.mts nhúng thẳng từng biến bằng define", () => {
    expect(viteConfigSource).toContain("loadEnv");
    expect(viteConfigSource).toContain(
      '"import.meta.env.VITE_API_BASE_URL": JSON.stringify'
    );
    expect(viteConfigSource).toContain(
      '"import.meta.env.VITE_USE_FAKE": JSON.stringify'
    );
  });

  it("services/index.ts tham chiếu từng biến bằng tên đầy đủ", () => {
    // `define` thay thế theo văn bản, nên chuỗi đầy đủ phải có mặt trong mã.
    expect(indexSource).toContain("import.meta.env.VITE_API_BASE_URL");
    expect(indexSource).toContain("import.meta.env.VITE_USE_FAKE");
  });

  it("services/index.ts KHÔNG truyền cả object import.meta.env", () => {
    const goiHam = indexSource.replace(/\s+/g, " ");
    expect(goiHam).not.toMatch(/readRuntimeConfig\(\s*import\.meta\.env/);
  });
});
