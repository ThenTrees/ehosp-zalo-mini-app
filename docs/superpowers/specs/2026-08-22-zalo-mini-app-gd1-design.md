# Zalo Mini App cho người bệnh — Thiết kế giai đoạn 1

- **Ngày:** 2026-08-22
- **Kho mã front-end:** `d:/projects/eHosp-mini-app/my-doctor-app` (template ZaUI Doctor)
- **Kho mã back-end:** `d:/projects/eHosp` (`services/emr-api`)
- **Tài liệu nguồn:** `eHosp/docs/09-THIET-KE-DICH-VU/12-MOBILE-APP.md` · `03-APPOINTMENT.md`

---

## 1. Bối cảnh

Phòng khám ngoại trú phường (Nội · Ngoại · Sản · Nhi, chỉ thanh toán BHYT) đã có
hệ EMR riêng: React `emr-ui` + Node `emr-api` + OpenMRS Platform, chạy bằng Docker
Compose. Mini app là **bề mặt thứ hai cho người bệnh**, không phải hệ thống lưu trữ
riêng.

Hiện trạng chặn tiến độ:

| Thành phần | Hiện trạng |
|---|---|
| Migration cao nhất đã có | `012_lis_openelis.sql` |
| `modules/appointment` | chỉ có README — **chưa có dòng mã nào** |
| `modules/patient-app` | chỉ có README — **chưa có dòng mã nào** |
| Bảng lịch hẹn | **không tồn tại** |
| `emr_visit.queue_no` | đã có từ `003_clinical.sql` |
| `emr_patient_link.phone`, `.birthdate` | đã có |
| `emr_insurance_card.card_no` | đã có |
| Repo mini app | template ZaUI Doctor nguyên bản, toàn bộ dữ liệu là mock, **chưa init git** |

Nghĩa là chức năng trung tâm — đặt lịch — hiện **không có gì ở back-end để gọi**.
Đường găng nằm ở `eHosp`, không nằm ở repo mini app.

## 2. Quyết định đã chốt

| # | Quyết định | Ghi chú |
|---|---|---|
| D1 | Phạm vi bám sát `12-MOBILE-APP.md` | Không hiển thị nội dung lâm sàng |
| D2 | Gọi thẳng `emr-api`, thêm router `/api/patient-app/*` | Không dựng service mới, không serverless |
| D3 | Xác thực bằng số điện thoại Zalo + **yếu tố thứ hai** | Ngày sinh; thêm 4 số cuối thẻ BHYT khi trùng — xem §5.4 |
| D4 | Một tài khoản Zalo quản lý **nhiều hồ sơ** | Bố mẹ đặt lịch cho con |
| D5 | Người bệnh **được tự đặt lịch** | Kèm chính sách chống đặt rác |
| D6 | Mở **30%** công suất cho đặt trực tuyến | Đúng khuyến nghị §8 của tài liệu |
| D7 | Đặt sai khoa → **hàng đợi cho tiếp đón duyệt** | Màn hình mới trong `emr-ui` |
| D8 | Phiên người bệnh đi bằng **header Bearer**, không dùng cookie | Cookie bên thứ ba không đáng tin trong webview Zalo |

### 2.1. Vì sao không hiển thị bệnh án và đơn thuốc

Quyết định 31/QĐ-BYT (06/01/2026): Sổ sức khoẻ điện tử trên VNeID có giá trị pháp
lý tương đương bản giấy, chứa chẩn đoán, kết quả xét nghiệm, tên thuốc và liều
dùng; cơ sở KCB **bắt buộc** đồng bộ dữ liệu vào đó. Một màn hình xem bệnh án tự
xây là bản kém hơn thứ người bệnh đã có sẵn trong máy, cộng thêm toàn bộ rủi ro
riêng tư. Mini app chỉ báo **trạng thái** "kết quả đã có" và dẫn sang VNeID hoặc quầy.

Quyết định này đã được cân nhắc lại trong buổi thiết kế ngày 2026-08-22 và **giữ nguyên**.

