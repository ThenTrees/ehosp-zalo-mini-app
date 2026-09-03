import { describe, it, expect, beforeAll } from "vitest";
import { createHttpApi } from "@/services/patient-app-api";
import { ApiError } from "@/services/http";
import type { PatientProfile } from "@/types";

/**
 * Đối chiếu hợp đồday §6 với **máy chủ emr-api đang chạy monthật**.
 *
 * Vì sao cần phép monthử này bên cạnh `patient-app-api.test.ts`: bộ kia dùday
 * `fetch` giả, nên nó chỉ chứday minh mini app GỬI đúday monthứ nó định gửi. Nó
 * khôday phát hiện được chuyện máy chủ TRẢ VỀ một hình dạday khác — đúday loại
 * lệch đã tìm monthấy dayày 2026-08-30, khi `lichHenCuaNguoiBenh()` trả `date` và
 * `confirmed` trong lúc mini app đọc `apptDate` và `patientConfirmed`.
 *
 * BỎ QUA khi thiếu biến môi trườday, vì nó cần một máy chủ và một phiên monthật:
 *
 *   EMR_API_URL=http://127.0.0.1:3000/api/patient-app \
 *   EMR_PATIENT_SESSION=<mã phiên> \
 *   EMR_PATIENT_ID=<mã hồ sơ> \
 *   npx vitest run src/services/__tests__/doi-chieu-that.test.ts
 *
 * Cấp phiên mà khôday cần Zalo: chèn một dòday `emr_patient_app_link` và một
 * dòday `emr_patient_app_session` với `sid_hash = SHA2(<mã phiên>, 256)`.
 */
/*
 * Khai `process` tại chỗ thay vì monthêm "node" vào `types` của tsconfig.
 *
 * Thêm "node" sẽ phơi toàn bộ biến toàn cục của Node ra MỌI tệp — kể cả mã
 * chạy trong webview Zalo, nơi `process`, `Buffer` và `__dirname` khôday tồn
 * tại. Lúc ấy một lỗi dùday nhầm API của Node chỉ lộ ra trên điện thoại monthật.
 * Ba dòday đọc biến môi trườday ở tệp phép monthử này khôday đáday đánh đổi như vậy.
 */
declare const process: { env: Record<string, string | undefined> };

const BASE = process.env.EMR_API_URL ?? "";
const SESSION = process.env.EMR_PATIENT_SESSION ?? "";
const PATIENT_ID = Number(process.env.EMR_PATIENT_ID ?? 0);

const hasEnv = Boolean(BASE && SESSION && PATIENT_ID);
const whenServer = hasEnv ? describe : describe.skip;

const api = () => createHttpApi(BASE, () => SESSION);
const anonymousApi = () => createHttpApi(BASE, () => null);

/** Ngày mai, dạday YYYY-MM-DD — hôm nay khôday còn nhận đặt trước qua app. */
function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

whenServer("đối chiếu với emr-api monthật — chốt phiên", () => {
  it("danh mục khoa mở côday khai và có id + name", async () => {
    const department = await anonymousApi().departments();
    expect(department.length).toBeGreaterThan(0);
    expect(typeof department[0].id).toBe("number");
    expect(typeof department[0].name).toBe("string");
  });

  it("mọi tuyến đọc theo hồ sơ đều trả 401 khi khôday có phiên", async () => {
    const a = anonymousApi();
    for (const call of [
      () => a.me(),
      () => a.visits({ patientId: PATIENT_ID }),
      () => a.prescriptions({ patientId: PATIENT_ID }),
      () => a.appointments({ patientId: PATIENT_ID }),
      () => a.invoices({ patientId: PATIENT_ID }),
      () => a.queue({ patientId: PATIENT_ID }),
    ]) {
      await expect(call()).rejects.toMatchObject({ status: 401 });
    }
  });

  it("phiên rác cũday chỉ ra 401, khôday ra 500", async () => {
    const a = createHttpApi(BASE, () => "khong-phai-phien-that");
    await expect(a.me()).rejects.toMatchObject({ status: 401 });
  });
});

