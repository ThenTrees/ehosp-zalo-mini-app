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
  /**
   * SỐ ĐIỆN THOẠI THAY CHO SDK ZALO — chỉ khi phát triển.
   *
   * `useFake` gác HAI thứ cùng lúc: tầng dữ liệu và SDK điện thoại. Nên trước
   * cờ này chỉ có hai nước, và không nước nào thử được máy chủ thật:
   *   · `VITE_USE_FAKE=true`  → không chạm mạng, máy chủ không được thử dòng nào
   *   · `VITE_USE_FAKE=false` → gọi `getPhoneNumber()`, mà SDK ấy chỉ chạy bên
   *     trong ứng dụng Zalo thật; trên trình duyệt nó không trả về gì
   * Đặt `VITE_ZALO_PHONE_GIA=<số>` mở nước thứ ba: tầng dữ liệu THẬT, SDK bỏ
   * qua. Nó khớp với nhánh đã có sẵn ở máy chủ — `modules/patient-app/zalo.ts`
   * khi thiếu `ZALO_APP_SECRET` và `NODE_ENV` khác `production` thì coi chính
   * mã gửi lên LÀ số điện thoại. Hai đầu vốn đã hẹn nhau; chỉ máy khách chưa
   * có đường nói.
   *
   * ĐÂY KHÔNG PHẢI CHẾ ĐỘ `hybrid` ĐÃ BỎ. Chế độ ấy trộn tuyến thật với tuyến
   * bịa nên người nghiệm thu không biết màn nào nói thật. Cờ này KHÔNG đụng
   * tầng dữ liệu — mọi tuyến vẫn thật, mọi dòng vẫn vào CSDL thật; nó chỉ thay
   * đúng một lời gọi SDK mà trình duyệt không chạy được.
   *
   * Rỗng ở bản dựng phát hành: `readRuntimeConfig` bỏ qua cờ khi `PROD`.
   */
  soDienThoaiGia: string;
}

/** Chỉ nhận dạng số Việt Nam — chặn người ta nhét một token thật vào đây. */
const LA_SO_VN = /^(0|\+?84)\d{8,10}$/;

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

  /*
   * BA CHỐT, và chốt đầu là chốt duy nhất không được bỏ: một bản phát hành mà
   * mọi người bệnh cùng đăng nhập bằng một số điện thoại viết cứng là một sự
   * cố, không phải một lỗi. Hai chốt sau chỉ để bắt lỗi gõ sớm.
   */
  const soThoo = String(env.VITE_ZALO_PHONE_GIA ?? "").trim();
  let soDienThoaiGia = "";
  if (soThoo && !laBanPhatHanh && mode !== "fake") {
    if (!LA_SO_VN.test(soThoo)) {
      throw new Error(
        `VITE_ZALO_PHONE_GIA không phải số điện thoại Việt Nam: "${soThoo}".` +
          " Đặt một số có thật trong emr_patient_link, ví dụ 0908220101.",
      );
    }
    soDienThoaiGia = soThoo;
  }

  return { apiBaseUrl, mode, useFake: mode === "fake", soDienThoaiGia };
}
