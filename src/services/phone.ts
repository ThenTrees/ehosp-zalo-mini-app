import { getPhoneNumber } from "zmp-sdk";
import { runtimeConfig } from "./index";

/**
 * Lấy token số điện thoại để gửi lên máy chủ liên kết hồ sơ.
 *
 * `getPhoneNumber()` chỉ trả về một **token**, không phải số thật; máy chủ đổi
 * token đó ra số bằng secret key của Zalo. Secret key không bao giờ nằm trong
 * mini app.
 *
 * Ở chế độ dữ liệu giả thì **không gọi SDK**. Quyền số điện thoại phải được
 * cấu hình và duyệt phía Zalo; một bản demo chạy dữ liệu giả không được phụ
 * thuộc vào việc đó, nếu không người xem mắc kẹt ngay ở màn hình liên kết và
 * không thấy được phần còn lại của ứng dụng.
 *
 * Đổi lại: đường gọi SDK thật **không** được bộ test phủ, và chỉ kiểm chứng
 * được khi chạy bản dựng với `VITE_USE_FAKE=false` trên máy thật.
 */
export async function layTokenSoDienThoai(): Promise<string> {
  if (runtimeConfig.useFake) {
    return "token-so-dien-thoai-gia";
  }

  const { token } = await getPhoneNumber();
  return token ?? "";
}