## 3. Phạm vi giai đoạn 1

### Trong phạm vi

1. **Liên kết tài khoản** — SĐT Zalo + yếu tố thứ hai; nhiều hồ sơ; huỷ liên kết được và liên kết lại được
2. **Đặt lịch khám** — chọn khoa, ngày, buổi (sáng/chiều), nhận mã hẹn
3. **Lịch hẹn của tôi** — danh sách sắp tới, nút xác nhận / huỷ
4. **Số thứ tự hôm nay** — số của tôi, số đang gọi, ước tính thời gian chờ
5. **Thanh toán** — hoá đơn chưa trả + mã VietQR
6. **Thông báo "kết quả đã có"** — chỉ trạng thái, không nội dung

### Ngoài phạm vi (cố ý)

- Nội dung lâm sàng: chẩn đoán, kết quả xét nghiệm, tên thuốc, bệnh án
- Chọn bác sĩ cụ thể (đặt theo khoa + buổi; phân công bác sĩ do tiếp đón)
- Khám từ xa; phát hành lên App Store / Google Play
- Đường web dự phòng cho người không dùng Zalo — **giai đoạn 2**
- ZNS nhắc hẹn — **giai đoạn 2** (phụ thuộc dịch vụ 11 Communication)

## 4. Kiến trúc

```
Zalo Mini App  (my-doctor-app)
      |  HTTPS · Authorization: Bearer <phiên người bệnh>
      v
emr-api · router /api/patient-app/*      <- phiên riêng, chốt quyền riêng
      |
      +- modules/appointment   (mới · migration 014)
      +- modules/patient-app   (mới · migration 022)
      +- emr_visit.queue_no    (đã có)
      +- payment / VietQR      (dịch vụ 08)
```

### 4.1. Ranh giới không được vi phạm

Lấy nguyên từ `modules/patient-app/README.md`:

> Phiên của người bệnh và phiên của nhân viên **không dùng chung bảng và không
> dùng chung chốt quyền**; trộn hai loại là cách nhanh nhất để một tài khoản
> người bệnh đọc được hồ sơ của người khác.

Cụ thể:

- `/api/patient-app/*` **không** đi qua `requireAuth` / `requireRole` hiện có.
  Nó có middleware riêng `requirePatientSession`.
- `ADMIN` bỏ qua mọi chốt vai trò của API nhân viên — danh tính người bệnh **không
  bao giờ** mang vai trò nào trong hệ vai trò nhân viên.
- Mô-đun này **sở hữu quyền ghi duy nhất một bảng**: `emr_patient_app_link`. Mọi
  dữ liệu khác đọc qua API của mô-đun sở hữu, **không `JOIN` thẳng**.

### 4.2. Phiên người bệnh

`emr-ui` dùng cookie HttpOnly `emr_sid` với `credentials: 'include'`. Mini app chạy
trong webview Zalo ở origin khác — cookie bên thứ ba trong webview không đáng tin
cậy. Phiên người bệnh dùng **header `Authorization: Bearer`**, lưu bằng `zmp-sdk`
storage phía client.

Hai loại phiên:

| Loại | Cách lấy | Hạn | Làm được gì |
|---|---|---|---|
| **Phiên app** | `POST /link` sau khi xác minh 2 yếu tố | dài (30 ngày, gia hạn) | Toàn bộ chức năng |
| **Phiên ngắn hạn** | `POST /redeem` bằng mã hẹn | ngắn (30 phút) | Chỉ xem/xác nhận/huỷ đúng một lịch hẹn + xem số thứ tự |

## 5. Mô hình dữ liệu

### 5.1. `022_patient_app.sql` — bảng mới

`emr_patient_app_link` theo đúng DDL ở §5 của `12-MOBILE-APP.md`. Điểm quan trọng
đã được ghi sẵn trong tài liệu và phải giữ: `revoked_at` dùng **giá trị mốc
`9999-12-31 23:59:59`** thay cho `NULL`, và nằm trong khoá duy nhất — nếu không,
phụ huynh lỡ tay huỷ liên kết sẽ bị khoá vĩnh viễn khỏi hồ sơ của con.

