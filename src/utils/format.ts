/** "1.450.000đ" — cách viết tiền quen thuộc nhất với người đọc trong nước. */
export function formatPrice(price: number) {
  return `${new Intl.NumberFormat("vi-VN").format(price)}đ`;
}

/**
 * Đổi chuỗi ngày YYYY-MM-DD của hợp đồng API sang cách viết Việt Nam.
 *
 * Tách chuỗi bằng tay chứ không qua `new Date(iso)`: hàm dựng đó hiểu chuỗi
 * chỉ có ngày là nửa đêm UTC, nên máy đặt ở múi giờ âm sẽ hiển thị lùi một
 * ngày — người bệnh đọc ra ngày hẹn sai.
 */
export const formatIsoDate = (iso: string) => {
  const [nam, thang, ngay] = iso.split("-");
  return `${ngay}/${thang}/${nam}`;
};

/** "Thứ hai, 25/08/2026" — dùng ở chi tiết lịch hẹn và bước xác nhận. */
export const formatIsoDateLong = (iso: string) => {
  const [nam, thang, ngay] = iso.split("-").map(Number);
  const date = new Date(nam, thang - 1, ngay);
  return `${formatDayName(date)}, ${formatIsoDate(iso)}`;
};

/**
 * Hôm nay theo lịch của máy, dạng YYYY-MM-DD.
 *
 * `toISOString()` không dùng được ở đây vì nó đổi sang UTC: 7 giờ sáng ngày 23
 * ở Việt Nam vẫn còn là ngày 22 theo UTC.
 */
export const todayIso = () => toIsoDate(new Date());

export const toIsoDate = (date: Date) => {
  const thang = (date.getMonth() + 1).toString().padStart(2, "0");
  const ngay = date.getDate().toString().padStart(2, "0");
  return `${date.getFullYear()}-${thang}-${ngay}`;
};

/** Nhãn buổi khám. Hợp đồng chỉ có SANG/CHIEU, không có giờ cụ thể. */
export const tenBuoi = (session: "SANG" | "CHIEU") =>
  session === "SANG" ? "Buổi sáng" : "Buổi chiều";

/** "3 giờ trước" — cho danh sách thông báo. Mốc thời gian là ISO 8601 đầy đủ. */
export const formatRelativeTime = (iso: string) => {
  const giay = Math.floor((Date.now() - Date.parse(iso)) / 1000);
  if (!isFinite(giay) || giay < 60) return "Vừa xong";
  if (giay < 3600) return `${Math.floor(giay / 60)} phút trước`;
  if (giay < 86400) return `${Math.floor(giay / 3600)} giờ trước`;
  if (giay < 604800) return `${Math.floor(giay / 86400)} ngày trước`;
  return formatIsoDate(new Date(Date.parse(iso)).toISOString().slice(0, 10));
};

export const formatDayName = (date: Date) => {
  const days = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];
  return days[date.getDay()];
};

/**
 * "T2".."T7", "CN" — cho dải chọn ngày, nơi mỗi ô chỉ rộng 64px.
 *
 * Phải là bảng riêng chứ không cắt gọt `formatDayName`: bỏ chữ "Thứ " khỏi
 * "Thứ hai" cho ra "hai", và ghép lại thành "Thai".
 */
const TEN_THU_NGAN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export const formatDayShort = (date: Date) => TEN_THU_NGAN[date.getDay()];

export const formatFullDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${day}/${month}/${year}`;
};

export const formatShortDate = (date: Date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}.${day}`;
};
