import { atom } from "jotai";
import { atomFamily, atomWithRefresh, atomWithReset } from "jotai/utils";
import { api, setSessionToken } from "@/services";
import { ApiError } from "@/services/http";
import { clearSession, loadSession, saveSession } from "@/services/session";
import type {
  TrangThaiLuotKham,
  ChiTietLuotKham,
  Appointment,
  PatientProfile,
  PrescriptionSummary,
  QueueStatus,
  Session,
  VisitSummary,
} from "@/types";

/**
 * Lớp nuốt-và-báo dùng chung cho MỌI atom đọc dữ liệu người bệnh.
 *
 * Chỉ nuốt 401: phiên hết hạn và "chưa liên kết" là hai đường dẫn tới cùng một
 * đích, và cả hai đều phải ra dữ liệu rỗng chứ không phải một màn hình lỗi.
 * Mọi mã lỗi khác vẫn nổi lên — nuốt 404/500 thành mảng rỗng là biến sự cố máy
 * chủ thành câu "bạn chưa có dữ liệu nào", đúng kiểu hỏng mà `unwrap()` trong
 * `patient-app-api.ts` đã ghi là tệ nhất ở đây.
 *
 * Phần chống sập không nằm ở đây mà ở các lớp bọc lỗi: `ErrorBoundary` riêng
 * cho từng route con (`src/router.tsx`) và `SilentBoundary` quanh từng thẻ của
 * Trang chủ. Một tuyến biến mất chỉ được hỏng MỘT thẻ, không được hạ cả app.
 */
export async function nuot401<T>(
  duPhong: T,
  chay: () => Promise<T>,
): Promise<T> {
  try {
    return await chay();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await clearSession();
      setSessionToken(null);
      return duPhong;
    }
    throw error;
  }
}

/**
 * Phiên và hồ sơ đang xem
 */
/**
 * Phiên đã lưu, nạp đúng một lần cho mỗi store.
 *
 * `profilesState` PHỤ THUỘC vào atom này chứ không chạy đua với nó. Trước đây
 * `Layout` nạp phiên trong `useEffect` — tức sau khi render — còn `HomePage`
 * đọc `profilesState` trong lúc render, nên lời gọi `/me` đầu tiên luôn đi
 * không kèm token và lĩnh 401 kể cả khi kho lưu trữ đang giữ phiên hợp lệ.
 *
 * Đặt `setSessionToken` ngay trong hàm đọc là cố ý: mã phiên phải có mặt trước
 * khi bất kỳ atom nào chạm tới API, và đây là điểm duy nhất bảo đảm được điều
 * đó mà không cần mọi trang tự nhớ gọi trước.
 */
export const storedSessionState = atom(async () => {
  const session = await loadSession();
  setSessionToken(session?.token ?? null);
  return session;
});

/**
 * Hồ sơ của phiên hiện hành. Rỗng nghĩa là "chưa liên kết" — `HomePage` đã có
 * sẵn màn "Chào mừng bạn" cho trạng thái đó.
 *
 * 401 được quy về rỗng chứ không ném ra: chưa liên kết và phiên hết hạn là hai
 * đường dẫn tới cùng một đích, và ném lỗi ở đây làm error boundary của React
 * Router nuốt cả cây — trắng màn hình (2026-09-01). Luật ấy nay nằm trong
 * `nuot401` và mọi atom dữ liệu đều đi qua đó.
 */
export const profilesState = atomWithRefresh(async (get) => {
  await get(storedSessionState);
  return nuot401<PatientProfile[]>([], async () => (await api.me()).profiles);
});

/** Kho chứa thật, không xuất ra ngoài — ghi vào đây không kèm việc lưu trữ. */
const activePatientIdBaseState = atom<number | null>(null);

/**
 * Hồ sơ đang xem. Đọc ra là `number | null`; ghi vào thì đồng thời lưu xuống
 * kho lưu trữ của zmp-sdk để lần mở app sau vẫn đúng hồ sơ.
 */
export const activePatientIdState = atom(
  (get) => get(activePatientIdBaseState),
  async (_get, set, patientId: number | null) => {
    set(activePatientIdBaseState, patientId);
    const session = await loadSession();
    if (session) {
      await saveSession({ ...session, activePatientId: patientId });
    }
  },
);

export const activeProfileState = atom(async (get) => {
  const profiles = await get(profilesState);
  const activeId = get(activePatientIdState);
  return profiles.find((p) => p.patientId === activeId) ?? profiles[0] ?? null;
});

/**
 * Khôi phục hồ sơ đang xem khi mở app. `Layout` gọi đúng một lần lúc mount.
 *
 * Không còn nạp phiên hay làm mới `profilesState` ở đây: `storedSessionState`
 * đã lo mã phiên và `profilesState` tự chờ nó, nên thêm một `set` nữa chỉ tạo
 * ra lời gọi `/me` thứ hai thừa thãi.
 */
