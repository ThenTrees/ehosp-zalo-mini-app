import type { PatientAppApi } from "../patient-app-api";
import type { Appointment, InvoiceSummary, Session } from "@/types";
import {
  CAPACITY,
  PRESCRIPTIONS,
  PROFILES,
  DEPARTMENTS,
  VISITS,
  VALID_BIRTHDATE,
  ONLINE_QUOTA_PCT,
} from "./data";

const DELAY_MS = 300;
const delay = () => new Promise((r) => setTimeout(r, DELAY_MS));

const OPEN_STATUSES: Appointment["status"][] = ["Scheduled", "CheckedIn"];

export function createFakeApi(): PatientAppApi {
  const appointments: Appointment[] = [];
  let nextId = 1;
  let linked = false;

  const departmentById = (id: number) => {
    const department = DEPARTMENTS.find((k) => k.id === id);
    if (!department) {
      throw new Error("Không tìm thấy chuyên khoa.");
    }
    return department;
  };

  const booked = (departmentId: number, date: string, session: Session) =>
    appointments.filter(
      (h) =>
        h.department.id === departmentId &&
        h.apptDate === date &&
        h.session === session &&
        OPEN_STATUSES.includes(h.status),
    ).length;

  const appQuota = (departmentId: number, session: Session) =>
    Math.floor(
      ((CAPACITY[departmentId]?.[session] ?? 0) * ONLINE_QUOTA_PCT) / 100,
    );

  const remaining = (departmentId: number, date: string, session: Session) =>
    appQuota(departmentId, session) - booked(departmentId, date, session);

  /**
   * Mô phỏng hai chốt của máy chủ: phải có phiên, và hồ sơ phải thuộc phiên đó.
   * Chúng là thứ duy nhất ngăn một phiên hợp lệ đọc hồ sơ người khác, nên tầng
   * giả phải có chúng — nếu không, lỗi quên `patient_id` chỉ lộ ra ở production.
   */
  const assertScope = (patientId: number) => {
    if (!linked) {
      throw new Error("Vui lòng liên kết tài khoản trước.");
    }
    if (!PROFILES.some((h) => h.patientId === patientId)) {
      throw new Error("Hồ sơ không thuộc tài khoản này.");
    }
  };

  const findAppointment = (id: number, patientId: number) => {
    assertScope(patientId);
    const appointment = appointments.find(
      (h) => h.id === id && h.patientId === patientId,
    );
    if (!appointment) {
      throw new Error("Không tìm thấy lịch hẹn.");
    }
    return appointment;
  };

  /*
   * Tầng giả phải cài ĐỦ interface, kể cả những tuyến demo không dùng tới —
   * TypeScript bắt đúng chỗ này, và đó là điều mong muốn: một tuyến có ở bản
   * thật mà thiếu ở bản giả nghĩa là màn hình nào đó chỉ chạy được một bên.
   */
  return {
    ghiDanh: async (input) => {
      if (input.soDinhDanh.replace(/\D/g, "").length !== 12) {
        throw new Error("Số định danh cá nhân phải gồm 12 chữ số.");
      }
      await delay();
      /*
       * BẬT CỜ. Thiếu dòng này là bản demo đi thẳng tới màn hình TRỐNG ngay sau
       * khi ghi danh: `linked` là cờ duy nhất mở khoá `assertScope` và `me()`,
       * và trước lượt sửa này chỉ `link()` — hàm không màn hình nào còn gọi —
       * mới bật nó. Lỗi sống được vì `fake.test.ts` mở khoá qua helper gọi
       * chính `link()` đã chết, nên 103 phép thử vẫn xanh trong khi app hỏng.
       */
      linked = true;
      return {
        token: "phien-gia-sau-ghi-danh",
        patientId: PROFILES[0].patientId,
        fullName: PROFILES[0].fullName,
      };
    },
    /*
     * Tầng giả trả một `blob:` rỗng chứ không trả URL máy chủ: bản demo KHÔNG
     * được chạm mạng, và trả một đường dẫn thật ở đây là mở đúng cái cửa ấy.
     * Bấm vào sẽ ra một trang trắng — đúng thứ nên xảy ra khi không có tệp.
     */
    veTaiLieu: async () => {
      await delay();
      return { ve: "ve-gia", hanMs: 120_000 };
    },
    taiLieuUrl: () => "about:blank",
    dangNhap: async () => {
      await delay();
      // Cùng lý do với `ghiDanh` ở trên — xem khối chú thích tại đó.
      linked = true;
      return { token: "phien-gia-sau-dang-nhap" };
    },
    doiMatKhau: async () => {
      await delay();
      return { soPhienDaThuHoi: 0 };
    },
    /*
     * Bản giả cố ý để chặng CĐHA CHƯA xong (1/2) và chặng cuối chưa xong: một
     * bản giả mà mọi chặng đều xanh thì không ai thấy được màn hình lúc đang
     * chờ — mà đó mới là lúc người bệnh mở app nhiều nhất.
     */
    trangThaiLuotKham: async ({ id }) => {
      await delay();
      return {
        visitId: id,
        visitCode: `VK${id}`,
        visitDate: "2026-09-05",
        trangThai: "IN_PROGRESS",
        tenTrangThai: "Đang khám",
        moc: [
          { ma: "TIEP_DON", ten: "Đã tiếp đón", xong: true, dem: null,
            luc: "2026-09-05T07:12:00" },
          { ma: "XN", ten: "Kết quả xét nghiệm", xong: true, dem: "3/3",
            luc: "2026-09-05T08:41:00" },
          { ma: "CDHA", ten: "Kết quả chẩn đoán hình ảnh", xong: false, dem: "1/2",
            luc: "2026-09-05T09:02:00" },
          { ma: "XONG", ten: "Đã khám xong", xong: false, dem: null, luc: null },
        ],
      };
    },

    visitDetail: async ({ id }) => {
      await delay();
      return {
        visitId: id,
        visitCode: `VK${id}`,
        visitDate: "2026-08-20",
        status: "DONE",
        departmentName: "Khoa Nội tổng hợp",
        chanDoan: [{ ma: "J20", ten: "Viêm phế quản cấp", chinh: true }],
        /*
         * Cố ý để `nhipTho` và `duongHuyet` là null: màn hình phải BỎ HẲN dòng
         * không đo, chứ không hiện "—". Bản giả mà trị nào cũng có thì lỗi ấy
         * không bao giờ lộ ra khi xem demo.
         */
        sinhHieu: {
          mach: 88,
          nhietDo: 37.8,
          huyetApTamThu: 126,
          huyetApTamTruong: 78,
          nhipTho: null,
          spo2: 97,
          chieuCaoCm: 165,
          canNangKg: 58.5,
          duongHuyet: null,
        },
        loiDan:
          "Uống thuốc đủ liều, đủ ngày kể cả khi đã đỡ ho.\n" +
          "Uống nhiều nước ấm, tránh nằm điều hoà dưới 26 độ.\n" +
          "Sốt trên 39 độ hoặc khó thở thì tới khám lại ngay, không chờ hẹn.",
        ngayTaiKham: "2026-09-12",
        donThuoc: [
          {
            code: `DT${id}`,
            issuedDate: "2026-08-20",
            status: "DISPENSED",
            taiLieuId: 9002,
            thuoc: [
              {
                ten: "Paracetamol",
                tenThuongMai: null,
                hamLuong: "500mg",
                duongDung: "Uống",
                soLuong: 10,
                donVi: "Viên",
                lieu: "2 viên/ngày",
                soLan: "Sáng 1, Tối 1",
                soNgay: 5,
                loiDan: "Uống sau ăn",
              },
            ],
          },
        ],
        xetNghiem: [
          {
            accessionNo: `XN${id}`,
            serviceName: "Công thức máu",
            ketQuaLuc: "2026-08-20T09:12:00.000Z",
            chiSo: [
              {
                ma: "HGB",
                ten: "Huyết sắc tố",
                tri: "11.2",
                donVi: "g/dL",
                thapNhat: 12,
                caoNhat: 16,
                khoangChu: null,
                co: "L",
                ghiChu: null,
              },
            ],
          },
        ],
        bangKe: null,
        taiLieu: [
          {
            id: 9001,
            loai: "BENH_AN_KY",
            banSo: 1,
            tenHienThi: "Bệnh án ngoại trú",
            soByte: 211810,
          },
          {
            id: 9002,
            loai: "DON_THUOC_KY",
            banSo: 1,
            tenHienThi: "Đơn thuốc",
            soByte: 199463,
          },
        ],
      };
    },

    async me() {
      await delay();
      return { profiles: linked ? [...PROFILES] : [] };
    },

    async departments() {
      await delay();
      return [...DEPARTMENTS];
    },

    /*
     * Máy chủ thật chưa đếm được chỗ nên luôn trả `available: true`. Tầng giả
     * vẫn đếm theo quota 30%: nhánh "đã hết chỗ" của giao diện phải có đường
     * chạy được ở đâu đó, nếu không nó sẽ mục đi mà không ai biết.
     */
    async slots({ departmentId, date }) {
      await delay();
      const sessions: Session[] = ["SANG", "CHIEU"];
      return sessions.map((session) => ({
        date,
        session,
        available: remaining(departmentId, date, session) > 0,
      }));
    },

    async createAppointment(input) {
      await delay();
      assertScope(input.patientId);

      const open = appointments.filter(
        (h) =>
          h.patientId === input.patientId && OPEN_STATUSES.includes(h.status),
      ).length;
      if (open >= 2) {
        throw new Error("Hồ sơ đã có tối đa 2 lịch hẹn đang mở.");
      }
      if (
        appointments.some(
          (h) =>
            h.patientId === input.patientId &&
            h.apptDate === input.date &&
            OPEN_STATUSES.includes(h.status),
        )
      ) {
        throw new Error("Hồ sơ đã có lịch hẹn trong ngày này.");
      }
      if (remaining(input.departmentId, input.date, input.session) <= 0) {
        throw new Error(
          "Buổi này đã hết chỗ đặt trực tuyến. Vui lòng chọn buổi khác.",
        );
      }

      const id = nextId++;
      const appointment: Appointment = {
        id,
        appointmentCode: `HK${input.date.replace(/-/g, "").slice(2)}${String(id).padStart(4, "0")}`,
        patientId: input.patientId,
        department: departmentById(input.departmentId),
        apptDate: input.date,
        session: input.session,
        status: "Scheduled",
        patientConfirmed: false,
        lyDo: input.reason?.trim() || null,
      };
      appointments.push(appointment);
      return { ...appointment };
    },

    async appointments({ patientId }) {
      await delay();
      assertScope(patientId);
      return appointments
        .filter((h) => h.patientId === patientId)
        .map((h) => ({ ...h }))
        .sort((a, b) => b.apptDate.localeCompare(a.apptDate));
    },

    async appointment({ id, patientId }) {
      await delay();
      return { ...findAppointment(id, patientId) };
    },

    async confirmAppointment({ id, patientId }) {
      await delay();
      const appointment = findAppointment(id, patientId);
      if (appointment.status !== "Scheduled") {
        throw new Error("Lịch hẹn không còn có thể thay đổi.");
      }
      appointment.patientConfirmed = true;
      return { ...appointment };
    },

    async cancelAppointment({ id, patientId, reason }) {
      await delay();
      const appointment = findAppointment(id, patientId);
      if (appointment.status !== "Scheduled") {
        throw new Error("Lịch hẹn không còn có thể thay đổi.");
      }
      if (!reason.trim()) {
        throw new Error("Phải nhập lý do huỷ.");
      }
      appointment.status = "Cancelled";
      return { ...appointment };
    },

    async queue({ patientId }) {
      await delay();
      assertScope(patientId);
      return {
        patientId,
        visitId: 9001,
        myNumber: 27,
        currentNumber: 21,
        roomName: "Phòng khám số 2",
        estimatedWaitMinutes: 18,
      };
    },

    async visits({ patientId }) {
      await delay();
      assertScope(patientId);
      return (VISITS[patientId] ?? []).map((visit) => ({ ...visit }));
    },

    async prescriptions({ patientId }) {
      await delay();
      assertScope(patientId);
      return (PRESCRIPTIONS[patientId] ?? []).map((prescription) => ({
        ...prescription,
      }));
    },

    async invoices({ patientId }) {
      await delay();
      assertScope(patientId);
      const list: InvoiceSummary[] = [
        { id: 9001, visitDate: "2026-08-14", amountDue: 42000, paid: false },
        { id: 9002, visitDate: "2026-07-02", amountDue: 0, paid: true },
      ];
      return list;
    },

    async invoiceQr(id) {
      await delay();
      return {
        invoiceId: id,
        qrContent: `VIETQR|HOADON|${id}`,
        amount: 42000,
        expiresAt: "2026-12-31T23:59:59+07:00",
      };
    },

    async unlink() {
      await delay();
      linked = false;
    },
  };
}
