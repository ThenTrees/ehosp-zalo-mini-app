import { atom } from "jotai";
import { atomFamily, atomWithRefresh, atomWithReset } from "jotai/utils";
import { api, setSessionToken } from "@/services";
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
export const profilesState = atomWithRefresh(async () => {
  const { profiles } = await api.me();
  return profiles;
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

/** Nạp lại phiên đã lưu khi mở app. `Layout` gọi đúng một lần lúc mount. */
export const hydrateSessionState = atom(null, async (_get, set) => {
  const session = await loadSession();
  setSessionToken(session?.token ?? null);
  set(activePatientIdBaseState, session?.activePatientId ?? null);
  set(profilesState);
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
  const khoa = await get(departmentsState);
  const bang = new Map(khoa.map((k) => [k.id, k.name]));
  return (id: number) => bang.get(id) ?? "Chưa rõ khoa";
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
