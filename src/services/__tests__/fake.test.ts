import { describe, it, expect } from "vitest";
import { createFakeApi } from "@/services/fake";

const DATE = "2026-09-01";

async function linkedApi() {
  const api = createFakeApi();
  const result = await api.link({
    zaloPhoneToken: "token-gia",
    zaloAccessToken: "access-gia",
    birthdate: "1990-05-12",
  });
  if (result.outcome !== "LINKED") {
    throw new Error("Mong đợi liên kết thành công");
  }
  return { api, profiles: result.profiles };
}

const morningSlot = (slots: { session: string; available: boolean }[]) =>
  slots.find((s) => s.session === "SANG");

describe("createFakeApi — liên kết", () => {
  it("hỏi ngày sinh trước khi cho liên kết", async () => {
    const api = createFakeApi();
    const result = await api.link({
      zaloPhoneToken: "token-gia",
      zaloAccessToken: "access-gia",
    });
    expect(result).toEqual({ outcome: "CHALLENGE", need: "BIRTHDATE" });
  });

  it("từ chối khi ngày sinh sai, không tiết lộ hồ sơ nào tồn tại", async () => {
    const api = createFakeApi();
    await expect(
      api.link({
        zaloPhoneToken: "token-gia",
        zaloAccessToken: "access-gia",
        birthdate: "1970-01-01",
      }),
    ).rejects.toThrow(/Thông tin không khớp/);
  });

  it("trả về nhiều hồ sơ cho một tài khoản", async () => {
    const { profiles } = await linkedApi();
    expect(profiles.length).toBeGreaterThanOrEqual(2);
  });
});

describe("createFakeApi — đặt lịch", () => {
  it("buổi còn chỗ thì available = true", async () => {
    const { api } = await linkedApi();
    expect(
      morningSlot(await api.slots({ departmentId: 1, date: DATE }))?.available,
    ).toBe(true);
  });

  /*
   * Khoa 3 buổi chiều có 0 chỗ trong dữ liệu giả. Nhánh "đã hết chỗ" của giao
   * diện chỉ có đúng đường chạy này — máy chủ thật hiện luôn trả `true`.
   */
  it("buổi không có công suất thì available = false", async () => {
    const { api } = await linkedApi();
    const slots = await api.slots({ departmentId: 3, date: DATE });
    expect(slots.find((s) => s.session === "CHIEU")?.available).toBe(false);
  });

  it("chặn hồ sơ có quá 2 lịch hẹn đang mở", async () => {
    const { api, profiles } = await linkedApi();
    const patientId = profiles[0].patientId;
    const book = (date: string) =>
      api.createAppointment({
        patientId,
        departmentId: 1,
        date,
        session: "SANG",
      });

    await book("2026-09-01");
    await book("2026-09-02");

    await expect(book("2026-09-03")).rejects.toThrow(/tối đa 2 lịch hẹn/);
  });

  it("chặn đặt hai lịch hẹn trong cùng một ngày", async () => {
    const { api, profiles } = await linkedApi();
    const patientId = profiles[0].patientId;
    await api.createAppointment({
      patientId,
      departmentId: 1,
      date: DATE,
      session: "SANG",
    });

    await expect(
      api.createAppointment({
        patientId,
        departmentId: 2,
        date: DATE,
        session: "CHIEU",
      }),
    ).rejects.toThrow(/trong ngày này/);
  });

  it("lịch hẹn mới ở trạng thái Scheduled và chưa được xác nhận", async () => {
    const { api, profiles } = await linkedApi();
    const appointment = await api.createAppointment({
      patientId: profiles[0].patientId,
      departmentId: 1,
      date: DATE,
      session: "SANG",
    });

    expect(appointment.status).toBe("Scheduled");
    expect(appointment.patientConfirmed).toBe(false);
    expect(appointment.appointmentCode).toMatch(/^HK\d+$/);
  });

  it("huỷ lịch hẹn giải phóng lại chỗ đã giữ", async () => {
    const { api, profiles } = await linkedApi();
    const patientId = profiles[0].patientId;
    // Khoa 2 buổi chiều: 10 chỗ, quota 30% -> 3 chỗ cho kênh app.
    const book = (date: string) =>
      api.createAppointment({
        patientId,
        departmentId: 2,
        date,
        session: "CHIEU",
      });
    const appointment = await book("2026-09-01");
    await book("2026-09-02");

    await api.cancelAppointment({
      id: appointment.id,
      patientId,
      reason: "Đổi ý",
    });

    // Huỷ xong thì hồ sơ chỉ còn 1 lịch hẹn đang mở, đặt thêm được.
    await expect(book("2026-09-03")).resolves.toMatchObject({
      status: "Scheduled",
    });
  });

  /**
   * Hồi quy cho lệch hợp đồng ngày 2026-08-30: máy chủ đối chiếu `patient_id`
   * ở MỌI tuyến đọc và ghi. Tầng giả phải chặn y như vậy, nếu không lỗi quên
   * truyền `patientId` chỉ lộ ra khi chạy với API thật.
   */
  it("không đọc được lịch hẹn của hồ sơ khác", async () => {
    const { api, profiles } = await linkedApi();
    const appointment = await api.createAppointment({
      patientId: profiles[0].patientId,
      departmentId: 1,
      date: DATE,
      session: "SANG",
    });

    await expect(
      api.appointment({ id: appointment.id, patientId: profiles[1].patientId }),
    ).rejects.toThrow(/Không tìm thấy lịch hẹn/);
  });

  it("huỷ không có lý do bị từ chối, đúng như máy chủ", async () => {
    const { api, profiles } = await linkedApi();
    const patientId = profiles[0].patientId;
    const appointment = await api.createAppointment({
      patientId,
      departmentId: 1,
      date: DATE,
      session: "SANG",
    });

    await expect(
      api.cancelAppointment({ id: appointment.id, patientId, reason: "  " }),
    ).rejects.toThrow(/lý do huỷ/);
  });
});