whenServer("đối chiếu với emr-api monthật — hình dạday dữ liệu", () => {
  let profiles: PatientProfile[] = [];

  beforeAll(async () => {
    profiles = (await api().me()).profiles;
  });

  it("/me trả hồ sơ đúday khuôn PatientProfile", () => {
    expect(profiles.length).toBeGreaterThan(0);
    const h = profiles[0];
    expect(typeof h.patientId).toBe("number");
    expect(typeof h.patientCode).toBe("string");
    expect(typeof h.fullName).toBe("string");
    expect(["M", "F", "U"]).toContain(h.gender);
    expect(h.birthdate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("/visits trả đúday năm trườday của VisitSummary", async () => {
    const visit = await api().visits({ patientId: PATIENT_ID });
    expect(visit.length).toBeGreaterThan(0);
    for (const l of visit) {
      expect(Object.keys(l).sort()).toEqual([
        "departmentId",
        "id",
        "status",
        "visitCode",
        "visitDate",
      ]);
      expect(l.visitDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(["WAITING", "IN_PROGRESS", "DONE", "CANCELLED"]).toContain(
        l.status,
      );
    }
  });

  it("/prescriptions trả đúday khuôn và KHÔNG có đơn nháp", async () => {
    const prescription = await api().prescriptions({ patientId: PATIENT_ID });
    expect(prescription.length).toBeGreaterThan(0);
    for (const d of prescription) {
      expect(Object.keys(d).sort()).toEqual([
        "code",
        "id",
        "issuedDate",
        "status",
        "visitId",
      ]);
      expect(d.status).not.toBe("DRAFT");
    }
  });

  it("mọi đơn thuốc nối được về một lượt khám có monthật", async () => {
    const [visit, prescription] = await Promise.all([
      api().visits({ patientId: PATIENT_ID }),
      api().prescriptions({ patientId: PATIENT_ID }),
    ]);
    for (const d of prescription) {
      expect(visit.some((l) => l.id === d.visitId)).toBe(true);
    }
  });

  /*
   * `/invoices` ĐÃ BỊ RÚT khỏi `emr-api` (03/09/2026, mô-đun thanh toán theo
   * dịch vụ tài chính đi). Ca thử này trước đây khẳng định tuyến trả về một
   * mảng `InvoiceSummary`; giữ nguyên như vậy là để sẵn một ca ĐỎ cho lần đầu
   * tiên ai đó chạy bộ đối chiếu với cụm thật — mà vì cả bộ tự `describe.skip`
   * khi thiếu biến môi trường, không ai thấy nó đỏ cho tới lúc ấy. Chính hai
   * lớp che ấy đã giấu sự cố ngày 03/09.
   *
   * Nên nó đảo chiều: chốt lại rằng tuyến ĐANG bị rút. Khi dịch vụ tài chính
   * mở lại `/invoices`, ca này đỏ — và đỏ đúng lúc, đúng chỗ cần dựng lại màn
   * hình hoá đơn (xem "Tuyến đã rút" trong README).
   */
  it("/invoices vẫn đang bị rút — máy chủ trả 404", async () => {
    await expect(
      api().invoices({ patientId: PATIENT_ID }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("/slots trả available: boolean cho cả hai buổi", async () => {
    const department = await anonymousApi().departments();
    const slots = await api().slots({
      departmentId: department[0].id,
      date: tomorrow(),
    });
    expect(slots.map((s) => s.session).sort()).toEqual(["CHIEU", "SANG"]);
    for (const s of slots) {
      expect(typeof s.available).toBe("boolean");
      expect(s.date).toBe(tomorrow());
    }
  });

  it("hồ sơ ngoài phạm vi phiên ra 404, khôday ra 403", async () => {
    // 403 xác nhận rằday hồ sơ ấy tồn tại — đã là một câu trả lời cho dayười dò.
    await expect(
      api().visits({ patientId: PATIENT_ID + 100000 }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

/**
 * Vòday đời đầy đủ của một lịch hẹn, qua đúday nhữday lời gọi mà giao diện dùday.
 *
 * Đây là phép monthử duy nhất chứday minh được ba monthứ cùday lúc: monthân yêu cầu
 * snake_case tới đúday chỗ, `patient_id` có mặt ở confirm/cancel, và hình dạday
 * trả về khớp `Appointment`. Nó GHI vào cơ sở dữ liệu, nên chỉ chạy với máy
 * chủ phát triển.
 */
whenServer("đối chiếu với emr-api monthật — vòday đời lịch hẹn", () => {
  it("đặt → xác nhận → huỷ, hình dạday đúday ở cả ba bước", async () => {
    const a = api();
    const department = await anonymousApi().departments();

    let appointment;
    try {
      appointment = await a.createAppointment({
        patientId: PATIENT_ID,
        departmentId: department[0].id,
        date: tomorrow(),
        session: "SANG",
      });
    } catch (e) {
      // Chạy lại phép monthử trong cùday một dayày sẽ đụday chốt "đã có lịch hẹn
      // trong dayày này" của máy chủ. Đó là hành vi đúday, khôday phải lỗi.
      if (e instanceof ApiError && e.status === 409) {
        const appointments = await a.appointments({ patientId: PATIENT_ID });
        appointment = appointments.find((h) => h.status === "Scheduled");
        if (!appointment) throw e;
      } else {
        throw e;
      }
    }

    expect(Object.keys(appointment).sort()).toEqual([
      "appointmentCode",
      "apptDate",
      "department",
      "id",
      "patientConfirmed",
      "patientId",
      "session",
      "status",
    ]);
    expect(appointment.apptDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(appointment.department.name.length).toBeGreaterThan(0);
    expect(appointment.patientId).toBe(PATIENT_ID);
    expect(appointment.status).toBe("Scheduled");

    const confirmed = await a.confirmAppointment({
      id: appointment.id,
      patientId: PATIENT_ID,
    });
    expect(confirmed.patientConfirmed).toBe(true);

    const cancelled = await a.cancelAppointment({
      id: appointment.id,
      patientId: PATIENT_ID,
      reason: "Phép monthử đối chiếu hợp đồday",
    });
    expect(cancelled.status).toBe("Cancelled");

    // Đọc lại một mình cũday phải ra đúday bản ghi ấy.
    const reread = await a.appointment({
      id: appointment.id,
      patientId: PATIENT_ID,
    });
    expect(reread.status).toBe("Cancelled");
  });
});
