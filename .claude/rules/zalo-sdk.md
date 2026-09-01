# Zalo SDK surface

`zmp-sdk` chỉ được dùng ở hai mô-đun — giữ nguyên như vậy, đừng rải import ra khắp nơi:

- `getPhoneNumber` — `src/services/phone.ts`, gọi qua `getPhoneToken()`. Nó chỉ trả về một **token**, không phải số điện thoại. Máy chủ đổi token đó ra số thật bằng secret key của Zalo. Secret key **không bao giờ** nằm trong mini app. Ở chế độ dữ liệu giả, hàm này **không gọi SDK** — bản demo không được phụ thuộc vào quyền số điện thoại mà Zalo phải duyệt.
- `getAccessToken` — `src/services/phone.ts`, gọi qua `getUserAccessToken()`. Zalo đòi **cả hai**: `getPhoneNumber()` cho mã dùng một lần, `getAccessToken()` cho token phiên chứng minh mã ấy thuộc về ai. Máy chủ không tự sinh được token phiên vì nó gắn với người dùng chứ không gắn với ứng dụng. Trước 2026-09-01 `emr-api` nhét app id vào chỗ này và Zalo trả 452 "Session key invalid… incorrect format" cho mọi lần liên kết. Ở chế độ dữ liệu giả cũng **không gọi SDK**, cùng lý do với `getPhoneNumber`.
- `getStorage` / `setStorage` / `removeStorage` — `src/services/session.ts`, chỗ duy nhất chạm kho lưu trữ.

Đã bỏ khỏi dự án: `getUserInfo` (không còn header hồ sơ Zalo), `chooseImage` (không còn form tải ảnh), `openChat` (GĐ1 không có nút chat OA, và `template.oaID` đã gỡ khỏi `app-config.json`).
