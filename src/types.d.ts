export type Session = "SANG" | "CHIEU";

export type AppointmentStatus =
  | "Scheduled"
  | "CheckedIn"
  | "Completed"
  | "Cancelled"
  | "Missed"
  | "WaitListed";

export type NotificationKind =
  | "RESULT_READY"
  | "APPOINTMENT_REMINDER"
  | "APPOINTMENT_CHANGED";

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

export interface SlotAvailability {
  /** YYYY-MM-DD */
  date: string;
  session: Session;
  /** Số chỗ còn lại cho kênh app, máy chủ đã trừ quota 30%. */
  remaining: number;
}

export interface Appointment {
  id: number;
  /** Mã hiển thị, ví dụ HK260822088. Chỉ để đọc cho nhân viên nghe. */
  appointmentCode: string;
  patientId: number;
  department: Department;
  /** YYYY-MM-DD */
  apptDate: string;
  session: Session;
  status: AppointmentStatus;
  patientConfirmed: boolean;
  /** Yêu cầu chuẩn bị, ví dụ "nhịn ăn 8 tiếng". Không phải nội dung lâm sàng. */
  prepNote?: string;
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

export interface AppNotification {
  id: number;
  patientId: number;
  kind: NotificationKind;
  /** ISO 8601 */
  createdAt: string;
  title: string;
  /** Chỉ trạng thái. Không bao giờ chứa nội dung kết quả hay tên thuốc. */
  body: string;
  appointmentId?: number;
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
  reason?: string;
}