describe("createFakeApi — lịch sử khám", () => {
  it("trả lượt khám và đơn thuốc theo đúng hồ sơ", async () => {
    const { api, profiles } = await linkedApi();

    const motherVisits = await api.visits({ patientId: profiles[0].patientId });
    const childVisits = await api.visits({ patientId: profiles[1].patientId });

    expect(motherVisits.length).toBeGreaterThan(0);
    expect(motherVisits.map((l) => l.id)).not.toEqual(
      expect.arrayContaining(childVisits.map((l) => l.id)),
    );
  });

  it("mọi đơn thuốc đều nối được về một lượt khám của cùng hồ sơ", async () => {
    const { api, profiles } = await linkedApi();
    const patientId = profiles[0].patientId;

    const visit = await api.visits({ patientId });
    const prescription = await api.prescriptions({ patientId });

    expect(prescription.length).toBeGreaterThan(0);
    for (const d of prescription) {
      expect(visit.some((l) => l.id === d.visitId)).toBe(true);
    }
  });

  /** Máy chủ lọc đơn nháp trước khi trả về; tầng giả phải mô phỏng điều đó. */
  it("không trả về đơn thuốc ở trạng thái nháp", async () => {
    const { api, profiles } = await linkedApi();
    for (const profile of profiles) {
      const prescription = await api.prescriptions({
        patientId: profile.patientId,
      });
      expect(prescription.map((d) => d.status)).not.toContain("DRAFT");
    }
  });

  it("chưa liên kết thì không đọc được gì", async () => {
    const api = createFakeApi();
    await expect(api.visits({ patientId: 101 })).rejects.toThrow(
      /liên kết tài khoản/,
    );
    await expect(api.prescriptions({ patientId: 101 })).rejects.toThrow(
      /liên kết tài khoản/,
    );
  });
});

describe("createFakeApi — không rò rỉ nội dung lâm sàng", () => {
  it("lượt khám và đơn thuốc chỉ có đúng các trường của hợp đồng", async () => {
    const { api, profiles } = await linkedApi();
    const patientId = profiles[0].patientId;

    for (const visit of await api.visits({ patientId })) {
      expect(Object.keys(visit).sort()).toEqual([
        "chanDoanChinh",
        "departmentId",
        "id",
        "status",
        "visitCode",
        "visitDate",
      ]);
    }
    for (const prescription of await api.prescriptions({ patientId })) {
      expect(Object.keys(prescription).sort()).toEqual([
        "code",
        "id",
        "issuedDate",
        "status",
        "visitId",
      ]);
    }
  });
});
