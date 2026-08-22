import type { Department, PatientProfile } from "@/types";

export const KHOA: Department[] = [
  { id: 1, name: "Khoa Nội", description: "Khám và điều trị bệnh nội khoa" },
  { id: 2, name: "Khoa Ngoại", description: "Khám ngoại khoa, tiểu phẫu" },
  { id: 3, name: "Khoa Sản", description: "Khám phụ khoa, thai sản" },
  { id: 4, name: "Khoa Nhi", description: "Khám và điều trị cho trẻ em" },
];

/** Tổng số chỗ mỗi buổi theo khoa, trước khi trừ quota kênh app. */
export const CONG_SUAT: Record<number, { SANG: number; CHIEU: number }> = {
  1: { SANG: 20, CHIEU: 20 },
  2: { SANG: 10, CHIEU: 10 },
  3: { SANG: 10, CHIEU: 0 },
  4: { SANG: 20, CHIEU: 10 },
};

/** Quota kênh app — spec D6. */
export const QUOTA_ONLINE_PCT = 30;

/** Số điện thoại giả này ứng với hai hồ sơ: mẹ và con. */
export const NGAY_SINH_HOP_LE = "1990-05-12";

export const HO_SO: PatientProfile[] = [
  {
    patientId: 101,
    patientCode: "BN0000101",
    fullName: "Nguyễn Thị Lan",
    gender: "F",
    birthdate: NGAY_SINH_HOP_LE,
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
