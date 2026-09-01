import { describe, it, expect } from "vitest";
import { createFakeApi } from "@/services/fake";

const NGAY = "2026-09-01";

async function apiDaLienKet() {
  const api = createFakeApi();
  const ketQua = await api.link({
    zaloPhoneToken: "token-gia",
    birthdate: "1990-05-12",
  });
  if (ketQua.outcome !== "LINKED") {
    throw new Error("Mong đợi liên kết thành công");
  }
  return { api, profiles: ketQua.profiles };
}

const buoiSang = (slots: { session: string; available: boolean }[]) =>
  slots.find((s) => s.session === "SANG");

describe("createFakeApi — liên kết", () => {
  it("hỏi ngày sinh trước khi cho liên kết", async () => {
    const api = createFakeApi();
    const ketQua = await api.link({ zaloPhoneToken: "token-gia" });
    expect(ketQua).toEqual({ outcome: "CHALLENGE", need: "BIRTHDATE" });
  });

  it("từ chối khi ngày sinh sai, không tiết lộ hồ sơ nào tồn tại", async () => {
    const api = createFakeApi();
    await expect(
      api.link({ zaloPhoneToken: "token-gia", birthdate: "1970-01-01" }),
    ).rejects.toThrow(/Thông tin không khớp/);
  });

  it("trả về nhiều hồ sơ cho một tài khoản", async () => {
    const { profiles } = await apiDaLienKet();
    expect(profiles.length).toBeGreaterThanOrEqual(2);
  });
});

describe("createFakeApi — đặt lịch", () => {
  it("buổi còn chỗ thì available = true", async () => {
    const { api } = await apiDaLienKet();
    expect(
      buoiSang(await api.slots({ departmentId: 1, date: NGAY }))?.available,
    ).toBe(true);
  });

  /*
   * Khoa 3 buổi chiều có 0 chỗ trong dữ liệu giả. Nhánh "đã hết chỗ" của giao
   * diện chỉ có đúng đường chạy này — máy chủ thật hiện luôn trả `true`.
   */
  it("buổi không có công suất thì available = false", async () => {
    const { api } = await apiDaLienKet();
    const slots = await api.slots({ departmentId: 3, date: NGAY });
    expect(slots.find((s) => s.session === "CHIEU")?.available).toBe(false);
  });

  it("chặn hồ sơ có quá 2 lịch hẹn đang mở", async () => {
    const { api, profiles } = await apiDaLienKet();
    const patientId = profiles[0].patientId;
    const dat = (date: string) =>
      api.createAppointment({
        patientId,
        departmentId: 1,
        date,
        session: "SANG",
      });

    await dat("2026-09-01");
    await dat("2026-09-02");

    await expect(dat("2026-09-03")).rejects.toThrow(/tối đa 2 lịch hẹn/);
  });

  it("chặn đặt hai lịch hẹn trong cùng một ngày", async () => {
    const { api, profiles } = await apiDaLienKet();
    const patientId = profiles[0].patientId;
    await api.createAppointment({
      patientId,
      departmentId: 1,
      date: NGAY,
      session: "SANG",
    });

    await expect(
      api.createAppointment({
        patientId,
        departmentId: 2,
        date: NGAY,
        session: "CHIEU",
      }),
    ).rejects.toThrow(/trong ngày này/);
  });

  it("lịch hẹn mới ở trạng thái Scheduled và chưa được xác nhận", async () => {
    const { api, profiles } = await apiDaLienKet();
    const hen = await api.createAppointment({
      patientId: profiles[0].patientId,
      departmentId: 1,
      date: NGAY,
      session: "SANG",
    });

    expect(hen.status).toBe("Scheduled");
    expect(hen.patientConfirmed).toBe(false);
    expect(hen.appointmentCode).toMatch(/^HK\d+$/);
  });

  it("huỷ lịch hẹn giải phóng lại chỗ đã giữ", async () => {
    const { api, profiles } = await apiDaLienKet();
    const patientId = profiles[0].patientId;
    // Khoa 2 buổi chiều: 10 chỗ, quota 30% -> 3 chỗ cho kênh app.
    const dat = (date: string) =>
      api.createAppointment({
        patientId,
        departmentId: 2,
        date,
        session: "CHIEU",
      });
    const hen = await dat("2026-09-01");
    await dat("2026-09-02");

    await api.cancelAppointment({ id: hen.id, patientId, reason: "Đổi ý" });

    // Huỷ xong thì hồ sơ chỉ còn 1 lịch hẹn đang mở, đặt thêm được.
    await expect(dat("2026-09-03")).resolves.toMatchObject({
      status: "Scheduled",
    });
  });

  /**
   * Hồi quy cho lệch hợp đồng ngày 2026-08-30: máy chủ đối chiếu `patient_id`
   * ở MỌI tuyến đọc và ghi. Tầng giả phải chặn y như vậy, nếu không lỗi quên
   * truyền `patientId` chỉ lộ ra khi chạy với API thật.
   */
  it("không đọc được lịch hẹn của hồ sơ khác", async () => {
    const { api, profiles } = await apiDaLienKet();
    const hen = await api.createAppointment({
      patientId: profiles[0].patientId,
      departmentId: 1,
      date: NGAY,
      session: "SANG",
    });

    await expect(
      api.appointment({ id: hen.id, patientId: profiles[1].patientId }),
    ).rejects.toThrow(/Không tìm thấy lịch hẹn/);
  });

  it("huỷ không có lý do bị từ chối, đúng như máy chủ", async () => {
    const { api, profiles } = await apiDaLienKet();
    const patientId = profiles[0].patientId;
    const hen = await api.createAppointment({
      patientId,
      departmentId: 1,
      date: NGAY,
      session: "SANG",
    });

    await expect(
      api.cancelAppointment({ id: hen.id, patientId, reason: "  " }),
    ).rejects.toThrow(/lý do huỷ/);
  });
});

