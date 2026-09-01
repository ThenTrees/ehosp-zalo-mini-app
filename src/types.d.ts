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

/** Máy chủ cần thêm yếu tố xác minh trước khi cho liên kết. Spec §5.4. */
export interface LinkChallenge {
  outcome: "CHALLENGE";
  need: "BIRTHDATE" | "INSURANCE_LAST4";
}

export interface LinkSuccess {
  outcome: "LINKED";
  token: string;
  profiles: PatientProfile[];
}

export type LinkResponse = LinkChallenge | LinkSuccess;

export interface LinkInput {
  /** Token do getPhoneNumber() của zmp-sdk trả về. Máy chủ đổi ra số thật. */
  zaloPhoneToken: string;
  /** YYYY-MM-DD — yếu tố thứ hai. */
  birthdate?: string;
  /** 4 số cuối thẻ BHYT — chỉ khi máy chủ yêu cầu. */
  insuranceLast4?: string;
}

export interface CreateAppointmentInput {
  patientId: number;
  departmentId: number;
  /** YYYY-MM-DD */
  date: string;
  session: Session;
}
