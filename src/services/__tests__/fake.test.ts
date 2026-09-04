import { describe, it, expect } from "vitest";
import { createFakeApi } from "@/services/fake";

const DATE = "2026-09-01";

/*
 * MỞ KHOÁ BẰNG ĐƯỜNG ĐANG SỐNG.
 *
 * Helper này trước đây gọi `api.link()` — luồng Zalo cũ, không màn hình nào còn
 * gọi sau khi đăng nhập chuyển sang số định danh + mật khẩu. Hệ quả: 14 bài
 * dưới đây kiểm một đường đã chết, và vì `link()` là chỗ DUY NHẤT bật cờ
 * `linked` của tầng giả, chúng còn CHE mất một lỗi thật — bản `VITE_USE_FAKE=true`
 * đi tới màn hình trống ngay sau khi đăng nhập, mà 103 phép thử vẫn xanh.
 *
 * Nay mở khoá bằng `ghiDanh`, đúng thứ ứng dụng thật gọi. Bài nào xanh từ đây
 * mới nói được điều gì về ứng dụng.
 */
async function linkedApi() {
  const api = createFakeApi();
  const kq = await api.ghiDanh({
    soDinhDanh: "079090012345",
    insuranceLast4: "1234",
    matKhau: "matkhau-du-dai",
  });
  const { profiles } = await api.me();
  if (!profiles.length) throw new Error("Mong đợi có hồ sơ sau khi ghi danh");
  return { api, profiles };
}

const morningSlot = (slots: { session: string; available: boolean }[]) =>
  slots.find((s) => s.session === "SANG");

describe("createFakeApi — ghi danh", () => {
  it("đòi số định danh đủ 12 chữ số", async () => {
    const api = createFakeApi();
    await expect(
      api.ghiDanh({ soDinhDanh: "0790900", insuranceLast4: "1234",
                    matKhau: "matkhau-du-dai" }),
    ).rejects.toThrow(/12 chữ số/);
  });

  /*
   * BÀI QUAN TRỌNG NHẤT CỦA TỆP, và nó ra đời sau một lỗi thật: ghi danh xong
   * mà `me()` trả rỗng thì ứng dụng đi thẳng tới màn hình TRỐNG — người bệnh
   * đăng nhập được rồi không thấy gì, không có thông báo lỗi nào.
   */
  it("ghi danh xong thì me() thấy hồ sơ — không phải màn hình trống", async () => {
    const api = createFakeApi();
    const kq = await api.ghiDanh({ soDinhDanh: "079090012345",
      insuranceLast4: "1234", matKhau: "matkhau-du-dai" });
    const { profiles } = await api.me();
    expect(profiles.length).toBeGreaterThanOrEqual(2);
  });

  it("đăng nhập cũng mở khoá, không riêng ghi danh", async () => {
    const api = createFakeApi();
    await api.dangNhap({ soDinhDanh: "079090012345", matKhau: "matkhau-du-dai" });
    const { profiles } = await api.me();
    expect(profiles.length).toBeGreaterThanOrEqual(1);
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
