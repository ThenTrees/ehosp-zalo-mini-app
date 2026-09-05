export type Session = "SANG" | "CHIEU";

/**
 * Đúng năm giá trị mà `trangThaiHenChoApp()` của eHosp có thể trả về.
 *
 * Không có "WaitListed": `data/enums.csv` của eHosp không có mã nào như vậy
 * trong nhóm APPOINTMENT_STATUS, nên mọi nhánh xử lý nó ở đây là mã chết —
 * và mã chết trong bảng trạng thái là thứ khiến người sau tin rằng máy chủ
 * biết một trạng thái mà nó không hề biết.
 */
export type AppointmentStatus =
  | "Scheduled"
  | "CheckedIn"
  | "Completed"
  | "Cancelled"
  | "Missed";

/** Mã trạng thái lượt khám, y nguyên nhóm VISIT_STATUS của eHosp. */
export type VisitStatus = "WAITING" | "IN_PROGRESS" | "DONE" | "CANCELLED";

/**
 * Mã trạng thái đơn thuốc, nhóm PRESCRIPTION_STATUS của eHosp.
 *
 * Không có "DRAFT": máy chủ lọc đơn nháp ra khỏi kết quả trước khi trả về —
 * xem `tomTatDonThuoc()` trong `modules/patient-app/service.ts`.
 */
export type PrescriptionStatus = "ISSUED" | "DISPENSED" | "CANCELLED";

export interface PatientProfile {
  patientId: number;
  patientCode: string;
  fullName: string;
  gender: "M" | "F" | "U";
  /** YYYY-MM-DD */
  birthdate: string;
  /** Chỉ 4 số cuối, máy chủ đã che phần còn lại. */
  insuranceLast4?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
}

/**
 * Một buổi khám có nhận đặt lịch hay không.
 *
 * Cố ý KHÔNG có "số chỗ còn lại": eHosp chưa có mô hình công suất theo
 * khoa/buổi, nên máy chủ chỉ biết được đến mức "còn nhận" hay "không nhận".
 * Hiện một con số bịa ra cho người bệnh tệ hơn hẳn việc nói đúng thứ đang biết.
 */
export interface SlotAvailability {
  /** YYYY-MM-DD */
  date: string;
  session: Session;
  available: boolean;
}

export interface Appointment {
  id: number;
  /** Mã hiển thị, ví dụ HK2608300001. Chỉ để đọc cho nhân viên nghe. */
  appointmentCode: string;
  patientId: number;
  department: Department;
  /** YYYY-MM-DD */
  apptDate: string;
  session: Session;
  status: AppointmentStatus;
  patientConfirmed: boolean;
  /**
   * Lý do đi khám người bệnh đã ghi lúc đặt. `null` khi để trống.
   *
   * Trả về để họ XEM LẠI được. Không có nó thì ô lý do là một cái hố: viết
   * xong không biết máy chủ có nhận không, và lần sau sẽ gõ lại từ đầu.
   */
  lyDo: string | null;
}

export interface QueueStatus {
  patientId: number;
  /** Số thứ tự của tôi hôm nay; null khi chưa vào hàng đợi. */
  myNumber: number | null;
  /** Số đang được gọi tại phòng. */
  currentNumber: number | null;
  roomName: string | null;
  estimatedWaitMinutes: number | null;
}

/**
 * Một lần khám, ở mức người bệnh nhận ra "hôm ấy tôi có đi khám".
 *
 * KHÔNG có chẩn đoán, KHÔNG có kết quả — spec §6.1 quy tắc 1. Muốn xem nội
 * dung lâm sàng thì tới quầy hoặc tra Sổ sức khoẻ điện tử; mini app không phải
 * là bề mặt phát hành hồ sơ bệnh án.
 */
