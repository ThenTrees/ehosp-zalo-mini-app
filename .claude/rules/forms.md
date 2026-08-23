---
paths:
  - "src/pages/booking/**/*.tsx"
  - "src/pages/link/**/*.tsx"
---

# Forms

Không có khung form dùng chung. `fab-form.tsx` của template đã bị xoá cùng các trang dùng nó.

Quy ước hiện tại cho luồng nhiều bước (xem `src/pages/booking/`):

- Dữ liệu giữa các bước nằm trong **một** atom `atomWithReset` (`bookingFormState`), mỗi bước đọc và ghi cùng atom đó.
- Bước cuối gọi thẳng `api.*`, tự giữ cờ `dangGui` cho trạng thái nút, và `useResetAtom` để dọn form sau khi thành công.
- Component chuyển bước nhận `onNext` / `onBack` từ trang điều phối, không tự điều hướng. `BookingPage` vẽ `Stepper` cho cả ba bước.

## Lỗi

- **Lỗi làm hỏng thao tác** (hết quota, quá hai lịch hẹn đang mở, thông tin liên kết không khớp) hiện thành **khối đỏ ngay trong trang** và ở lại đó — người bệnh cần đọc kỹ và thường phải chọn lại. Đừng dùng toast cho nhóm này; nó trôi mất trước khi đọc xong.
- **Xác nhận thành công** thì dùng `toast.success(...)`.
- Câu dự phòng khi máy chủ không kèm thông báo phải là tiếng Việt.

## Ô nhập

Không dùng `Input` của `zmp-ui` nữa. Ô nhập là `<input>`/`<textarea>` thường, cao 48px, bo 8px, viền `--line`, focus thì viền dày 2px màu `--primary`; nhãn luôn nằm phía trên chứ không phải nhãn nổi. Ngày sinh dùng `<input type="date">` để khỏi bắt người dùng gõ đúng định dạng.

Không còn tải ảnh trong bất kỳ form nào của GĐ1.
