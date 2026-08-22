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

describe("createFakeApi — liên kết", () => {
  it("hỏi ngày sinh trước khi cho liên kết", async () => {
    const api = createFakeApi();
    const ketQua = await api.link({ zaloPhoneToken: "token-gia" });
    expect(ketQua).toEqual({ outcome: "CHALLENGE", need: "BIRTHDATE" });
  });

  it("từ chối khi ngày sinh sai, không tiết lộ hồ sơ nào tồn tại", async () => {
    const api = createFakeApi();
    await expect(
      api.link({ zaloPhoneToken: "token-gia", birthdate: "1970-01-01" })
    ).rejects.toThrow(/Thông tin không khớp/);
  });

  it("trả về nhiều hồ sơ cho một tài khoản", async () => {
    const { profiles } = await apiDaLienKet();
    expect(profiles.length).toBeGreaterThanOrEqual(2);
  });
});

describe("createFakeApi — đặt lịch", () => {
  it("chỉ mở 30% công suất cho kênh app", async () => {
    const { api } = await apiDaLienKet();
    const slots = await api.slots({ departmentId: 1, date: NGAY });
    const sang = slots.find((s) => s.session === "SANG");
    // Buổi sáng khoa 1 có 20 chỗ trong dữ liệu giả -> 30% = 6
    expect(sang?.remaining).toBe(6);
  });

  it("giảm số chỗ còn lại sau khi đặt", async () => {
    const { api, profiles } = await apiDaLienKet();
    await api.createAppointment({
      patientId: profiles[0].patientId,
      departmentId: 1,
      date: NGAY,
      session: "SANG",
    });

    const slots = await api.slots({ departmentId: 1, date: NGAY });
    expect(slots.find((s) => s.session === "SANG")?.remaining).toBe(5);
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

  it("huỷ lịch hẹn giải phóng lại chỗ đã giữ", async () => {
    const { api, profiles } = await apiDaLienKet();
    const patientId = profiles[0].patientId;
    const hen = await api.createAppointment({
      patientId,
      departmentId: 1,
      date: NGAY,
      session: "SANG",
    });

    await api.cancelAppointment(hen.id, "Đổi ý");

    const slots = await api.slots({ departmentId: 1, date: NGAY });
    expect(slots.find((s) => s.session === "SANG")?.remaining).toBe(6);
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
});

describe("createFakeApi — không rò rỉ nội dung lâm sàng", () => {
  it("thông báo chỉ nói kết quả đã có, không nói kết quả là gì", async () => {
    const { api, profiles } = await apiDaLienKet();
    const list = await api.notifications({ patientId: profiles[0].patientId });
    const body = list
      .map((n) => `${n.title} ${n.body}`)
      .join(" ")
      .toLowerCase();

    for (const cam of [
      "chẩn đoán",
      "dương tính",
      "âm tính",
      "mg",
      "paracetamol",
    ]) {
      expect(body).not.toContain(cam);
    }
  });
});