### 5.2. `014_appointment.sql` — bổ sung so với bản thiết kế

Bản thiết kế Appointment vẽ sẵn "người bệnh đặt qua Mini App -> `Scheduled`", nhưng
mô hình dữ liệu chưa có chỗ cho việc đó. Ba bổ sung:

| Cột | Bảng | Lý do |
|---|---|---|
| `kind` thêm giá trị `KHAM_MOI` | `emr_appointment` | Lượt khám mới đặt từ app không phải `TAI_KHAM` cũng không phải `XET_NGHIEM` |
| `source VARCHAR(20) NOT NULL DEFAULT 'STAFF'` (`STAFF` / `PATIENT_APP`) | `emr_appointment` | Phân biệt nguồn để lọc hàng đợi duyệt và để chặn XML14 |
| `online_quota_pct TINYINT NOT NULL DEFAULT 30` | `emr_provider_availability` | Quyết định D6, cấu hình được theo bác sĩ/buổi |

**Ràng buộc XML14:** giấy hẹn khám lại (Bảng 14, QĐ 130/QĐ-BYT) là giấy **do bác sĩ
cấp**. Lịch hẹn tự đặt từ app **không** sinh XML14 và **không** đẩy dòng nào vào
outbox của dịch vụ 7. Điều kiện sinh XML14: `kind = 'TAI_KHAM' AND source = 'STAFF'`.

**`created_by`** với lịch đặt từ app ghi `patient-app:<link_id>`.

### 5.3. Tính slot trống

```
slot_kha_dung(khoa, ngày, buổi)
  = tổng slot từ emr_provider_availability (khớp day_of_week, session, active)
  +- emr_availability_exception (nghỉ lễ / bác sĩ nghỉ / mở thêm)
  -  lịch hẹn đang giữ chỗ (status IN Scheduled, CheckedIn, WaitListed)

slot_mo_cho_app = floor(slot_kha_dung * online_quota_pct / 100)
```

Đặt vượt (`overbook_extra`) **không áp dụng cho kênh app** ở giai đoạn 1 — tài liệu
xếp đặt vượt cuối bảng vì nó chuyển vấn đề ghế trống của phòng khám thành vấn đề
chờ lâu của người bệnh.

### 5.4. Quy tắc xác minh khi liên kết (D3)

Rủi ro số 1 là liên kết nhầm: số điện thoại trong `emr_patient_link` có thể là của
người nhà, và một số điện thoại thường ứng với **nhiều** hồ sơ (cả nhà dùng chung).
Quy tắc dứt khoát:

1. Lấy số điện thoại đã được Zalo xác thực, tìm mọi `emr_patient_link` khớp `phone`.
2. **0 hồ sơ** → không tạo liên kết. Hướng dẫn người bệnh tới quầy tiếp đón
   (`linked_method = STAFF_ASSISTED` là đường liên kết còn lại, làm ở GĐ2).
3. **1 hồ sơ trở lên** → yêu cầu nhập **ngày sinh**. Chỉ những hồ sơ khớp cả
   `phone` và `birthdate` mới đi tiếp.
4. Sau bước 3 mà **vẫn còn nhiều hơn một hồ sơ** (anh chị em sinh đôi, trùng dữ
   liệu) → yêu cầu thêm **4 số cuối `emr_insurance_card.card_no`** của đúng hồ sơ
   muốn liên kết.
5. Mỗi hồ sơ liên kết là **một dòng riêng** trong `emr_patient_app_link`. Muốn thêm
   hồ sơ người thân thì chạy lại toàn bộ quy trình này cho hồ sơ đó.

Server **không bao giờ** trả về danh sách hồ sơ khớp trước khi xác minh xong — nếu
không, endpoint này thành công cụ dò xem một số điện thoại có phải bệnh nhân của
phòng khám hay không. Sai ở bất kỳ bước nào đều trả về cùng một thông báo chung.

