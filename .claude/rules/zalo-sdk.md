# Zalo SDK surface

`zmp-sdk` chỉ được dùng ở hai mô-đun — giữ nguyên như vậy, đừng rải import ra khắp nơi:

- `getPhoneNumber` — `src/pages/link/index.tsx`. Nó chỉ trả về một **token**, không phải số điện thoại. Máy chủ đổi token đó ra số thật bằng secret key của Zalo. Secret key **không bao giờ** nằm trong mini app.
- `getStorage` / `setStorage` / `removeStorage` — `src/services/session.ts`, chỗ duy nhất chạm kho lưu trữ.

Đã bỏ khỏi dự án: `getUserInfo` (không còn header hồ sơ Zalo), `chooseImage` (không còn form tải ảnh), `openChat` (GĐ1 không có nút chat OA, và `template.oaID` đã gỡ khỏi `app-config.json`).
