import { describe, it, expect, beforeAll } from "vitest";
import { createHttpApi } from "@/services/patient-app-api";
import { ApiError } from "@/services/http";
import type { PatientProfile } from "@/types";

/**
 * Đối chiếu hợp đồng §6 với **máy chủ emr-api đang chạy thật**.
 *
 * Vì sao cần phép thử này bên cạnh `patient-app-api.test.ts`: bộ kia dùng
 * `fetch` giả, nên nó chỉ chứng minh mini app GỬI đúng thứ nó định gửi. Nó
 * không phát hiện được chuyện máy chủ TRẢ VỀ một hình dạng khác — đúng loại
 * lệch đã tìm thấy ngày 2026-08-30, khi `lichHenCuaNguoiBenh()` trả `date` và
 * `confirmed` trong lúc mini app đọc `apptDate` và `patientConfirmed`.
 *
 * BỎ QUA khi thiếu biến môi trường, vì nó cần một máy chủ và một phiên thật:
 *
 *   EMR_API_URL=http://127.0.0.1:3010/api/patient-app \
 *   EMR_PATIENT_SESSION=<mã phiên> \
 *   EMR_PATIENT_ID=<mã hồ sơ> \
 *   npx vitest run src/services/__tests__/doi-chieu-that.test.ts
 *
 * Cấp phiên mà không cần Zalo: chèn một dòng `emr_patient_app_link` và một
 * dòng `emr_patient_app_session` với `sid_hash = SHA2(<mã phiên>, 256)`.
 */
/*
 * Khai `process` tại chỗ thay vì thêm "node" vào `types` của tsconfig.
 *
 * Thêm "node" sẽ phơi toàn bộ biến toàn cục của Node ra MỌI tệp — kể cả mã
 * chạy trong webview Zalo, nơi `process`, `Buffer` và `__dirname` không tồn
 * tại. Lúc ấy một lỗi dùng nhầm API của Node chỉ lộ ra trên điện thoại thật.
 * Ba dòng đọc biến môi trường ở tệp phép thử này không đáng đánh đổi như vậy.
 */
declare const process: { env: Record<string, string | undefined> };

const BASE = process.env.EMR_API_URL ?? "";
const PHIEN = process.env.EMR_PATIENT_SESSION ?? "";
const HO_SO = Number(process.env.EMR_PATIENT_ID ?? 0);

const co = Boolean(BASE && PHIEN && HO_SO);
const khiCoMayChu = co ? describe : describe.skip;

const api = () => createHttpApi(BASE, () => PHIEN);
const apiKhongPhien = () => createHttpApi(BASE, () => null);

