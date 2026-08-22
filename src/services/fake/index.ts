import type { PatientAppApi } from "../patient-app-api";
import type {
  Appointment,
  AppNotification,
  InvoiceSummary,
  Session,
  SlotAvailability,
} from "@/types";
import {
  CONG_SUAT,
  HO_SO,
  KHOA,
  NGAY_SINH_HOP_LE,
  QUOTA_ONLINE_PCT,
} from "./data";

const TRE = 300;
const doiMotChut = () => new Promise((r) => setTimeout(r, TRE));

const DANG_MO: Appointment["status"][] = ["Scheduled", "CheckedIn", "WaitListed"];

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
        DANG_MO.includes(h.status)
    ).length;

  const choMoChoApp = (departmentId: number, session: Session) =>
    Math.floor(
      ((CONG_SUAT[departmentId]?.[session] ?? 0) * QUOTA_ONLINE_PCT) / 100
    );

  const buocXacMinh = (patientId: number) => {
    if (!daLienKet) {
      throw new Error("Vui lòng liên kết tài khoản trước.");
    }
    if (!HO_SO.some((h) => h.patientId === patientId)) {
      throw new Error("Hồ sơ không thuộc tài khoản này.");
    }
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

    async slots({ departmentId, date }) {
      await doiMotChut();
      const buoi: Session[] = ["SANG", "CHIEU"];
      return buoi.map<SlotAvailability>((session) => ({
        date,
        session,
        remaining: Math.max(
          0,
          choMoChoApp(departmentId, session) - daGiu(departmentId, date, session)
        ),
      }));
    },

    async createAppointment(input) {
      await doiMotChut();
      buocXacMinh(input.patientId);

      const dangMo = lichHen.filter(
        (h) => h.patientId === input.patientId && DANG_MO.includes(h.status)
      ).length;
      if (dangMo >= 2) {
        throw new Error(
          "Mỗi hồ sơ chỉ được giữ tối đa 2 lịch hẹn cùng lúc. Vui lòng huỷ bớt trước khi đặt thêm."
        );
      }

      const conLai =
        choMoChoApp(input.departmentId, input.session) -
        daGiu(input.departmentId, input.date, input.session);
      if (conLai <= 0) {
        throw new Error(
          "Buổi này đã hết chỗ đặt trực tuyến. Vui lòng chọn buổi khác."
        );
      }

      const id = idTiepTheo++;
      const hen: Appointment = {
        id,
        appointmentCode: `HK${input.date.replace(/-/g, "").slice(2)}${id}`,
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
        .sort((a, b) => a.apptDate.localeCompare(b.apptDate));
    },

    async appointment(id) {
      await doiMotChut();
      const hen = lichHen.find((h) => h.id === id);
      if (!hen) {
        throw new Error("Không tìm thấy lịch hẹn.");
      }
      return { ...hen };
    },

    async redeem({ code }) {
      await doiMotChut();
      const hen = lichHen.find((h) => h.appointmentCode === code);
      if (!hen) {
        throw new Error("Mã hẹn không đúng.");
      }
      return { token: "phien-ngan-han-gia", appointmentId: hen.id };
    },

    async confirmAppointment(id) {
      await doiMotChut();
      const hen = lichHen.find((h) => h.id === id);
      if (!hen) {
        throw new Error("Không tìm thấy lịch hẹn.");
      }
      hen.patientConfirmed = true;
      return { ...hen };
    },

    async cancelAppointment(id) {
      await doiMotChut();
      const hen = lichHen.find((h) => h.id === id);
      if (!hen) {
        throw new Error("Không tìm thấy lịch hẹn.");
      }
      if (hen.status !== "Scheduled" && hen.status !== "WaitListed") {
        throw new Error("Lịch hẹn này không huỷ được nữa.");
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

    async notifications({ patientId }) {
      await doiMotChut();
      buocXacMinh(patientId);
      const list: AppNotification[] = [
        {
          id: 1,
          patientId,
          kind: "RESULT_READY",
          createdAt: "2026-08-20T09:12:00+07:00",
          title: "Kết quả đã có",
          body: "Kết quả xét nghiệm ngày 20/08 đã sẵn sàng. Vui lòng xem trên Sổ sức khoẻ điện tử VNeID hoặc nhận tại quầy.",
        },
        {
          id: 2,
          patientId,
          kind: "APPOINTMENT_REMINDER",
          createdAt: "2026-08-19T08:00:00+07:00",
          title: "Nhắc lịch hẹn",
          body: "Bạn có lịch hẹn vào buổi sáng ngày 22/08 tại Khoa Nội.",
        },
      ];
      return list;
    },

    async unlink() {
      await doiMotChut();
      daLienKet = false;
    },
  };
}
