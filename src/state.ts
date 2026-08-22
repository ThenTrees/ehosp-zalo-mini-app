import { atom } from "jotai";
import { atomFamily, atomWithRefresh, atomWithReset } from "jotai/utils";
import { api, setSessionToken } from "@/services";
import { clearSession, loadSession, saveSession } from "@/services/session";
import type { Session } from "@/types";

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
  }
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
  }
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
 * Đặt lịch
 */
export const slotsState = atomFamily(
  ({ departmentId, date }: { departmentId: number; date: string }) =>
    atom(async () => api.slots({ departmentId, date })),
  (a, b) => a.departmentId === b.departmentId && a.date === b.date
);

export const bookingFormState = atomWithReset<{
  departmentId?: number;
  date?: string;
  session?: Session;
  reason?: string;
}>({});

/**
 * Lịch hẹn, số thứ tự, hoá đơn, thông báo — tất cả khoá theo hồ sơ
 */
export const appointmentsState = atomFamily((patientId: number) =>
  atomWithRefresh(async () => api.appointments({ patientId }))
);

export const appointmentByIdState = atomFamily((id: number) =>
  atomWithRefresh(async () => api.appointment(id))
);

export const queueState = atomFamily((patientId: number) =>
  atomWithRefresh(async () => api.queue({ patientId }))
);

export const invoicesState = atomFamily((patientId: number) =>
  atom(async () => api.invoices({ patientId }))
);

export const notificationsState = atomFamily((patientId: number) =>
  atom(async () => api.notifications({ patientId }))
);

/**
 * Linh tinh
 */
export const customTitleState = atom("");
