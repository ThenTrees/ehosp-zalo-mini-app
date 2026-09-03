---
paths:
  - "src/state.ts"
  - "src/types.d.ts"
  - "src/services/**/*.ts"
  - "src/pages/**/*.tsx"
  - "src/components/**/*.tsx"
---

# State (`src/state.ts`) và tầng dữ liệu (`src/services/`)

`src/state.ts` là **ranh giới duy nhất giữa UI và dữ liệu**. Trang chỉ đọc atom; không trang nào tự gọi mạng, trừ một chỗ có lý do (`pages/link` gọi `api.link` trong luồng nhiều bước).

## `src/services/`

| Tệp | Việc |
|---|---|
| `config.ts` | Đọc `import.meta.env` thành `RuntimeConfig` |
| `session.ts` | Lưu/đọc/xoá phiên người bệnh qua kho lưu trữ `zmp-sdk` |
| `http.ts` | `fetch` + header `X-Patient-Session` + `ApiError`; **`buildUrl` ném lỗi nếu ai đó đưa `code`/`token` vào query string** |
| `patient-app-api.ts` | `interface PatientAppApi` — hợp đồng §6 của spec — và cài đặt HTTP thật |
| `fake/` | Cài đặt giả cùng interface, mô phỏng cả quota 30%, luật tối đa 2 lịch hẹn đang mở và chốt phạm vi hồ sơ |
| `index.ts` | Chọn thật/giả theo `VITE_USE_FAKE`, giữ token hiện hành |

Đổi sang back-end thật = đặt `VITE_USE_FAKE=false` và `VITE_API_BASE_URL` trong `.env`. Không sửa dòng mã nào. Chỉ còn **hai** chế độ — `hybrid` đã bị bỏ ngày 2026-08-30.

Thân yêu cầu đi bằng **snake_case** (`patient_id`, `department_id`) vì `router.ts` của eHosp đọc như vậy; ngoại lệ duy nhất là `/unlink` nhận `patientId`. Các tuyến danh sách trả `{ results: [...] }`, riêng `/invoices` trả mảng trần — hàm `unwrap()` trong `patient-app-api.ts` là chỗ duy nhất biết sự khác biệt đó. (`/invoices` và `/invoices/:id/qr` đang bị RÚT ở máy chủ; hai hàm vẫn còn trong hợp đồng nhưng không màn hình nào được gọi — xem "Tuyến đã rút" trong README.)

## Quy ước atom

- Danh mục: atom async phẳng (`departmentsState`).
- **Mọi atom đọc dữ liệu của người bệnh là `atomFamily` khoá theo `patientId`** (`appointmentsState`, `queueState`, `visitsState`, `prescriptionsState`) — chuyển hồ sơ người thân không được lẫn dữ liệu.
- **Mọi atom dữ liệu đi qua `nuot401`**: 401 thành giá trị rỗng và dọn phiên (chưa liên kết và phiên hết hạn cùng về một đích); mọi mã lỗi khác NỔI LÊN cho `ErrorBoundary` của route con hoặc `SilentBoundary` của từng thẻ bắt. Nuốt cả 404/500 là nguỵ trang sự cố máy chủ thành "bạn chưa có dữ liệu nào".
- `visitDetailState` khoá theo **cả** `{ id, patientId }` và **không đi qua `nuot401`** cho 404/500: một màn bệnh án trắng trơn trông y hệt "lượt khám này không có gì", mà hai chuyện ấy khác hẳn nhau.
- `appointmentByIdState` khoá theo **cả** `{ id, patientId }`: máy chủ đối chiếu `patient_id` với phạm vi phiên ở mọi tuyến đọc, nên mã lịch hẹn một mình không đủ để hỏi.
- `departmentNameState` là hàm tra `departmentId -> tên khoa`, dựng một lần từ `departmentsState`. `/visits` chỉ trả mã khoa, và để mỗi trang tự dựng `Map` là ba bản sao của cùng một việc.
- Cần làm mới sau khi ghi thì dùng `atomWithRefresh` và gọi setter không tham số.
- Form nhiều bước: `atomWithReset` (`bookingFormState`) đọc/ghi chung qua các bước.
- `activePatientIdState` đọc ra `number | null`, ghi vào thì **đồng thời lưu xuống kho lưu trữ**; `hydrateSessionState` nạp lại lúc `Layout` mount.

Vì atom là promise, component tiêu thụ chúng phải nằm dưới `Suspense` trong `Page` (mặc định đã vậy).