export interface VisitSummary {
  id: number;
  visitCode: string;
  /** YYYY-MM-DD */
  visitDate: string;
  status: VisitStatus;
  /** Tra tên khoa qua danh mục `/departments`, máy chủ không trả kèm tên. */
  departmentId: number;
  /**
   * Chẩn đoán CHÍNH, đi kèm ngay trong danh sách.
   *
   * Người bệnh mở màn Lịch sử khám để tìm "lần tôi bị viêm phế quản", không
   * phải "VK2026090200049". `null` khi lượt ấy chưa có chẩn đoán — khác với
   * chuỗi rỗng, và màn hình phải im lặng chứ không vẽ một dòng trống.
   */
  chanDoanChinh: { ma: string; ten: string } | null;
}

/**
 * Một đơn thuốc, ở mức "đã kê / đã phát / đã huỷ".
 *
 * KHÔNG có tên thuốc, KHÔNG có liều dùng — spec §6.1 quy tắc 1.
 * `visitId` là thứ nối đơn này về đúng lần khám đã sinh ra nó.
 */
export interface PrescriptionSummary {
  id: number;
  code: string;
  status: PrescriptionStatus;
  /** YYYY-MM-DD */
  issuedDate: string;
  visitId: number;
}

export interface InvoiceSummary {
  id: number;
  /** YYYY-MM-DD */
  visitDate: string;
  /** Phần người bệnh phải trả, đơn vị VND. */
  amountDue: number;
  paid: boolean;
}

export interface VietQrPayload {
  invoiceId: number;
  /** Chuỗi nội dung để dựng mã QR. */
  qrContent: string;
  amount: number;
  /** ISO 8601 */
  expiresAt: string;
}


