import { buildUrl, request } from "./http";
import type {
  TrangThaiLuotKham,
  VeTaiLieu,
  ChiTietLuotKham,
  DangNhapInput,
  GhiDanhInput,
  GhiDanhResponse,
  Appointment,
  CreateAppointmentInput,
  Department,
  InvoiceSummary,
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
  /* ── Tài khoản: ghi danh và đăng nhập bằng số định danh ── */
  ghiDanh(input: GhiDanhInput): Promise<GhiDanhResponse>;
  dangNhap(input: DangNhapInput): Promise<{ token: string }>;
  doiMatKhau(input: { matKhauCu: string; matKhauMoi: string }): Promise<{
    soPhienDaThuHoi: number;
  }>;

  visits(params: { patientId: number }): Promise<VisitSummary[]>;
  /**
   * Chi tiết MỘT lượt khám: chẩn đoán, đơn thuốc có tên và liều, kết quả xét
   * nghiệm, bảng kê. Xem khối chú thích ở `types.d.ts › ChiTietLuotKham` để
   * biết vì sao ràng buộc "không nội dung lâm sàng" được đảo.
   */
  visitDetail(params: {
    id: number;
    patientId: number;
  }): Promise<ChiTietLuotKham>;
  /**
   * Đường mở một tờ giấy ĐÃ KÝ. Trả URL chứ không trả byte: tệp PDF đi thẳng từ
   * máy chủ vào trình xem của điện thoại, không phải qua bộ nhớ của mini app —
   * một tờ bệnh án vài trăm KB nhân với số lần bấm là thứ không đáng giữ trong
   * RAM của một chiếc điện thoại cũ.
   */
  /**
   * Đúc một VÉ để mở tệp tài liệu. Cần phiên; trả về chuỗi vé và hạn của nó.
   *
   * Vé tồn tại vì thẻ `<a href>` KHÔNG mang được header `X-Patient-Session`,
   * mà webview Zalo cũng không dùng được cookie — nút "Mở bản PDF đã ký" vì thế
   * trả 401 trong mọi môi trường. Máy chủ đổi vé lấy quyền đọc ĐÚNG một tài
   * liệu, một lần, trong 120 giây.
   */
  veTaiLieu(params: { id: number; patientId: number }): Promise<VeTaiLieu>;
  /**
   * URL mở tệp, có kèm vé.
   *
   * ⚠ KHÔNG còn `patient_id` trên URL: máy chủ lấy nó TỪ VÉ. Truyền số ấy lên
   * đường không có phiên là mời một lỗi IDOR — đổi số là đọc hồ sơ người khác.
   */
  taiLieuUrl(params: { id: number; ve: string }): string;
  /** Dòng tiến độ của một lượt khám — "giờ tới đâu rồi". */
  trangThaiLuotKham(params: {
    id: number; patientId: number;
  }): Promise<TrangThaiLuotKham>;
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
interface Wrapped<T> {
  results: T[];
}

/**
 * Bóc `{results}` mà vẫn chịu được mảng trần.
 *
 * Chấp nhận cả hai dạng chứ không khẳng định một dạng: nếu mai kia một tuyến
 * đổi khuôn, màn hình vẫn hiện đúng danh sách thay vì hiện rỗng — và danh sách
 * rỗng là kiểu hỏng tệ nhất ở đây, vì nó trông y hệt "bạn chưa có dữ liệu nào".
 */
function unwrap<T>(payload: Wrapped<T> | T[] | null | undefined): T[] {
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

    me: () => call("/me"),

    departments: () => call("/departments", { anonymous: true }),

    slots: async ({ departmentId, date }) =>
      unwrap(
        await call<Wrapped<SlotAvailability>>("/slots", {
          query: { department_id: departmentId, date },
        }),
      ),

    /*
     * Thân yêu cầu đi bằng snake_case vì router đọc `body.patient_id` và
     * `body.department_id`. Gửi camelCase thì `Number(undefined)` ra NaN và
     * máy chủ trả 404 "Không tìm thấy hồ sơ" — một thông báo không hề gợi ý
     * rằng lỗi nằm ở tên trường.
     */
    createAppointment: ({ patientId, departmentId, date, session, reason }) =>
      call("/appointments", {
        method: "POST",
        body: {
          patient_id: patientId,
          department_id: departmentId,
          date,
          session,
          // Bỏ hẳn khoá khi rỗng, đừng gửi chuỗi "" — máy chủ phân biệt "không
          // ghi lý do" với "ghi một chuỗi rỗng", và cột nhận NULL chứ không ''.
          ...(reason?.trim() ? { reason: reason.trim() } : {}),
        },
      }),

    appointments: async ({ patientId }) =>
      unwrap(
        await call<Wrapped<Appointment>>("/appointments", {
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

    /*
     * BA TUYẾN TÀI KHOẢN đi `anonymous: true` — hai tuyến đầu là CỬA VÀO, và
     * một cửa vào đòi phiên thì không ai vào được. `doiMatKhau` thì cần phiên,
     * nên nó KHÔNG anonymous.
     */
    ghiDanh: (input) =>
      call("/ghi-danh", { method: "POST", body: input, anonymous: true }),
    dangNhap: (input) =>
      call("/dang-nhap", { method: "POST", body: input, anonymous: true }),
    doiMatKhau: (input) =>
      call("/doi-mat-khau", { method: "POST", body: input }),

    /*
     * Dùng `baseUrl` mà nhà máy đã nhận, KHÔNG nhập `runtimeConfig` từ
     * `./index`: tệp ấy nhập ngược `createHttpApi` từ đây, nên một dòng import
     * thêm là một vòng tròn — và nó không nổ lúc biên dịch mà nổ lúc NẠP
     * MÔ-ĐUN, dưới dạng "mod.createHttpApi is not a function" ở một tệp thử
     * không liên quan gì. Đo được ngày 2026-09-04.
     */
    veTaiLieu: ({ id, patientId }) =>
      call<VeTaiLieu>(`/tai-lieu/${id}/ve`, {
        method: "POST",
        body: { patient_id: patientId },
      }),

    /*
     * `ve` LÀ NGOẠI LỆ DUY NHẤT của luật "không để thông tin xác thực trên URL"
     * (xem `FORBIDDEN_QUERY_KEYS` ở http.ts), và ngoại lệ ấy có lý do chứ không
     * phải một chỗ quên: URL này KHÔNG do `fetch` gọi mà do một lượt ĐIỀU HƯỚNG
     * mở ra, nên không có chỗ nào gắn header vào được. Bù lại, vé dùng ĐÚNG MỘT
     * LẦN và sống 120 giây — nên vé nằm lại trong lịch sử trình duyệt, nhật ký
     * nginx hay dấu vết OpenTelemetry đều là vé ĐÃ CHÁY.
     */
    taiLieuUrl: ({ id, ve }) => buildUrl(baseUrl, `/tai-lieu/${id}/tep`, { ve }),

    trangThaiLuotKham: ({ id, patientId }) =>
      call<TrangThaiLuotKham>(`/visits/${id}/trang-thai`, {
        query: { patient_id: patientId },
      }),

    visitDetail: ({ id, patientId }) =>
      call<ChiTietLuotKham>(`/visits/${id}`, {
        query: { patient_id: patientId },
      }),

    visits: async ({ patientId }) =>
      unwrap(
        await call<Wrapped<VisitSummary>>("/visits", {
          query: { patient_id: patientId },
        }),
      ),

    prescriptions: async ({ patientId }) =>
      unwrap(
        await call<Wrapped<PrescriptionSummary>>("/prescriptions", {
          query: { patient_id: patientId },
        }),
      ),

    /*
     * ⚠ HAI TUYẾN DƯỚI ĐÂY ĐANG BỊ RÚT Ở MÁY CHỦ — KHÔNG MÀN HÌNH NÀO ĐƯỢC GỌI.
     *
     * `emr-api` bỏ `GET /patient-app/invoices` và `GET /invoices/:id/qr` ngày
     * 29/08/2026: chúng gọi `modules/payment/`, mô-đun đã đi theo dịch vụ tài
     * chính cùng mười tám bảng tiền. Gọi vào là nhận 404 của bộ xử lý tập trung
     * — đúng thứ đã hạ cả ứng dụng ngày 03/09/2026 khi Trang chủ còn đọc
     * `invoicesState`.
     *
     * Giữ lại hai hàm này vì hợp đồng §6 không đổi và test dưới
     * `__tests__/patient-app-api.test.ts` vẫn khoá đúng hình dạng yêu cầu, nên
     * lúc dịch vụ tài chính mở cửa nội bộ cho tự phục vụ thì chỉ cần dựng lại
     * màn hình. `/invoices` trả mảng trần — `unwrap()` đã chịu được cả hai khuôn.
     */
    invoices: async ({ patientId }) =>
      unwrap(
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
