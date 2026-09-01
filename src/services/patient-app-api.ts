import { request } from "./http";
import type {
  Appointment,
  CreateAppointmentInput,
  Department,
  InvoiceSummary,
  LinkInput,
  LinkResponse,
  PatientProfile,
  PrescriptionSummary,
  QueueStatus,
  SlotAvailability,
  VietQrPayload,
  VisitSummary,
} from "@/types";

/**
 * Hợp đồng API người bệnh — spec §6, đối chiếu từng dòng với
 * `eHosp/services/emr-api/src/modules/patient-app/router.ts`.
 *
 * Tầng giả và tầng thật cùng cài đặt interface này, nên đổi giữa hai bên chỉ là
 * đổi một biến môi trường.
 */
export interface PatientAppApi {
  link(input: LinkInput): Promise<LinkResponse>;
  me(): Promise<{ profiles: PatientProfile[] }>;
  departments(): Promise<Department[]>;
  slots(params: {
    departmentId: number;
    date: string;
  }): Promise<SlotAvailability[]>;
  createAppointment(input: CreateAppointmentInput): Promise<Appointment>;
  appointments(params: { patientId: number }): Promise<Appointment[]>;
  appointment(params: { id: number; patientId: number }): Promise<Appointment>;
  confirmAppointment(params: {
    id: number;
    patientId: number;
  }): Promise<Appointment>;
  cancelAppointment(params: {
    id: number;
    patientId: number;
    reason: string;
  }): Promise<Appointment>;
  queue(params: { patientId: number }): Promise<QueueStatus>;
  visits(params: { patientId: number }): Promise<VisitSummary[]>;
  prescriptions(params: { patientId: number }): Promise<PrescriptionSummary[]>;
  invoices(params: { patientId: number }): Promise<InvoiceSummary[]>;
  invoiceQr(id: number): Promise<VietQrPayload>;
  unlink(patientId: number): Promise<void>;
}

/**
 * Khuôn trả về của các tuyến danh sách.
 *
 * `/appointments`, `/slots`, `/visits`, `/prescriptions` bọc kết quả trong
 * `{ results: [...] }`; riêng `/invoices` trả mảng trần. Đó là hiện trạng của
 * `router.ts`, không phải lựa chọn của mini app — nên chỗ duy nhất biết sự
 * khác biệt ấy là hàm `boc()` ngay dưới đây.
 */
interface Boc<T> {
  results: T[];
}

/**
 * Bóc `{results}` mà vẫn chịu được mảng trần.
 *
 * Chấp nhận cả hai dạng chứ không khẳng định một dạng: nếu mai kia một tuyến
 * đổi khuôn, màn hình vẫn hiện đúng danh sách thay vì hiện rỗng — và danh sách
 * rỗng là kiểu hỏng tệ nhất ở đây, vì nó trông y hệt "bạn chưa có dữ liệu nào".
 */
function boc<T>(payload: Boc<T> | T[] | null | undefined): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  return Array.isArray(payload?.results) ? payload.results : [];
}

export function createHttpApi(
  baseUrl: string,
  getToken: () => string | null,
  fetchImpl?: typeof fetch,
): PatientAppApi {
  const call = <T>(
    path: string,
    init: {
      method?: "GET" | "POST";
      query?: Record<string, string | number | undefined>;
      body?: unknown;
      anonymous?: boolean;
    } = {},
  ) =>
    request<T>({
      baseUrl,
      path,
      method: init.method,
      query: init.query,
      body: init.body,
      token: init.anonymous ? null : getToken(),
      fetchImpl,
    });

  return {
    link: (input) =>
      call("/link", { method: "POST", body: input, anonymous: true }),

    me: () => call("/me"),

    departments: () => call("/departments", { anonymous: true }),

    slots: async ({ departmentId, date }) =>
      boc(
        await call<Boc<SlotAvailability>>("/slots", {
          query: { department_id: departmentId, date },
        }),
      ),

    /*
     * Thân yêu cầu đi bằng snake_case vì router đọc `body.patient_id` và
     * `body.department_id`. Gửi camelCase thì `Number(undefined)` ra NaN và
     * máy chủ trả 404 "Không tìm thấy hồ sơ" — một thông báo không hề gợi ý
     * rằng lỗi nằm ở tên trường.
     */
    createAppointment: ({ patientId, departmentId, date, session }) =>
      call("/appointments", {
        method: "POST",
        body: {
          patient_id: patientId,
          department_id: departmentId,
          date,
          session,
        },
      }),

    appointments: async ({ patientId }) =>
      boc(
        await call<Boc<Appointment>>("/appointments", {
          query: { patient_id: patientId },
        }),
      ),

    /*
     * Mọi tuyến đọc đều phải kèm `patient_id`: `phamVi()` ở máy chủ dùng nó để
     * đối chiếu lại với các hồ sơ mà phiên được phép xem. Một tài khoản chỉ
     * liên kết đúng một hồ sơ thì thiếu tham số này vẫn chạy, nên lỗi sẽ chỉ lộ
     * ra với người dùng có nhiều hồ sơ — tức là đúng những người thân đang giữ
     * hồ sơ của con hoặc cha mẹ.
     */
    appointment: ({ id, patientId }) =>
      call(`/appointments/${id}`, { query: { patient_id: patientId } }),

    confirmAppointment: ({ id, patientId }) =>
      call(`/appointments/${id}/confirm`, {
        method: "POST",
        body: { patient_id: patientId },
      }),

    cancelAppointment: ({ id, patientId, reason }) =>
      call(`/appointments/${id}/cancel`, {
        method: "POST",
        body: { patient_id: patientId, reason },
      }),

    queue: ({ patientId }) =>
      call("/queue", { query: { patient_id: patientId } }),

    visits: async ({ patientId }) =>
      boc(
        await call<Boc<VisitSummary>>("/visits", {
          query: { patient_id: patientId },
        }),
      ),

    prescriptions: async ({ patientId }) =>
      boc(
        await call<Boc<PrescriptionSummary>>("/prescriptions", {
          query: { patient_id: patientId },
        }),
      ),

    // `/invoices` trả mảng trần — `boc()` vẫn chạy đúng, giữ lại để một lần đổi
    // khuôn ở máy chủ không làm trống màn hình hoá đơn.
    invoices: async ({ patientId }) =>
      boc(
        await call<InvoiceSummary[]>("/invoices", {
          query: { patient_id: patientId },
        }),
      ),

    invoiceQr: (id) => call(`/invoices/${id}/qr`),

    // Tuyến duy nhất nhận camelCase trong thân: router đọc `body.patientId`.
    unlink: (patientId) =>
      call("/unlink", { method: "POST", body: { patientId } }),
  };
}