export const hydrateSessionState = atom(null, async (get, set) => {
  const session = await get(storedSessionState);
  set(activePatientIdBaseState, session?.activePatientId ?? null);
});

/** Ghi phiên xuống kho lưu trữ sau khi liên kết thành công. */
export const applyLinkState = atom(
  null,
  async (_get, set, payload: { token: string; patientId: number | null }) => {
    setSessionToken(payload.token);
    await saveSession({
      token: payload.token,
      activePatientId: payload.patientId,
    });
    set(activePatientIdBaseState, payload.patientId);
    set(profilesState);
  },
);

/**
 * Huỷ liên kết MỘT hồ sơ.
 *
 * Máy chủ chỉ thu hồi phiên khi hồ sơ vừa huỷ là hồ sơ CUỐI CÙNG — `huyLienKet`
 * gọi `thuHoiTatCa` chỉ khi `hoSoDuocPhep()` rỗng. Máy khách trước đây
 * `clearSession()` cho MỌI lần huỷ, nên phụ huynh giữ hai hồ sơ (mình + con)
 * mà huỷ hồ sơ con là mất luôn quyền xem hồ sơ của chính mình và phải chạy lại
 * toàn bộ luồng Zalo + ngày sinh. Lỗi ấy trước 2026-09-03 là mã chết vì lỗi
 * 204 ở `http.ts` ném trước — vá 204 xong là nó sống dậy ngay.
 *
 * Danh sách hồ sơ được đọc TRƯỚC lời gọi mạng: `get` của hàm ghi đọc trạng thái
 * tại thời điểm gọi, dùng lại nó sau `await` là đọc một ảnh chụp đã cũ.
 */
export const unlinkState = atom(null, async (get, set, patientId: number) => {
  const truoc = await get(profilesState);
  const dangChon = get(activePatientIdBaseState);

  await api.unlink(patientId);

  const conLai = truoc.filter((p) => p.patientId !== patientId);
  if (conLai.length === 0) {
    await clearSession();
    setSessionToken(null);
    set(activePatientIdBaseState, null);
  } else if (dangChon === patientId) {
    // Còn hồ sơ khác thì chuyển sang hồ sơ đầu tiên còn lại, chứ không để
    // `activePatientId` trỏ vào một hồ sơ mà phiên không còn được phép đọc —
    // `phamVi()` ở máy chủ trả 404 cho mọi màn hình khi điều đó xảy ra.
    await set(activePatientIdState, conLai[0].patientId);
  }

  set(profilesState);
});

/**
 * Danh mục
 */
export const departmentsState = atom(async () => api.departments());

/**
 * Tra tên khoa từ mã khoa.
 *
 * `/visits` chỉ trả `departmentId`, không trả tên — nên màn Lịch sử khám phải
 * tự ghép qua danh mục. Ghép ở đây chứ không ở trang: `departmentsState` là
 * một atom async, và để mỗi trang tự `await` rồi tự dựng `Map` là ba bản sao
 * của cùng một việc.
 */
export const departmentNameState = atom(async (get) => {
  const departments = await get(departmentsState);
  const byId = new Map(departments.map((k) => [k.id, k.name]));
  return (id: number) => byId.get(id) ?? "Chưa rõ khoa";
});

/**
 * Đặt lịch
 */
export const slotsState = atomFamily(
  ({ departmentId, date }: { departmentId: number; date: string }) =>
    atom(async () => api.slots({ departmentId, date })),
  (a, b) => a.departmentId === b.departmentId && a.date === b.date,
);

export const bookingFormState = atomWithReset<{
  departmentId?: number;
  date?: string;
  session?: Session;
  /**
   * Lý do đi khám, người bệnh tự viết. KHÔNG bắt buộc — xem lý lẽ ở bước 3.
   */
  reason?: string;
}>({});

/**
 * Lịch hẹn, số thứ tự, lượt khám, đơn thuốc — tất cả khoá theo hồ sơ.
 *
 * Khoá nhận `null` nghĩa là "chưa chọn hồ sơ nào", và khi đó atom trả về rỗng
 * **mà không gọi API**. Đây không phải tiện nghi: hook của React không đặt
 * điều kiện được, nên trang luôn phải đọc atom trước rồi mới rẽ nhánh được.
 * Nếu atom đòi một `number`, trang buộc phải bịa ra một mã bệnh nhân giả
 * (`patientId ?? 0`) và đi hỏi dữ liệu của một người không tồn tại — máy chủ
 * thật sẽ trả 404 cho mọi người dùng chưa liên kết.
 *
 * Mỗi atom đi qua `nuot401`: phiên hết hạn giữa chừng thì màn hình về trạng
 * thái "chưa liên kết" thay vì rơi vào error boundary.
 */