/** Ngày mai, dạng YYYY-MM-DD — hôm nay không còn nhận đặt trước qua app. */
function ngayMai(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const th = String(d.getMonth() + 1).padStart(2, "0");
  const ng = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${th}-${ng}`;
}

khiCoMayChu("đối chiếu với emr-api thật — chốt phiên", () => {
  it("danh mục khoa mở công khai và có id + name", async () => {
    const khoa = await apiKhongPhien().departments();
    expect(khoa.length).toBeGreaterThan(0);
    expect(typeof khoa[0].id).toBe("number");
    expect(typeof khoa[0].name).toBe("string");
  });

  it("mọi tuyến đọc theo hồ sơ đều trả 401 khi không có phiên", async () => {
    const a = apiKhongPhien();
    for (const goi of [
      () => a.me(),
      () => a.visits({ patientId: HO_SO }),
      () => a.prescriptions({ patientId: HO_SO }),
      () => a.appointments({ patientId: HO_SO }),
      () => a.invoices({ patientId: HO_SO }),
      () => a.queue({ patientId: HO_SO }),
    ]) {
      await expect(goi()).rejects.toMatchObject({ status: 401 });
    }
  });

  it("phiên rác cũng chỉ ra 401, không ra 500", async () => {
    const a = createHttpApi(BASE, () => "khong-phai-phien-that");
    await expect(a.me()).rejects.toMatchObject({ status: 401 });
  });
});

khiCoMayChu("đối chiếu với emr-api thật — hình dạng dữ liệu", () => {
  let hoSo: PatientProfile[] = [];

  beforeAll(async () => {
    hoSo = (await api().me()).profiles;
  });

  it("/me trả hồ sơ đúng khuôn PatientProfile", () => {
    expect(hoSo.length).toBeGreaterThan(0);
    const h = hoSo[0];
    expect(typeof h.patientId).toBe("number");
    expect(typeof h.patientCode).toBe("string");
    expect(typeof h.fullName).toBe("string");
    expect(["M", "F", "U"]).toContain(h.gender);
    expect(h.birthdate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("/visits trả đúng năm trường của VisitSummary", async () => {
    const luot = await api().visits({ patientId: HO_SO });
    expect(luot.length).toBeGreaterThan(0);
    for (const l of luot) {
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

  it("/prescriptions trả đúng khuôn và KHÔNG có đơn nháp", async () => {
    const don = await api().prescriptions({ patientId: HO_SO });
    expect(don.length).toBeGreaterThan(0);
    for (const d of don) {
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

  it("mọi đơn thuốc nối được về một lượt khám có thật", async () => {
    const [luot, don] = await Promise.all([
      api().visits({ patientId: HO_SO }),
      api().prescriptions({ patientId: HO_SO }),
    ]);
    for (const d of don) {
      expect(luot.some((l) => l.id === d.visitId)).toBe(true);
    }
  });

  it("/invoices trả mảng, mỗi dòng đúng khuôn InvoiceSummary", async () => {
    const hd = await api().invoices({ patientId: HO_SO });
    expect(Array.isArray(hd)).toBe(true);
    for (const h of hd) {
      expect(Object.keys(h).sort()).toEqual([
        "amountDue",
        "id",
        "paid",
        "visitDate",
      ]);
    }
  });

  it("/slots trả available: boolean cho cả hai buổi", async () => {
    const khoa = await apiKhongPhien().departments();
    const slots = await api().slots({
      departmentId: khoa[0].id,
      date: ngayMai(),
    });
    expect(slots.map((s) => s.session).sort()).toEqual(["CHIEU", "SANG"]);
    for (const s of slots) {
      expect(typeof s.available).toBe("boolean");
      expect(s.date).toBe(ngayMai());
    }
  });

  it("hồ sơ ngoài phạm vi phiên ra 404, không ra 403", async () => {
    // 403 xác nhận rằng hồ sơ ấy tồn tại — đã là một câu trả lời cho người dò.
    await expect(
      api().visits({ patientId: HO_SO + 100000 }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

/**
 * Vòng đời đầy đủ của một lịch hẹn, qua đúng những lời gọi mà giao diện dùng.
 *
 * Đây là phép thử duy nhất chứng minh được ba thứ cùng lúc: thân yêu cầu
 * snake_case tới đúng chỗ, `patient_id` có mặt ở confirm/cancel, và hình dạng
 * trả về khớp `Appointment`. Nó GHI vào cơ sở dữ liệu, nên chỉ chạy với máy
 * chủ phát triển.
 */
khiCoMayChu("đối chiếu với emr-api thật — vòng đời lịch hẹn", () => {
  it("đặt → xác nhận → huỷ, hình dạng đúng ở cả ba bước", async () => {
    const a = api();
    const khoa = await apiKhongPhien().departments();

    let hen;
    try {
      hen = await a.createAppointment({
        patientId: HO_SO,
        departmentId: khoa[0].id,
        date: ngayMai(),
        session: "SANG",
      });
    } catch (e) {
      // Chạy lại phép thử trong cùng một ngày sẽ đụng chốt "đã có lịch hẹn
      // trong ngày này" của máy chủ. Đó là hành vi đúng, không phải lỗi.
      if (e instanceof ApiError && e.status === 409) {
        const dsHen = await a.appointments({ patientId: HO_SO });
        hen = dsHen.find((h) => h.status === "Scheduled");
        if (!hen) throw e;
      } else {
        throw e;
      }
    }

    expect(Object.keys(hen).sort()).toEqual([
      "appointmentCode",
      "apptDate",
      "department",
      "id",
      "patientConfirmed",
      "patientId",
      "session",
      "status",
    ]);
    expect(hen.apptDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(hen.department.name.length).toBeGreaterThan(0);
    expect(hen.patientId).toBe(HO_SO);
    expect(hen.status).toBe("Scheduled");

    const daXacNhan = await a.confirmAppointment({
      id: hen.id,
      patientId: HO_SO,
    });
    expect(daXacNhan.patientConfirmed).toBe(true);

    const daHuy = await a.cancelAppointment({
      id: hen.id,
      patientId: HO_SO,
      reason: "Phép thử đối chiếu hợp đồng",
    });
    expect(daHuy.status).toBe("Cancelled");

    // Đọc lại một mình cũng phải ra đúng bản ghi ấy.
    const docLai = await a.appointment({ id: hen.id, patientId: HO_SO });
    expect(docLai.status).toBe("Cancelled");
  });
});
