import { defineConfig, loadEnv } from "vite";
import zaloMiniApp from "zmp-vite-plugin";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  // Không dựa vào `envDir`: ZMP CLI không tôn trọng nó, nên bản build ra bị
  // thiếu sạch các khoá VITE_* và ứng dụng trắng màn hình. Tự nạp rồi nhúng.
  // Mốc là thư mục chứa chính tệp này, không phải process.cwd() — CLI có thể
  // chạy từ thư mục khác.
  const thuMucDuAn = fileURLToPath(new URL(".", import.meta.url));
  const env = loadEnv(mode, thuMucDuAn, "VITE_");

  return defineConfig({
    root: "./src",
    base: "",
    envDir: "..",
    plugins: [zaloMiniApp(), react()],
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
        env.VITE_API_BASE_URL ?? "",
      ),
      "import.meta.env.VITE_USE_FAKE": JSON.stringify(env.VITE_USE_FAKE ?? ""),
      // Số điện thoại thay cho SDK Zalo khi phát triển — xem
    },
    build: {
      assetsInlineLimit: 0,
      target: "es2015",
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  });
};