export const appointmentsState = atomFamily((patientId: number | null) =>
  atomWithRefresh(
    async (): Promise<Appointment[]> =>
      patientId === null
        ? []
        : nuot401([], () => api.appointments({ patientId })),
  ),
);

/**
 * Một lịch hẹn cụ thể.
 *
 * Khoá gồm CẢ `patientId` chứ không chỉ `id`: máy chủ đối chiếu `patient_id`
 * với phạm vi của phiên ở mỗi tuyến đọc, nên thiếu nó là 400 với người dùng
 * giữ nhiều hồ sơ. Khoá bằng cả hai cũng ngăn việc chuyển hồ sơ người thân mà
 * vẫn còn nhìn thấy lịch hẹn đã nạp của hồ sơ trước.
 */
export const appointmentByIdState = atomFamily(
  ({ id, patientId }: { id: number; patientId: number | null }) =>
    atomWithRefresh(
      async (): Promise<Appointment | null> =>
        patientId === null
          ? null
          : nuot401(null, () => api.appointment({ id, patientId })),
    ),
  (a, b) => a.id === b.id && a.patientId === b.patientId,
);

export const queueState = atomFamily((patientId: number | null) =>
  atomWithRefresh(
    async (): Promise<QueueStatus | null> =>
      patientId === null
        ? null
        : nuot401<QueueStatus | null>(null, () => api.queue({ patientId })),
  ),
);

/**
 * Dòng tiến độ của MỘT lượt khám.
 *
 * Khoá theo cả `visitId` lẫn `patientId`, cùng lý lẽ với `visitDetailState`:
 * đổi hồ sơ đang xem mà bộ nhớ đệm chỉ khoá theo lượt khám thì người dùng thấy
 * tiến độ của hồ sơ trước.
 */
export const trangThaiLuotState = atomFamily(
  ({ visitId, patientId }: { visitId: number | null; patientId: number | null }) =>
    atomWithRefresh(async (): Promise<TrangThaiLuotKham | null> =>
      visitId === null || patientId === null
        ? null
        : nuot401<TrangThaiLuotKham | null>(null,
          () => api.trangThaiLuotKham({ id: visitId, patientId }))),
  (a, b) => a.visitId === b.visitId && a.patientId === b.patientId,
);

export const visitsState = atomFamily((patientId: number | null) =>
  atom(
    async (): Promise<VisitSummary[]> =>
      patientId === null ? [] : nuot401([], () => api.visits({ patientId })),
  ),
);

/**
 * Chi tiết một lượt khám — bốn nhóm dữ liệu lâm sàng.
 *
 * Khoá theo CẢ `visitId` và `patientId`, cùng lý do đã ghi cho
 * `appointmentByIdState`: máy chủ đối chiếu `patient_id` ở mọi tuyến đọc, nên
 * cùng một `visitId` dưới hai hồ sơ khác nhau là hai câu hỏi khác nhau — và
 * chuyển hồ sơ người thân không được thấy dữ liệu của hồ sơ trước.
 *
 * KHÔNG nuốt lỗi thành giá trị rỗng: một màn bệnh án trắng trơn trông y hệt
 * "lượt khám này không có gì", mà hai chuyện ấy khác nhau hoàn toàn. `nuot401`
 * chỉ nuốt 401; mọi mã khác nổi lên cho `RouteError` của route con bắt.
 */
export const visitDetailState = atomFamily(
  ({ id, patientId }: { id: number; patientId: number | null }) =>
    atom(
      async (): Promise<ChiTietLuotKham | null> =>
        patientId === null ? null : api.visitDetail({ id, patientId }),
    ),
  (a, b) => a.id === b.id && a.patientId === b.patientId,
);

export const prescriptionsState = atomFamily((patientId: number | null) =>
  atom(
    async (): Promise<PrescriptionSummary[]> =>
      patientId === null
        ? []
        : nuot401([], () => api.prescriptions({ patientId })),
  ),
);

/*
 * KHÔNG CÒN `invoicesState`.
 *
 * `GET /patient-app/invoices` và `GET /patient-app/invoices/:id/qr` đã bị RÚT
 * khỏi `emr-api` ngày 29/08/2026: chúng gọi `modules/payment/`, mô-đun đã đi
 * theo dịch vụ tài chính cùng mười tám bảng tiền. Atom này vẫn được Trang chủ
 * đọc VÔ ĐIỀU KIỆN sau đó, nên mọi người bệnh đã liên kết mở app là gặp 404
 * toàn màn hình — `ErrorBoundary` ở route gốc thay luôn cả `<Layout/>`.
 *
 * `api.invoices()` / `api.invoiceQr()` vẫn còn trong hợp đồng để lúc dịch vụ
 * tài chính mở tuyến nội bộ thì dựng lại được, nhưng KHÔNG màn hình nào được
 * gọi tới chúng cho tới lúc đó.
 */

/**
 * Linh tinh
 */
export const customTitleState = atom("");
