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
- Lỗi hiện bằng `toast.error(...)` với thông báo của máy chủ nếu có; câu dự phòng phải là tiếng Việt.
- Component chuyển bước nhận `onNext` từ trang điều phối, không tự điều hướng.

Không còn tải ảnh trong bất kỳ form nào của GĐ1.