describe("createFakeApi — lịch sử khám", () => {
  it("trả lượt khám và đơn thuốc theo đúng hồ sơ", async () => {
    const { api, profiles } = await apiDaLienKet();

    const luotMe = await api.visits({ patientId: profiles[0].patientId });
    const luotCon = await api.visits({ patientId: profiles[1].patientId });

    expect(luotMe.length).toBeGreaterThan(0);
    expect(luotMe.map((l) => l.id)).not.toEqual(
      expect.arrayContaining(luotCon.map((l) => l.id)),
    );
  });

  it("mọi đơn thuốc đều nối được về một lượt khám của cùng hồ sơ", async () => {
    const { api, profiles } = await apiDaLienKet();
    const patientId = profiles[0].patientId;

    const luot = await api.visits({ patientId });
    const don = await api.prescriptions({ patientId });

    expect(don.length).toBeGreaterThan(0);
    for (const d of don) {
      expect(luot.some((l) => l.id === d.visitId)).toBe(true);
    }
  });

  /** Máy chủ lọc đơn nháp trước khi trả về; tầng giả phải mô phỏng điều đó. */
  it("không trả về đơn thuốc ở trạng thái nháp", async () => {
    const { api, profiles } = await apiDaLienKet();
    for (const hoSo of profiles) {
      const don = await api.prescriptions({ patientId: hoSo.patientId });
      expect(don.map((d) => d.status)).not.toContain("DRAFT");
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
    const { api, profiles } = await apiDaLienKet();
    const patientId = profiles[0].patientId;

    for (const luot of await api.visits({ patientId })) {
      expect(Object.keys(luot).sort()).toEqual([
        "departmentId",
        "id",
        "status",
        "visitCode",
        "visitDate",
      ]);
    }
    for (const don of await api.prescriptions({ patientId })) {
      expect(Object.keys(don).sort()).toEqual([
        "code",
        "id",
        "issuedDate",
        "status",
        "visitId",
      ]);
    }
  });
});