## 6. Hợp đồng API

Đúng 13 endpoint ở §6 của `12-MOBILE-APP.md`:

| Method | Đường dẫn | Xác thực |
|---|---|---|
| POST | `/api/patient-app/link` | Zalo token + yếu tố thứ hai |
| GET | `/api/patient-app/me` | Phiên app |
| GET | `/api/patient-app/departments` | Công khai |
| GET | `/api/patient-app/slots?department=&date=` | Phiên app |
| POST | `/api/patient-app/appointments` | Phiên app |
| POST | `/api/patient-app/redeem` | Mã hẹn **trong thân JSON** |
| POST | `/api/patient-app/appointments/:id/confirm` | Phiên ngắn hạn |
| POST | `/api/patient-app/appointments/:id/cancel` | Phiên ngắn hạn |
| GET | `/api/patient-app/queue` | Phiên ngắn hạn |
| GET | `/api/patient-app/invoices` | Phiên app |
| GET | `/api/patient-app/invoices/:id/qr` | Phiên app |
| GET | `/api/patient-app/notifications` | Phiên app |

Bổ sung cho D4 (nhiều hồ sơ): `GET /api/patient-app/me` trả **danh sách hồ sơ đã
liên kết**; mọi endpoint đọc dữ liệu nhận thêm tham số `patient_id`, và server
kiểm tra `patient_id` đó thuộc danh sách liên kết còn hiệu lực của phiên hiện tại.

Bổ sung thứ hai — **thiếu trong bản gốc §6**: danh sách 13 endpoint có
`POST /appointments` để tạo nhưng không có đường nào để **đọc** lịch hẹn, trong khi
"Lịch hẹn của tôi" là chức năng số 3 của GĐ1. Thêm:

| Method | Đường dẫn | Xác thực |
|---|---|---|
| GET | `/api/patient-app/appointments?patient_id=&from=&to=` | Phiên app |
| GET | `/api/patient-app/appointments/:id` | Phiên app **hoặc** phiên ngắn hạn |

`:id` ở đây là khoá chính, **không phải** mã hẹn — không vi phạm quy tắc "không đặt
mã hẹn trong URL" ở §6.2, vì phiên đã xác định người gọi trước khi tới đường dẫn này.

### 6.1. Ba quy tắc bắt buộc

1. **Không endpoint nào trả nội dung lâm sàng.** Không chẩn đoán, không kết quả,
   không tên thuốc. Chỉ trạng thái.
2. **Giới hạn tần suất theo `external_id` và theo IP**; khoá sau 20 lần `redeem`
   thất bại liên tiếp.
3. **Mọi truy cập ghi `emr_access_log`** với `username = patient-app:<id>`.

### 6.2. Mã hẹn — hai mã, không phải một

Mã hiển thị theo `03-APPOINTMENT.md` §5.1 có dạng `HK` + `YYMMDD` + id dòng, tức là
**đoán được**. Ghép với ngày sinh (không gian nhỏ, thường biết được), người lạ có
thể xem số thứ tự và huỷ lịch hẹn của người khác.

| Mã | Dùng để | Yêu cầu |
|---|---|---|
| `appointment_code` | Hiển thị, đọc qua điện thoại | Ngắn, dễ đọc |
| `redeem_token` | Đổi lấy phiên ngắn hạn | **>= 10 ký tự ngẫu nhiên**, dùng một lần, có hạn, gửi trong thân JSON |

Không mã nào được nằm trong URL — quy ước §4.4 của `00-TONG-QUAN.md`.

## 7. Front-end — repo `my-doctor-app`

### 7.1. Việc dọn dẹp template

