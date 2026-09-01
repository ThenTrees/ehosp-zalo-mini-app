import { atom } from "jotai";
import { atomFamily, atomWithRefresh, atomWithReset } from "jotai/utils";
import { api, setSessionToken } from "@/services";
import { ApiError } from "@/services/http";
import { clearSession, loadSession, saveSession } from "@/services/session";
import type {
  Appointment,
  InvoiceSummary,
  PrescriptionSummary,
  Session,
  VisitSummary,
} from "@/types";

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
 * Router nuốt cả cây — trắng màn hình (2026-09-01). Chỉ 401 mới được nuốt; mọi
 * mã lỗi khác vẫn phải nổi lên để sự cố máy chủ không bị nguỵ trang thành
 * "chưa liên kết".
 */
export const profilesState = atomWithRefresh(async (get) => {
  await get(storedSessionState);
  try {
    const { profiles } = await api.me();
    return profiles;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await clearSession();
      setSessionToken(null);
      return [];
    }
    throw error;
  }
});

/** Kho chứa thật, không xuất ra ngoài — ghi vào đây không kèm việc lưu trữ. */
const activePatientIdBaseState = atom<number | null>(null);

/**
 * Hồ sơ đang xem, đã ĐỐI CHIẾU với danh sách hồ sơ của phiên hiện tại.
 *
 * `activePatientIdBaseState` chỉ là *nguyện vọng* nạp từ kho lưu trữ — nó có
 * thể là hồ sơ của lần liên kết trước, hoặc hồ sơ vừa bị huỷ liên kết. Đối
 * chiếu ở đây chứ không ở từng trang: các trang lấy id này làm khoá cho
 * `appointmentsState`/`invoicesState`, nên một id chưa đối chiếu sẽ đi gọi API
 * trước khi phiên kịp xác nhận, máy chủ từ chối, và lỗi thoát ra khỏi atom bất
 * đồng bộ làm error boundary nuốt cả cây (2026-09-01).
 */
export const activeProfileState = atom(async (get) => {
  const profiles = await get(profilesState);
  const preferredId = get(activePatientIdBaseState);
  return profiles.find((p) => p.patientId === preferredId) ?? profiles[0] ?? null;
});

/**
 * Mã hồ sơ đang xem. Đọc ra là `number | null` **sau khi đã đối chiếu**; ghi
 * vào thì đồng thời lưu xuống kho lưu trữ của zmp-sdk để lần mở app sau vẫn
 * đúng hồ sơ.
 *
 * Đọc là bất đồng bộ vì việc đối chiếu cần danh sách hồ sơ. Các trang tiêu thụ
 * đã nằm dưới `Suspense` sẵn nên không phải đổi gì.
 */
export const activePatientIdState = atom(
  async (get) => (await get(activeProfileState))?.patientId ?? null,
  async (_get, set, patientId: number | null) => {
    set(activePatientIdBaseState, patientId);
    const session = await loadSession();
    if (session) {
      await saveSession({ ...session, activePatientId: patientId });
    }
  },
);

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
  async (_get, set, payload: { token: string; patientId: number }) => {
    setSessionToken(payload.token);
    await saveSession({
      token: payload.token,
      activePatientId: payload.patientId,
    });
    set(activePatientIdBaseState, payload.patientId);
    set(profilesState);
  },
);

export const unlinkState = atom(null, async (_get, set, patientId: number) => {
  await api.unlink(patientId);
  await clearSession();
  setSessionToken(null);
  set(activePatientIdBaseState, null);
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
}>({});

/**
 * Lịch hẹn, số thứ tự, lượt khám, đơn thuốc, hoá đơn — tất cả khoá theo hồ sơ.
 *
 * Khoá nhận `null` nghĩa là "chưa chọn hồ sơ nào", và khi đó atom trả về rỗng
 * **mà không gọi API**. Đây không phải tiện nghi: hook của React không đặt
 * điều kiện được, nên trang luôn phải đọc atom trước rồi mới rẽ nhánh được.
 * Nếu atom đòi một `number`, trang buộc phải bịa ra một mã bệnh nhân giả
 * (`patientId ?? 0`) và đi hỏi dữ liệu của một người không tồn tại — máy chủ
 * thật sẽ trả 404 cho mọi người dùng chưa liên kết.
 */
export const appointmentsState = atomFamily((patientId: number | null) =>
  atomWithRefresh(
    async (): Promise<Appointment[]> =>
      patientId === null ? [] : api.appointments({ patientId }),
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
        patientId === null ? null : api.appointment({ id, patientId }),
    ),
  (a, b) => a.id === b.id && a.patientId === b.patientId,
);

export const queueState = atomFamily((patientId: number | null) =>
  atomWithRefresh(async () =>
    patientId === null ? null : api.queue({ patientId }),
  ),
);

export const visitsState = atomFamily((patientId: number | null) =>
  atom(
    async (): Promise<VisitSummary[]> =>
      patientId === null ? [] : api.visits({ patientId }),
  ),
);

export const prescriptionsState = atomFamily((patientId: number | null) =>
  atom(
    async (): Promise<PrescriptionSummary[]> =>
      patientId === null ? [] : api.prescriptions({ patientId }),
  ),
);

export const invoicesState = atomFamily((patientId: number | null) =>
  atom(
    async (): Promise<InvoiceSummary[]> =>
      patientId === null ? [] : api.invoices({ patientId }),
  ),
);

/**
 * Linh tinh
 */
export const customTitleState = atom("");
