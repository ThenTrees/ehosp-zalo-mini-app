---
paths:
  - "src/state.ts"
  - "src/types.d.ts"
  - "src/services/**/*.ts"
  - "src/pages/**/*.tsx"
  - "src/components/**/*.tsx"
---

# State (`src/state.ts`) và tầng dữ liệu (`src/services/`)

`src/state.ts` là **ranh giới duy nhất giữa UI và dữ liệu**. Trang chỉ đọc atom; không trang nào tự gọi mạng, trừ hai chỗ có lý do (`pages/link` gọi `api.link` trong luồng nhiều bước, `pages/invoices/qr` lấy mã dùng một lần).

## `src/services/`

| Tệp | Việc |
|---|---|
| `config.ts` | Đọc `import.meta.env` thành `RuntimeConfig` |
| `session.ts` | Lưu/đọc/xoá phiên Bearer qua kho lưu trữ `zmp-sdk` |
| `http.ts` | `fetch` + header Bearer + `ApiError`; **`buildUrl` ném lỗi nếu ai đó đưa `code`/`token` vào query string** |
| `patient-app-api.ts` | `interface PatientAppApi` — hợp đồng §6 của spec — và cài đặt HTTP thật |
| `fake/` | Cài đặt giả cùng interface, mô phỏng cả quota 30% và luật tối đa 2 lịch hẹn đang mở |
| `index.ts` | Chọn thật/giả theo `VITE_USE_FAKE`, giữ token hiện hành |

Đổi sang back-end thật = đặt `VITE_USE_FAKE=false` và `VITE_API_BASE_URL` trong `.env`. Không sửa dòng mã nào.

## Quy ước atom

- Danh mục: atom async phẳng (`departmentsState`).
- **Mọi atom đọc dữ liệu của người bệnh là `atomFamily` khoá theo `patientId`** (`appointmentsState`, `queueState`, `invoicesState`, `notificationsState`) — chuyển hồ sơ người thân không được lẫn dữ liệu.
- Cần làm mới sau khi ghi thì dùng `atomWithRefresh` và gọi setter không tham số.
- Form nhiều bước: `atomWithReset` (`bookingFormState`) đọc/ghi chung qua các bước.
- `activePatientIdState` đọc ra `number | null`, ghi vào thì **đồng thời lưu xuống kho lưu trữ**; `hydrateSessionState` nạp lại lúc `Layout` mount.

Vì atom là promise, component tiêu thụ chúng phải nằm dưới `Suspense` trong `Page` (mặc định đã vậy).