| Việc | Tệp |
|---|---|
| Đổi `title` và `template.oaID` sang OA thật (đang là `4318657068771012646` của Zalo) | `app-config.json` |
| Đổi `--primary` và các biến chủ đề | `src/css/app.scss` |
| Bỏ route ngoài phạm vi: `/ask`, `/feedback`, `/news/:id`, `/explore`, `/service/:id`, `/department/:id`, `/categories`, `/search` | `src/router.tsx` + thư mục trang tương ứng |
| Bỏ bước chọn bác sĩ trong luồng đặt lịch | `src/pages/booking/` |

### 7.2. Route giai đoạn 1

| Đường dẫn | Trang | `handle` |
|---|---|---|
| `/` | Trang chủ — lịch hẹn sắp tới + số thứ tự hôm nay + CTA đặt lịch | — |
| `/link` | Liên kết tài khoản (SĐT Zalo, rồi yếu tố thứ hai) | `back`, `title` |
| `/profiles` | Danh sách hồ sơ đã liên kết, chuyển hồ sơ đang xem, huỷ liên kết | `back`, `title` |
| `/booking/:step?` | Đặt lịch: khoa, ngày + buổi, xác nhận | `back`, `title: "Đặt lịch khám"` |
| `/appointments` | Lịch hẹn của tôi | — |
| `/appointments/:id` | Chi tiết + xác nhận / huỷ | `back`, `title: "custom"` |
| `/queue` | Số thứ tự hôm nay | `back`, `title` |
| `/invoices` | Hoá đơn chưa trả | `back`, `title: "Hóa đơn"` |
| `/invoices/:id/qr` | Mã VietQR | `back`, `title` |
| `/notifications` | Thông báo (chỉ trạng thái) | `back`, `title` |

### 7.3. Tầng dữ liệu

`src/state.ts` giữ nguyên vai trò **ranh giới duy nhất giữa UI và dữ liệu** — đây
là điểm mạnh sẵn có của template và không thay đổi.

```
src/services/patient-app-api.ts   <- khớp chính xác hợp đồng §6, gắn Bearer
src/services/fake/                <- fake khớp cùng hợp đồng, bật bằng biến môi trường
src/state.ts                      <- atom gọi vào services, UI không đổi
src/types.d.ts                    <- viết lại theo hợp đồng §6, bỏ type của template
```

Vì hợp đồng API **đã được viết ra trước**, front-end không phải chờ back-end. Khi
`emr-api` xong, đổi một lá cờ môi trường.

Hồ sơ đang xem là một atom (`activePatientIdState`, lưu bằng `zmp-sdk` storage);
mọi atom dữ liệu là `atomFamily` khoá theo `patient_id` để chuyển hồ sơ không lẫn dữ liệu.

## 8. Chính sách vận hành

| Chính sách | Giá trị GĐ1 |
|---|---|
| Công suất mở cho đặt online | 30% (D6), cấu hình theo bác sĩ/buổi |
| Số lịch hẹn đang mở tối đa / hồ sơ | 2 |
| Chặn đặt lịch vì bỏ hẹn | 3 lần `Missed` trong 90 ngày, sau đó chỉ đặt được qua tiếp đón |
| Hạn huỷ | Huỷ tự do đến trước giờ hẹn; huỷ sau giờ hẹn không được (đã `Missed`) |
| `Missed` | Job cuối ngày, quá giờ hẹn + 4 tiếng mà vẫn `Scheduled` (quy tắc R2) |
| Không phản hồi tin nhắc | **Không** tự huỷ (quy tắc R1) |

### 8.1. Hàng đợi duyệt đặt sai khoa (D7)

Màn hình mới trong `emr-ui`: lọc `source = PATIENT_APP AND status = Scheduled`,
sắp theo `appt_date`. Tiếp đón đổi `department_id`, ghi `audit(...)`, và tạo ý định
gửi tin báo lại cho người bệnh (dịch vụ 11 — GĐ2; GĐ1 gọi điện thủ công).

## 9. Rủi ro

