import { getStorage, setStorage } from "zmp-sdk";

import type { BuaAn, MaBuoi } from "@/utils/lich-uong-thuoc";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LỊCH NHẮC UỐNG THUỐC — lưu ở MÁY, không ở máy chủ
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * VÌ SAO KHÔNG ĐẨY LÊN MÁY CHỦ. Lịch này là giờ sinh hoạt của một người —
 * mấy giờ họ ăn sáng, mấy giờ họ đi ngủ. Nó KHÔNG phải dữ liệu khám chữa bệnh,
 * phòng khám không cần nó để làm gì, và cất nó vào một hệ thống có nghĩa vụ
 * lưu trữ theo Luật KCB là biến một tiện ích thành một khoản nợ dữ liệu.
 *
 * Đổi lại: đổi điện thoại là mất lịch. Đó là đánh đổi đúng cho một thứ dựng
 * lại trong ba mươi giây.
 *
 * ⚠ CHƯA CÓ ĐẨY THÔNG BÁO THẬT. Nền tảng Zalo Mini App không cho hẹn giờ báo
 * cục bộ, còn đẩy từ máy chủ thì phải qua ZNS — mà ZNS đòi mẫu tin được duyệt,
 * phiếu đồng ý theo mục đích riêng, và kênh gửi hiện đang là `GHI_SO` ("không
 * gửi gì cả"). Nên bản này LƯU lịch và HIỆN lại; nút bật/tắt là thật, đường
 * gửi thì chưa. Màn hình phải nói đúng điều đó chứ không hứa suông.
 */
const KHOA = "lich_nhac_thuoc";

export interface MotNhac {
  buoi: MaBuoi;
  bua: BuaAn;
  /** "07:00" — người bệnh tự chọn. */
  gio: string;
  thuoc: string[];
}

export interface LichNhacThuoc {
  visitId: number;
  patientId: number;
  /** Ngày bắt đầu, YYYY-MM-DD. */
  tuNgay: string;
  soNgay: number;
  nhac: MotNhac[];
  taoLuc: string;
}

type Kho = Record<string, LichNhacThuoc>;

const khoaCua = (patientId: number, visitId: number) => `${patientId}:${visitId}`;

async function docKho(): Promise<Kho> {
  try {
    const d = await getStorage({ keys: [KHOA] });
    const raw = (d as Record<string, unknown>)?.[KHOA];
    return typeof raw === "string" && raw ? (JSON.parse(raw) as Kho) : {};
  } catch (e) {
    /*
     * ⚠ ĐỌC HỎNG THÌ NÉM, ĐỪNG TRẢ KHO RỖNG.
     *
     * Bản đầu nuốt lỗi và trả `{}` với lý lẽ "màn hình trắng tệ hơn". Lý lẽ ấy
     * đúng cho việc ĐỌC nhưng giết dữ liệu ở việc GHI: `luuLich` đọc kho, thêm
     * một khoá, rồi ghi ĐÈ cả kho. Một lần đọc hỏng trả `{}` biến lượt ghi kế
     * tiếp thành "xoá sạch lịch của mọi lượt khám khác rồi lưu mỗi cái này".
     *
     * Nay ném, và `docLich` — đường ĐỌC, nơi lý lẽ cũ vẫn đúng — tự bắt lấy.
     */
    throw e instanceof Error ? e : new Error('Không đọc được kho lịch nhắc.');
  }
}

export async function docLich(
  patientId: number, visitId: number,
): Promise<LichNhacThuoc | null> {
  // Đường ĐỌC: kho hỏng thì coi như chưa có lịch. Một màn hình "chưa bật nhắc"
  // vẫn dùng được, còn một màn hình trắng thì không.
  try {
    return (await docKho())[khoaCua(patientId, visitId)] ?? null;
  } catch {
    return null;
  }
}

export async function luuLich(l: LichNhacThuoc): Promise<void> {
  const kho = await docKho();
  kho[khoaCua(l.patientId, l.visitId)] = l;
  await setStorage({ data: { [KHOA]: JSON.stringify(kho) } });
}

export async function xoaLich(patientId: number, visitId: number): Promise<void> {
  const kho = await docKho();
  delete kho[khoaCua(patientId, visitId)];
  await setStorage({ data: { [KHOA]: JSON.stringify(kho) } });
}

/**
 * Lời nhắc kế tiếp còn hiệu lực, hoặc `null` khi lịch đã hết hạn.
 *
 * Dùng để màn hình nói "lần nhắc tới: 19:00 hôm nay" thay vì chỉ liệt kê giờ —
 * và để biết khi nào nên tự dọn một lịch đã qua.
 */
export function nhacKeTiep(
  l: LichNhacThuoc, bayGio = new Date(),
): { gio: string; buoi: MaBuoi } | null {
  const het = new Date(`${l.tuNgay}T00:00:00`);
  het.setDate(het.getDate() + l.soNgay);
  if (bayGio >= het) return null;

  const phutHienTai = bayGio.getHours() * 60 + bayGio.getMinutes();
  const theoGio = [...l.nhac].sort((a, b) => a.gio.localeCompare(b.gio));
  const sapToi = theoGio.find((n) => {
    const [h, m] = n.gio.split(":").map(Number);
    return h * 60 + m > phutHienTai;
  });
  // Hết giờ trong ngày thì lời nhắc kế tiếp là lời đầu tiên của ngày mai.
  const n = sapToi ?? theoGio[0];
  return n ? { gio: n.gio, buoi: n.buoi } : null;
}
