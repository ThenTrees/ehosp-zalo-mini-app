import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // `src/services/index.ts` đọc import.meta.env lúc nạp module và ném lỗi nếu
    // thiếu cấu hình. Test luôn chạy trên tầng dữ liệu giả.
    env: {
      VITE_USE_FAKE: "true",
    },
  },
});
