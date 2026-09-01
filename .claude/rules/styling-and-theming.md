---
paths:
  - "src/css/**/*.scss"
  - "tailwind.config.js"
  - "postcss.config.js"
  - "app-config.json"
  - "src/pages/**/*.tsx"
  - "src/components/**/*.tsx"
---

# Configuration and theming

Chủ đề của app là bộ design **"Clinical Clarity"** (Stitch). Bản gốc nằm ngoài kho mã (`stitch_tr_l_y_t_zalo/clinical_clarity/DESIGN.md`); phần dự án thực sự dùng đã được chép thành token trong hai tệp dưới đây.

- `app-config.json` — app `title` (Header đọc qua `getConfig(c => c.app.title)`), status bar, cờ safe-area. `.vscode/settings.json` mang JSON schema; schema chỉ bắt buộc `template.name` nên `template.oaID` đã được gỡ (GĐ1 không có nút chat OA).

## `src/css/app.scss` — nguồn duy nhất của màu

| Nhóm | Biến |
|---|---|
| Xanh lâm sàng | `--primary` `#0066ff`, `--primary-ink` `#0050cb` (chữ/icon trên nền sáng), `--primary-soft` `#dce9ff` (ô icon, chip) |
| Bề mặt | `--background` `#f8f9ff`, `--surface` `#ffffff`, `--surface-sunken` `#eff4ff` |
| Chữ và kẻ | `--ink` `#0b1c30`, `--ink-muted` `#424656`, `--line` `#e2e8f0`, `--line-strong` `#c2c6d8` |
| Trạng thái | `--success`/`--success-soft`, `--warning`/`--warning-soft`, `--error`/`--error-soft` |

`--ink-muted` là **chữ phụ**; `--disabled` chỉ dành cho trạng thái vô hiệu thật. Trước đây hai nghĩa này dùng chung một biến.

Tệp này cũng giữ các ghi đè `--zaui-*`, inset `--safe-top`/`--safe-bottom`, font hệ thống, kiểu ô nhập cao 48px, và lớp `.an-thanh-cuon` (ẩn thanh cuộn ngang).

**Không nhúng font.** Design chỉ định Inter; app dùng font hệ thống vì nó hiển thị dấu tiếng Việt tốt và không tốn byte tải về.

## `tailwind.config.js` — ánh xạ token

Màu Tailwind (`bg-surface`, `text-ink-muted`, `border-line`, `text-primary-ink`, ...), safe area thành thang `st`/`sb` (`pt-st`, `pb-sb`), và:

- **Thang chữ theo design**: `3xs` 11px · `2xs` 12px · `sm` 14px · **`base` 16px** · `lg` 17px · `xl` 20px · `2xl` 24px · `6xl` 64px (số thứ tự).
- **Bo góc theo design**: `rounded` 8px (nút, ô nhập) · `rounded-md` 12px (thẻ) · `rounded-lg` 16px · `rounded-xl` **24px**. Khác mặc định Tailwind.
- **Bóng**: `shadow-card` (bề mặt cấp 1), `shadow-overlay` (modal), `shadow-action` (nút chính, nút "+").

Dark mode theo selector `[zaui-theme="dark"]`.

Dùng token đã ánh xạ, đừng viết mã màu hay cỡ pixel thẳng vào trang. Lưu ý Tailwind **không** thêm được độ mờ cho màu khai bằng biến CSS: `bg-primary-soft/40` không chạy — chọn token khác thay vì pha alpha.

## Bộ UI dùng chung — `src/components/ui/`

`Card`, `StatusChip` (kèm `trangThaiLichHen` / `trangThaiHoaDon` / `trangThaiLuotKham` / `trangThaiDonThuoc` — chỗ duy nhất dịch trạng thái sang tiếng Việt; nhãn và sắc thái lấy theo `eHosp/data/enums.csv` để hai bề mặt không gọi cùng một trạng thái bằng hai cái tên), `SectionHeader`, `Segmented`, `ListRow`, `QuickActions`, `PageHeading`, `EmptyState`.

Nút ở `src/components/button.tsx`, bốn kiểu `primary` / `secondary` / `danger` / `ghost`. Nút mặc định chiếm hết bề ngang; muốn hẹp thì truyền `fullWidth={false}` chứ **không** thêm `w-auto` qua `className` — cùng độ đặc hiệu và Tailwind xuất `w-full` sau nên `w-full` thắng.

Icon nằm gọn trong `src/components/icons/index.tsx` — SVG 24px, nét 2px, đầu bo tròn; prop `active` tô nhạt phần thân cho mục đang chọn trên thanh tab.
