import type { PatientAppApi } from "../patient-app-api";
import type { Appointment, InvoiceSummary, Session } from "@/types";
import {
  CONG_SUAT,
  DON_THUOC,
  HO_SO,
  KHOA,
  LUOT_KHAM,
  NGAY_SINH_HOP_LE,
  QUOTA_ONLINE_PCT,
} from "./data";

const TRE = 300;
const doiMotChut = () => new Promise((r) => setTimeout(r, TRE));

const DANG_MO: Appointment["status"][] = ["Scheduled", "CheckedIn"];

export function createFakeApi(): PatientAppApi {
  const lichHen: Appointment[] = [];
  let idTiepTheo = 1;
  let daLienKet = false;

  const khoaTheoId = (id: number) => {
    const khoa = KHOA.find((k) => k.id === id);
    if (!khoa) {
      throw new Error("Không tìm thấy chuyên khoa.");
    }
    return khoa;
  };

  const daGiu = (departmentId: number, date: string, session: Session) =>
    lichHen.filter(
      (h) =>
        h.department.id === departmentId &&
        h.apptDate === date &&
        h.session === session &&
        DANG_MO.includes(h.status),
    ).length;

  const choMoChoApp = (departmentId: number, session: Session) =>
    Math.floor(
      ((CONG_SUAT[departmentId]?.[session] ?? 0) * QUOTA_ONLINE_PCT) / 100,
    );

  const conLai = (departmentId: number, date: string, session: Session) =>
    choMoChoApp(departmentId, session) - daGiu(departmentId, date, session);

  /**
   * Mô phỏng hai chốt của máy chủ: phải có phiên, và hồ sơ phải thuộc phiên đó.
   * Chúng là thứ duy nhất ngăn một phiên hợp lệ đọc hồ sơ người khác, nên tầng
   * giả phải có chúng — nếu không, lỗi quên `patient_id` chỉ lộ ra ở production.
   */
  const buocXacMinh = (patientId: number) => {
    if (!daLienKet) {
      throw new Error("Vui lòng liên kết tài khoản trước.");
    }
    if (!HO_SO.some((h) => h.patientId === patientId)) {
      throw new Error("Hồ sơ không thuộc tài khoản này.");
    }
  };

  const timHen = (id: number, patientId: number) => {
    buocXacMinh(patientId);
    const hen = lichHen.find((h) => h.id === id && h.patientId === patientId);
    if (!hen) {
      throw new Error("Không tìm thấy lịch hẹn.");
    }
    return hen;
  };

  return {
    async link(input) {
      await doiMotChut();
      if (!input.birthdate) {
        return { outcome: "CHALLENGE", need: "BIRTHDATE" };
      }
      if (input.birthdate !== NGAY_SINH_HOP_LE) {
        // Cùng một thông báo cho mọi kiểu sai — spec §5.4.
        throw new Error("Thông tin không khớp. Vui lòng kiểm tra lại.");
      }
      daLienKet = true;
      return { outcome: "LINKED", token: "phien-gia", profiles: [...HO_SO] };
    },

    async me() {
      await doiMotChut();
      return { profiles: daLienKet ? [...HO_SO] : [] };
    },

    async departments() {
      await doiMotChut();
      return [...KHOA];
    },

    /*
     * Máy chủ thật chưa đếm được chỗ nên luôn trả `available: true`. Tầng giả
     * vẫn đếm theo quota 30%: nhánh "đã hết chỗ" của giao diện phải có đường
     * chạy được ở đâu đó, nếu không nó sẽ mục đi mà không ai biết.
     */
    async slots({ departmentId, date }) {
      await doiMotChut();
      const buoi: Session[] = ["SANG", "CHIEU"];
      return buoi.map((session) => ({
        date,
        session,
        available: conLai(departmentId, date, session) > 0,
      }));
    },

    async createAppointment(input) {
      await doiMotChut();
      buocXacMinh(input.patientId);

      const dangMo = lichHen.filter(
        (h) => h.patientId === input.patientId && DANG_MO.includes(h.status),
      ).length;
      if (dangMo >= 2) {
        throw new Error("Hồ sơ đã có tối đa 2 lịch hẹn đang mở.");
      }
      if (
        lichHen.some(
          (h) =>
            h.patientId === input.patientId &&
            h.apptDate === input.date &&
            DANG_MO.includes(h.status),
        )
      ) {
        throw new Error("Hồ sơ đã có lịch hẹn trong ngày này.");
      }
      if (conLai(input.departmentId, input.date, input.session) <= 0) {
        throw new Error(
          "Buổi này đã hết chỗ đặt trực tuyến. Vui lòng chọn buổi khác.",
        );
      }

      const id = idTiepTheo++;
      const hen: Appointment = {
        id,
        appointmentCode: `HK${input.date.replace(/-/g, "").slice(2)}${String(id).padStart(4, "0")}`,
        patientId: input.patientId,
        department: khoaTheoId(input.departmentId),
        apptDate: input.date,
        session: input.session,
        status: "Scheduled",
        patientConfirmed: false,
      };
      lichHen.push(hen);
      return { ...hen };
    },

    async appointments({ patientId }) {
      await doiMotChut();
      buocXacMinh(patientId);
      return lichHen
        .filter((h) => h.patientId === patientId)
        .map((h) => ({ ...h }))
        .sort((a, b) => b.apptDate.localeCompare(a.apptDate));
    },

    async appointment({ id, patientId }) {
      await doiMotChut();
      return { ...timHen(id, patientId) };
    },

    async confirmAppointment({ id, patientId }) {
      await doiMotChut();
      const hen = timHen(id, patientId);
      if (hen.status !== "Scheduled") {
        throw new Error("Lịch hẹn không còn có thể thay đổi.");
      }
      hen.patientConfirmed = true;
      return { ...hen };
    },

    async cancelAppointment({ id, patientId, reason }) {
      await doiMotChut();
      const hen = timHen(id, patientId);
      if (hen.status !== "Scheduled") {
        throw new Error("Lịch hẹn không còn có thể thay đổi.");
      }
      if (!reason.trim()) {
        throw new Error("Phải nhập lý do huỷ.");
      }
      hen.status = "Cancelled";
      return { ...hen };
    },

    async queue({ patientId }) {
      await doiMotChut();
      buocXacMinh(patientId);
      return {
        patientId,
        myNumber: 27,
        currentNumber: 21,
        roomName: "Phòng khám số 2",
        estimatedWaitMinutes: 18,
      };
    },

    async visits({ patientId }) {
      await doiMotChut();
      buocXacMinh(patientId);
      return (LUOT_KHAM[patientId] ?? []).map((lk) => ({ ...lk }));
    },

    async prescriptions({ patientId }) {
      await doiMotChut();
      buocXacMinh(patientId);
      return (DON_THUOC[patientId] ?? []).map((dt) => ({ ...dt }));
    },

    async invoices({ patientId }) {
      await doiMotChut();
      buocXacMinh(patientId);
      const list: InvoiceSummary[] = [
        { id: 9001, visitDate: "2026-08-14", amountDue: 42000, paid: false },
        { id: 9002, visitDate: "2026-07-02", amountDue: 0, paid: true },
      ];
      return list;
    },

    async invoiceQr(id) {
      await doiMotChut();
      return {
        invoiceId: id,
        qrContent: `VIETQR|HOADON|${id}`,
        amount: 42000,
        expiresAt: "2026-12-31T23:59:59+07:00",
      };
    },

    async unlink() {
      await doiMotChut();
      daLienKet = false;
    },
  };
}