| # | Rủi ro | Mức | Xử lý |
|---|---|---|---|
| 1 | Liên kết nhầm tài khoản với hồ sơ — SĐT trong hồ sơ có thể của người nhà | **Cao** | Bắt buộc 2 yếu tố; huỷ liên kết được; ghi `emr_access_log` |
| 2 | `redeem` là bề mặt dò mã hẹn | **Cao** | Token ngẫu nhiên >= 10 ký tự, dùng một lần, rate limit, khoá sau 20 lần sai |
| 3 | Đường găng nằm ở repo khác (`013` -> `014` -> `022`) | **Cao** | Front-end chạy song song trên fake khớp hợp đồng |
| 4 | Zalo từ chối duyệt nội dung y tế | Trung bình | Chuẩn bị giấy phép hoạt động KCB từ đầu |
| 5 | Đặt lịch rác | Trung bình | Giới hạn 2 hẹn mở / hồ sơ; chặn sau 3 lần bỏ hẹn |
| 6 | Phiên `emr-api` lưu trong bộ nhớ tiến trình | Trung bình | Phiên người bệnh **không** dùng lại cơ chế đó; cần lưu bền để restart không đăng xuất toàn bộ người bệnh |
| 7 | Phụ thuộc nền tảng Zalo | Trung bình | Đường web song song — GĐ2 |

## 10. Tiêu chí hoàn thành

Kế thừa nguyên §9 của `12-MOBILE-APP.md`, phần áp dụng cho GĐ1:

- [ ] Người bệnh đặt được lịch trong <= 4 thao tác từ trong Zalo
- [ ] Xem được số thứ tự hôm nay và số đang gọi
- [ ] **Không endpoint nào của app trả về chẩn đoán, kết quả hoặc tên thuốc** (kiểm bằng rà soát API)
- [ ] Liên kết tài khoản cần **hai** yếu tố
- [ ] Huỷ liên kết được, có hiệu lực ngay, **và liên kết lại được sau đó**
- [ ] **Không endpoint nào của app nhận mã hẹn qua URL** (kiểm bằng rà soát định tuyến)
- [ ] Dò 20 mã hẹn sai liên tiếp thì bị khoá tần suất
- [ ] Một tài khoản Zalo quản lý được nhiều hồ sơ
- [ ] Mọi truy cập từ app có trong `emr_access_log`
- [ ] Lịch hẹn `source = PATIENT_APP` **không** sinh XML14
- [ ] Chỉ 30% công suất mỗi buổi mở cho kênh app

Hoãn sang GĐ2: nút CTA trong ZNS mở thẳng lịch hẹn; đường web cho người không dùng Zalo.

## 11. Thứ tự thực hiện

| Khối | Kho mã | Nội dung | Phụ thuộc |
|---|---|---|---|
| **A** | `eHosp` | `013` Encounter, `014` Appointment (+3 bổ sung §5.2), `022` patient-app | đường găng |
| **A2** | `eHosp` | Router `/api/patient-app/*`, phiên người bệnh, rate limit, access log | sau A |
| **B** | `my-doctor-app` | `git init`; dọn template; route mới; `patient-app-api.ts` + fake khớp hợp đồng | **song song với A** |
| **C** | cả hai | Nối B vào A2, bỏ fake | sau A2 + B |
| **D** | `eHosp` | Màn hình hàng đợi duyệt trong `emr-ui` | sau A2 |
| **E** | GĐ2 | ZNS nhắc hẹn (dịch vụ 11), VietQR (dịch vụ 08), đường web dự phòng | sau C |

## 12. Việc cần làm ở kho `eHosp` (ngoài phần mã)

- Sửa `docs/09-THIET-KE-DICH-VU/03-APPOINTMENT.md` §4: thêm `KHAM_MOI`, `source`, `online_quota_pct` và ràng buộc XML14
- Cập nhật bảng hiện trạng trong `services/emr-api/src/modules/README.md` khi mô-đun 03 và 12 chuyển sang "có một phần"
- Ghi lại quyết định D5–D8 vào §8 của `12-MOBILE-APP.md` (ba câu hỏi "cần quyết" nay đã có đáp án)
