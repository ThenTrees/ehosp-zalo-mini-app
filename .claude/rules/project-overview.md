# Project overview

Zalo Mini App cho **người bệnh** của phòng khám phường Sài Gòn — bề mặt thứ hai của hệ EMR ở `d:/projects/eHosp`, không phải một hệ thống lưu trữ riêng.

- React 18 + TypeScript + Vite 5, UI từ `zmp-ui`, state bằng Jotai, styling bằng Tailwind + SCSS.
- Toàn bộ chữ hiển thị cho người dùng là **tiếng Việt**.
- Khởi đầu từ template **ZaUI Doctor**, nay đã cắt bỏ phần lớn (xem lịch sử git từ commit "Dọn template").

**Phạm vi giai đoạn 1:** liên kết tài khoản, đặt lịch khám, lịch hẹn của tôi, số thứ tự, hoá đơn + mã thanh toán, thông báo trạng thái.

**Cố ý không làm:** không hiển thị nội dung lâm sàng — không chẩn đoán, không kết quả xét nghiệm, không tên thuốc, không bệnh án. Sổ sức khoẻ điện tử trên VNeID đã làm việc đó và có giá trị pháp lý (QĐ 31/QĐ-BYT). Lý do đầy đủ ở `docs/superpowers/specs/2026-08-22-zalo-mini-app-gd1-design.md` §2.1, và có test tự động canh chừng: `src/services/__tests__/khong-lam-sang.test.ts`.

**Entry chain:** `index.html` -> `src/app.ts` (mounts `RouterProvider`, imports `zaui.min.css` + `css/tailwind.scss` + `css/app.scss`, copies `app-config.json` onto `window.APP_CONFIG`) -> `src/router.tsx`.

**Vite root là `./src`** (`vite.config.mts`), nên `index.html`, `app-config.json`, `tailwind.config.js` nằm trên root một cấp. `envDir: ".."` để Vite và ZMP CLI dùng chung tệp `.env` ở gốc. Alias `@` trỏ tới `/src`; ưu tiên import kiểu `@/...`.

`www/` là kết quả build; không bao giờ sửa tay.

## Tài liệu thiết kế

| Tài liệu | Ở đâu |
|---|---|
| Thiết kế GĐ1 (spec) | `docs/superpowers/specs/2026-08-22-zalo-mini-app-gd1-design.md` |
| Kế hoạch triển khai front-end | `docs/superpowers/plans/2026-08-22-khoi-b-mini-app-nguoi-benh.md` |
| Thiết kế mô-đun gốc | `eHosp/docs/09-THIET-KE-DICH-VU/12-MOBILE-APP.md` và `03-APPOINTMENT.md` |
