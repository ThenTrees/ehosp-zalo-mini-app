import { atom } from "jotai";
import { atomFamily, atomWithRefresh, atomWithReset } from "jotai/utils";
import { api, setSessionToken } from "@/services";
import { clearSession, loadSession, saveSession } from "@/services/session";
import type {
  AppNotification,
  Appointment,
  InvoiceSummary,
  Session,
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

/**
 * Mốc "đã xem thông báo". Máy chủ không có cờ đã đọc, nên chấm đỏ trên chuông
 * tính tại máy: thông báo nào có `createdAt` sau mốc này thì coi là chưa đọc.
 */
const notificationsSeenAtBaseState = atom<string | null>(null);

export const notificationsSeenAtState = atom(
  (get) => get(notificationsSeenAtBaseState),
  async (_get, set, seenAt: string) => {
    set(notificationsSeenAtBaseState, seenAt);
    const session = await loadSession();
    if (session) {
      await saveSession({ ...session, notificationsSeenAt: seenAt });
    }
  },
);

/** Nạp lại phiên đã lưu khi mở app. `Layout` gọi đúng một lần lúc mount. */
export const hydrateSessionState = atom(null, async (_get, set) => {
  const session = await loadSession();
  setSessionToken(session?.token ?? null);
  set(activePatientIdBaseState, session?.activePatientId ?? null);
  set(notificationsSeenAtBaseState, session?.notificationsSeenAt ?? null);
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
      notificationsSeenAt: null,
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
  reason?: string;
}>({});

/**
 * Lịch hẹn, số thứ tự, hoá đơn, thông báo — tất cả khoá theo hồ sơ.
 *
 * Khoá nhận `null` nghĩa là "chưa chọn hồ sơ nào", và khi đó atom trả về rỗng
 * **mà không gọi API**. Đây không phải tiện nghi: hook của React không đặt
 * điều kiện được, nên trang luôn phải đọc atom trước rồi mới rẽ nhánh được.
 * Nếu atom đòi một `number`, trang buộc phải bịa ra một mã bệnh nhân giả
 * (`patientId ?? 0`) và đi hỏi dữ liệu của một người không tồn tại — máy chủ
 * thật sẽ trả 403 cho mọi người dùng chưa liên kết.
 */
export const appointmentsState = atomFamily((patientId: number | null) =>
  atomWithRefresh(
    async (): Promise<Appointment[]> =>
      patientId === null ? [] : api.appointments({ patientId }),
  ),
);

export const appointmentByIdState = atomFamily((id: number) =>
  atomWithRefresh(async () => api.appointment(id)),
);

export const queueState = atomFamily((patientId: number | null) =>
  atomWithRefresh(async () =>
    patientId === null ? null : api.queue({ patientId }),
  ),
);

export const invoicesState = atomFamily((patientId: number | null) =>
  atom(
    async (): Promise<InvoiceSummary[]> =>
      patientId === null ? [] : api.invoices({ patientId }),
  ),
);

export const notificationsState = atomFamily((patientId: number | null) =>
  atom(
    async (): Promise<AppNotification[]> =>
      patientId === null ? [] : api.notifications({ patientId }),
  ),
);

/** Số thông báo mới hơn mốc đã xem — chấm đỏ trên chuông ở Header. */
export const unreadNotificationCountState = atomFamily(
  (patientId: number | null) =>
    atom(async (get) => {
      const notifications = await get(notificationsState(patientId));
      const seenAt = get(notificationsSeenAtState);
      if (seenAt === null) {
        return notifications.length;
      }
      const moc = Date.parse(seenAt);
      return notifications.filter((tin) => Date.parse(tin.createdAt) > moc)
        .length;
    }),
);

/**
 * Linh tinh
 */
export const customTitleState = atom("");
