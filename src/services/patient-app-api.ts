import { request } from "./http";
import type {
  Appointment,
  AppNotification,
  CreateAppointmentInput,
  Department,
  InvoiceSummary,
  LinkInput,
  LinkResponse,
  PatientProfile,
  QueueStatus,
  SlotAvailability,
  VietQrPayload,
} from "@/types";

/**
 * Hợp đồng API người bệnh — spec §6. Tầng giả và tầng thật cùng cài đặt
 * interface này, nên đổi giữa hai bên chỉ là đổi một biến môi trường.
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
  appointment(id: number): Promise<Appointment>;
  redeem(input: {
    code: string;
  }): Promise<{ token: string; appointmentId: number }>;
  confirmAppointment(id: number): Promise<Appointment>;
  cancelAppointment(id: number, reason: string): Promise<Appointment>;
  queue(params: { patientId: number }): Promise<QueueStatus>;
  invoices(params: { patientId: number }): Promise<InvoiceSummary[]>;
  invoiceQr(id: number): Promise<VietQrPayload>;
  notifications(params: { patientId: number }): Promise<AppNotification[]>;
  unlink(patientId: number): Promise<void>;
}

export function createHttpApi(
  baseUrl: string,
  getToken: () => string | null,
  fetchImpl?: typeof fetch
): PatientAppApi {
  const call = <T>(
    path: string,
    init: {
      method?: "GET" | "POST";
      query?: Record<string, string | number | undefined>;
      body?: unknown;
      anonymous?: boolean;
    } = {}
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

    slots: ({ departmentId, date }) =>
      call("/slots", { query: { department: departmentId, date } }),

    createAppointment: (input) =>
      call("/appointments", { method: "POST", body: input }),

    appointments: ({ patientId }) =>
      call("/appointments", { query: { patient_id: patientId } }),

    appointment: (id) => call(`/appointments/${id}`),

    redeem: (input) =>
      call("/redeem", { method: "POST", body: input, anonymous: true }),

    confirmAppointment: (id) =>
      call(`/appointments/${id}/confirm`, { method: "POST" }),

    cancelAppointment: (id, reason) =>
      call(`/appointments/${id}/cancel`, { method: "POST", body: { reason } }),

    queue: ({ patientId }) =>
      call("/queue", { query: { patient_id: patientId } }),

    invoices: ({ patientId }) =>
      call("/invoices", { query: { patient_id: patientId } }),

    invoiceQr: (id) => call(`/invoices/${id}/qr`),

    notifications: ({ patientId }) =>
      call("/notifications", { query: { patient_id: patientId } }),

    unlink: (patientId) =>
      call("/unlink", { method: "POST", body: { patientId } }),
  };
}
