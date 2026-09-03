import { getAccessToken, getPhoneNumber } from "zmp-sdk";
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
export async function getPhoneToken(): Promise<string> {
  if (runtimeConfig.useFake) {
    return "token-so-dien-thoai-gia";
  }

  /*
   * SỐ THAY CHO SDK — xem `config.ts › soDienThoaiGia`. Máy chủ ở chế độ phát
   * triển coi chính chuỗi này LÀ số điện thoại, nên gửi thẳng số lên là đủ để
   * đi trọn luồng liên kết THẬT: tra `emr_patient_link`, đối chiếu ngày sinh,
   * cấp phiên, ghi nhật ký truy cập. Không nhánh nào của máy chủ bị bỏ qua.
   */
  if (runtimeConfig.soDienThoaiGia) {
    return runtimeConfig.soDienThoaiGia;
  }

  const { token } = await getPhoneNumber();
  return token ?? "";
}

/**
 * Lấy token phiên của người dùng, gửi kèm mã số điện thoại lên máy chủ.
 *
 * Zalo đòi hai thứ khác nhau cho một lần đổi mã: `code` là mã dùng một lần từ
 * `getPhoneNumber()`, còn `access_token` chứng minh mã ấy thuộc phiên nào.
 * Máy chủ không tự sinh được `access_token` — nó gắn với người dùng, không gắn
 * với ứng dụng — nên client phải lấy và gửi lên.
 *
 * Trước ngày 2026-09-01, `emr-api` nhét app id vào chỗ này và Zalo trả 452
 * "Session key invalid… incorrect format" cho mọi lần liên kết.
 *
 * Ở chế độ dữ liệu giả thì **không gọi SDK**, cùng lý do với
 * `getPhoneToken()`.
 */
export async function getUserAccessToken(): Promise<string> {
  if (runtimeConfig.useFake) {
    return "access-token-gia";
  }

  /*
   * Đi cùng `soDienThoaiGia`: nhánh dự phòng của máy chủ KHÔNG đọc `access_token`
   * (nó trả về ngay ở `laySoDienThoai` trước khi chạm `graph.zalo.me`), nhưng
   * `POST /link` vẫn đòi trường này có mặt. Trả một chuỗi nhận ra được để ai đọc
   * nhật ký biết lượt ấy KHÔNG đi qua Zalo thật.
   */
  if (runtimeConfig.soDienThoaiGia) {
    return "access-token-bo-qua-sdk";
  }

  return (await getAccessToken()) ?? "";
}
