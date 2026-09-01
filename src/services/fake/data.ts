import type {
  Department,
  PatientProfile,
  PrescriptionSummary,
  VisitSummary,
} from "@/types";

export const DEPARTMENTS: Department[] = [
  { id: 1, name: "Khoa Nội", description: "Khám và điều trị bệnh nội khoa" },
  { id: 2, name: "Khoa Ngoại", description: "Khám ngoại khoa, tiểu phẫu" },
  { id: 3, name: "Khoa Sản", description: "Khám phụ khoa, thai sản" },
  { id: 4, name: "Khoa Nhi", description: "Khám và điều trị cho trẻ em" },
];

/** Tổng số chỗ mỗi buổi theo khoa, trước khi trừ quota kênh app. */
export const CAPACITY: Record<number, { SANG: number; CHIEU: number }> = {
  1: { SANG: 20, CHIEU: 20 },
  2: { SANG: 10, CHIEU: 10 },
  3: { SANG: 10, CHIEU: 0 },
  4: { SANG: 20, CHIEU: 10 },
};

/** Quota kênh app — spec D6. */
export const ONLINE_QUOTA_PCT = 30;

/** Số điện thoại giả này ứng với hai hồ sơ: mẹ và con. */
export const VALID_BIRTHDATE = "1990-05-12";

export const PROFILES: PatientProfile[] = [
  {
    patientId: 101,
    patientCode: "BN0000101",
    fullName: "Nguyễn Thị Lan",
    gender: "F",
    birthdate: VALID_BIRTHDATE,
    insuranceLast4: "4821",
  },
  {
    patientId: 102,
    patientCode: "BN0000102",
    fullName: "Nguyễn Minh Khôi",
    gender: "M",
    birthdate: "2018-11-03",
    insuranceLast4: "7734",
  },
];

/**
 * Lượt khám mẫu, khoá theo hồ sơ.
 *
 * Cố ý cho hồ sơ 101 có một lượt `IN_PROGRESS` và một lượt `CANCELLED` bên cạnh
 * các lượt `DONE`: ba trạng thái ấy vẽ ra ba màu chip khác nhau, và chỉ có dữ
 * liệu đủ đa dạng mới lộ ra chuyện một nhánh trạng thái bị quên.
 */
export const VISITS: Record<number, VisitSummary[]> = {
  101: [
    {
      id: 5101,
      visitCode: "LK260814001",
      visitDate: "2026-08-14",
      status: "DONE",
      departmentId: 1,
    },
    {
      id: 5102,
      visitCode: "LK260702014",
      visitDate: "2026-07-02",
      status: "DONE",
      departmentId: 2,
    },
    {
      id: 5103,
      visitCode: "LK260615007",
      visitDate: "2026-06-15",
      status: "CANCELLED",
      departmentId: 1,
    },
  ],
  102: [
    {
      id: 5201,
      visitCode: "LK260820003",
      visitDate: "2026-08-20",
      status: "IN_PROGRESS",
      departmentId: 4,
    },
  ],
};

/**
 * Đơn thuốc mẫu. Không có đơn `DRAFT` ở đây vì máy chủ thật lọc chúng ra trước
 * khi trả về — tầng giả phải mô phỏng thứ máy chủ làm, không phải thứ bảng
 * `emr_prescription` chứa.
 */
export const PRESCRIPTIONS: Record<number, PrescriptionSummary[]> = {
  101: [
    {
      id: 7101,
      code: "DT260814001",
      status: "DISPENSED",
      issuedDate: "2026-08-14",
      visitId: 5101,
    },
    {
      id: 7102,
      code: "DT260702011",
      status: "ISSUED",
      issuedDate: "2026-07-02",
      visitId: 5102,
    },
  ],
  102: [],
};
