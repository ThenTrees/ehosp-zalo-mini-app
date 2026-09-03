# Project overview

Zalo Mini App cho **người bệnh** của phòng khám phường Sài Gòn — bề mặt thứ hai của hệ EMR ở `d:/projects/eHosp`, không phải một hệ thống lưu trữ riêng.

- React 18 + TypeScript + Vite 5, UI từ `zmp-ui`, state bằng Jotai, styling bằng Tailwind + SCSS.
- Toàn bộ chữ hiển thị cho người dùng là **tiếng Việt**.
- Khởi đầu từ template **ZaUI Doctor**, nay đã cắt bỏ phần lớn (xem lịch sử git từ commit "Dọn template").

**Phạm vi giai đoạn 1:** liên kết tài khoản, đặt lịch khám, lịch hẹn của tôi, số thứ tự, lịch sử khám (lượt khám + đơn thuốc, chỉ trạng thái), hoá đơn + mã thanh toán.

**⚠ Ràng buộc "không hiển thị nội dung lâm sàng" đã bị ĐẢO ngày 2026-09-03.** Trước đó app cố ý không hiện chẩn đoán, kết quả xét nghiệm, tên thuốc hay liều dùng, với lý do VNeID đã làm việc ấy và có giá trị pháp lý (QĐ 31/QĐ-BYT). Chủ phòng khám đã quyết khác: người bệnh xem được **toàn bộ bệnh sử của chính mình** trong app — chẩn đoán, đơn thuốc có tên và liều, kết quả xét nghiệm kèm khoảng tham chiếu, bảng kê chi phí, đính vào từng lượt khám. Quyền ấy là của họ theo Điều 10 Luật KCB 15/2023.

`src/services/__tests__/no-clinical-content.test.ts` **vẫn còn và vẫn canh** — nó đổi từ danh sách từ cấm sang **danh sách trắng từng trường**, chặt hơn: thêm một trường vào `types.d.ts` mà không khai là đỏ ngay. Một thứ vẫn cấm tuyệt đối là **ghi chú nội bộ của nhân viên**. Lý lẽ đầy đủ ở đầu `src/types.d.ts` và `CLAUDE.md`; đăng nhập nay bằng **số định danh + mật khẩu**, không còn dùng token Zalo làm xác thực.

**Entry chain:** `index.html` -> `src/app.ts` (mounts `RouterProvider`, imports `zaui.min.css` + `css/tailwind.scss` + `css/app.scss`, copies `app-config.json` onto `window.APP_CONFIG`) -> `src/router.tsx`.

**Vite root là `./src`** (`vite.config.mts`), nên `index.html`, `app-config.json`, `tailwind.config.js` nằm trên root một cấp. `envDir: ".."` để Vite và ZMP CLI dùng chung tệp `.env` ở gốc. Alias `@` trỏ tới `/src`; ưu tiên import kiểu `@/...`.

`www/` là kết quả build; không bao giờ sửa tay.

## Tài liệu thiết kế

| Tài liệu | Ở đâu |
|---|---|
| Thiết kế GĐ1 (spec) | `docs/superpowers/specs/2026-08-22-zalo-mini-app-gd1-design.md` |
| Kế hoạch triển khai front-end | `docs/superpowers/plans/2026-08-22-khoi-b-mini-app-nguoi-benh.md` |
| Thiết kế mô-đun gốc | `eHosp/docs/09-THIET-KE-DICH-VU/12-MOBILE-APP.md` và `03-APPOINTMENT.md` |