export interface CreateAppointmentInput {
  patientId: number;
  departmentId: number;
  /** YYYY-MM-DD */
  date: string;
  session: Session;
  /**
   * Lý do đi khám. Tối đa 500 ký tự — máy chủ cắt, không từ chối.
   * KHÔNG bắt buộc: xem lý lẽ ở `pages/booking/step3.tsx`.
   */
  reason?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * NỘI DUNG LÂM SÀNG — chi tiết một lượt khám
 *
 * ⚠ ĐÂY LÀ CHỖ RÀNG BUỘC CŨ BỊ ĐẢO, VÀ NÓ ĐƯỢC ĐẢO CÓ CHỦ Ý.
 * Tới 2026-09-03, mini app cố ý KHÔNG mang nội dung lâm sàng: không chẩn đoán,
 * không tên thuốc, không trị xét nghiệm. Lý lẽ khi ấy là Sổ sức khoẻ điện tử
 * trên VNeID đã làm việc đó và có giá trị pháp lý tương đương bản giấy
 * (QĐ 31/QĐ-BYT), nên tự dựng màn xem bệnh án là làm bản kém hơn kèm toàn bộ
 * rủi ro riêng tư.
 *
 * Chủ phòng khám đã quyết khác: người bệnh xem được toàn bộ bệnh sử của CHÍNH
 * MÌNH ngay trong app. Đó là quyền của họ theo Điều 10 Luật KCB 15/2023 — nên
 * đây là lựa chọn về NƠI cung cấp, không phải một lần nới lỏng.
 *
 * `no-clinical-content.test.ts` KHÔNG bị xoá: nó được viết lại thành luật mới,
 * vẫn khoá từng trường bằng danh sách trắng. Ràng buộc còn nguyên hình dạng,
 * chỉ rộng ra — và rộng ra đúng những trường đã liệt kê ở đây, không hơn.
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Sinh hiệu đo tại buồng khám. Từng trị `null` nghĩa là KHÔNG ĐO, khác với 0.
 *
 * Máy chủ trả cả khối là `null` khi lượt khám không đo gì — nên màn hình phân
 * biệt được "chưa đo" với "đo rồi mà mọi trị đều rỗng", hai chuyện khác nhau.
 */
export interface SinhHieu {
  mach: number | null;
  nhietDo: number | null;
  huyetApTamThu: number | null;
  huyetApTamTruong: number | null;
  nhipTho: number | null;
  spo2: number | null;
  chieuCaoCm: number | null;
  canNangKg: number | null;
  duongHuyet: number | null;
}

export interface ChanDoan {
  ma: string;
  ten: string;
  chinh: boolean;
}

export interface ThuocDaKe {
  ten: string;
  tenThuongMai: string | null;
  hamLuong: string | null;
  duongDung: string | null;
  soLuong: number;
  donVi: string | null;
  lieu: string | null;
  soLan: string | null;
  soNgay: number | null;
  loiDan: string | null;
}

export interface DonThuocChiTiet {
  code: string;
  issuedDate: string | null;
  status: string;
  thuoc: ThuocDaKe[];
  /**
   * Bản PDF đã ký của CHÍNH đơn này. `null` khi đơn chưa đóng băng — và đó là
   * phần lớn (72/1894 lượt khám có tệp trên cụm hôm nay), nên màn hình phải
   * NÓI RA khi không có thay vì ẩn nút đi im lặng.
   */
  taiLieuId: number | null;
}

export interface ChiSoXetNghiem {
  ma: string;
  ten: string;
  tri: string | null;
  donVi: string | null;
  thapNhat: number | null;
  caoNhat: number | null;
  khoangChu: string | null;
  /** Cờ do PHÒNG XÉT NGHIỆM chấm (H/L/A…), không phải thứ app tự suy. */
  co: string | null;
  ghiChu: string | null;
}

export interface PhieuXetNghiem {
  accessionNo: string;
  serviceName: string | null;
  ketQuaLuc: string | null;
  chiSo: ChiSoXetNghiem[];
}

export interface DongBangKe {
  item_name: string;
  unit: string | null;
  quantity: string | number;
  unit_price: string | number;
  amount: string | number;
  bhyt_pay: string | number;
  patient_pay: string | number;
}

export interface BangKeLuotKham {
  code: string;
  total_amount: string | number;
  bhyt_amount: string | number;
  patient_amount: string | number;
  status: string;
  items: DongBangKe[];
}

export interface TaiLieuDaKy {
  id: number;
  loai: string;
  banSo: number;
  tenHienThi: string | null;
  soByte: number | null;
}

export interface ChiTietLuotKham {
  visitId: number;
  visitCode: string;
  visitDate: string | null;
  status: string;
  departmentName: string | null;
  chanDoan: ChanDoan[];
  /** `null` = lượt khám chưa đo sinh hiệu. */
  sinhHieu: SinhHieu | null;
  /** Lời dặn của bác sĩ — viết ĐỂ người bệnh đọc, trước đây chỉ có trên giấy. */
  loiDan: string | null;
  ngayTaiKham: string | null;
  donThuoc: DonThuocChiTiet[];
  /** `null` = dịch vụ cận lâm sàng không trả lời được, KHÁC với mảng rỗng. */
  xetNghiem: PhieuXetNghiem[] | null;
  /** `null` = chưa có bảng kê, hoặc dịch vụ tài chính không trả lời được. */
  bangKe: BangKeLuotKham | null;
  /**
   * Giấy tờ ĐÃ KÝ và đóng băng của lượt khám. Khác với bốn nhóm trên: chúng
   * đọc lại từ CSDL mỗi lần mở, còn đây là những tờ đã khoá trong ngăn
   * ghi-một-lần — bản người bệnh cầm đi đâu cũng đối chiếu được.
   */
  taiLieu: TaiLieuDaKy[];
}

/* ─────────────────────── Tài khoản: ghi danh và đăng nhập ─────────────── */

export interface GhiDanhInput {
  soDinhDanh: string;
  insuranceLast4: string;
  matKhau: string;
}

export interface GhiDanhResponse {
  token: string;
  patientId: number;
  fullName: string;
}

export interface DangNhapInput {
  soDinhDanh: string;
  matKhau: string;
}

/** Vé mở tệp tài liệu — xem `PatientAppApi.veTaiLieu`. */
export interface VeTaiLieu {
  ve: string;
  /** Hạn của vé, tính bằng mili giây kể từ lúc đúc. */
  hanMs: number;
}
