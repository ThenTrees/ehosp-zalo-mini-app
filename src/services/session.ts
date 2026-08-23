import { getStorage, setStorage, removeStorage } from "zmp-sdk";

const STORAGE_KEY = "patient_app_session";

export interface StoredSession {
  /** Token Bearer của phiên app. Không bao giờ đưa vào URL. */
  token: string;
  /** Hồ sơ người bệnh đang xem; null khi chưa chọn. */
  activePatientId: number | null;
  /**
   * Lần cuối người dùng mở màn Thông báo, dạng ISO 8601; null khi chưa mở lần
   * nào. Hợp đồng máy chủ không có cờ "đã đọc", nên chấm đỏ trên chuông được
   * tính tại máy bằng cách so `createdAt` của thông báo với mốc này.
   */
  notificationsSeenAt: string | null;
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const data = await getStorage({ keys: [STORAGE_KEY] });
    const raw = (data as Record<string, unknown>)?.[STORAGE_KEY];
    if (typeof raw !== "string" || raw.length === 0) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredSession;
    if (typeof parsed?.token !== "string") {
      return null;
    }
    return {
      token: parsed.token,
      activePatientId:
        typeof parsed.activePatientId === "number"
          ? parsed.activePatientId
          : null,
      notificationsSeenAt:
        typeof parsed.notificationsSeenAt === "string"
          ? parsed.notificationsSeenAt
          : null,
    };
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  await setStorage({ data: { [STORAGE_KEY]: JSON.stringify(session) } });
}

export async function clearSession(): Promise<void> {
  await removeStorage({ keys: [STORAGE_KEY] });
}
