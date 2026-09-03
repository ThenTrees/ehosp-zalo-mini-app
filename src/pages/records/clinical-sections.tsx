import { Card, SectionHeader } from "@/components/ui";
import type { ChiTietLuotKham } from "@/types";

/**
 * BỐN NHÓM NỘI DUNG LÂM SÀNG của một lượt khám.
 *
 * Tách khỏi `detail.tsx` vì trang ấy đã dài, và vì bốn khối này là thứ duy nhất
 * đổi khi hợp đồng lâm sàng đổi — gom lại một chỗ thì lần sau chỉ phải đọc một
 * tệp.
 *
 * ⚠ BA QUY TẮC HIỂN THỊ, và cả ba đều là quyết định chứ không phải thẩm mỹ:
 *
 * 1. `null` KHÁC mảng rỗng, và màn hình phải nói ra sự khác nhau ấy.
 *    Máy chủ trả `xetNghiem: null` khi dịch vụ cận lâm sàng không trả lời được,
 *    `[]` khi lượt khám ấy không có xét nghiệm nào. Vẽ cả hai thành "không có
 *    kết quả" là nói với người bệnh rằng họ chưa từng làm xét nghiệm, trong khi
 *    thật ra hệ thống đang hỏng.
 *
 * 2. TRỊ XÉT NGHIỆM LUÔN ĐI KÈM KHOẢNG THAM CHIẾU. Một con số trần buộc người
 *    bệnh đi tra trên mạng, và thứ họ tìm thấy ở đó không biết khoảng chuẩn của
 *    phòng xét nghiệm này. Cờ bất thường lấy từ `co` — do phòng xét nghiệm
 *    chấm, KHÔNG phải do app tự so `tri` với `[thapNhat, caoNhat]`: ngưỡng thật
 *    còn phụ thuộc tuổi, giới và phương pháp đo.
 *
 * 3. KHÔNG DIỄN GIẢI, KHÔNG KHUYÊN. App bày lại đúng thứ trong bệnh án. Thêm
 *    một câu "chỉ số này cao, bạn nên…" là hành nghề y trên một màn hình không
 *    ai ký tên.
 */

const soTien = (v: string | number | null | undefined): string =>
  v == null ? "—" : Number(v).toLocaleString("vi-VN") + "đ";

/** Dải nói rõ "không lấy được", phân biệt với "không có gì". */
function KhongLayDuoc({ ten }: { ten: string }) {
  return (
    <div className="rounded-md bg-warning-soft px-3 py-2 text-sm text-ink">
      Chưa lấy được {ten}. Dữ liệu vẫn còn trong hồ sơ tại phòng khám — vui lòng
      thử lại sau ít phút.
    </div>
  );
}

export function ChanDoanSection({ d }: { d: ChiTietLuotKham }) {
  if (d.chanDoan.length === 0) return null;
  return (
    <Card>
      <SectionHeader title="Chẩn đoán" />
      <ul className="flex flex-col gap-2">
        {d.chanDoan.map((c) => (
          <li key={c.ma} className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 rounded bg-primary-soft px-1.5 py-0.5 text-xs font-medium text-primary-ink">
              {c.ma}
            </span>
            <span className="text-ink">
              {c.ten}
              {c.chinh ? (
                <span className="ml-1 text-xs text-ink-muted">(chính)</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function DonThuocSection({ d }: { d: ChiTietLuotKham }) {
  if (d.donThuoc.length === 0) return null;
  return (
    <Card>
      <SectionHeader title="Đơn thuốc" />
      <div className="flex flex-col gap-4">
        {d.donThuoc.map((don) => (
          <div key={don.code} className="flex flex-col gap-2">
            <div className="text-xs text-ink-muted">{don.code}</div>
            {don.thuoc.map((t, i) => (
              <div
                key={`${don.code}-${i}`}
                className="rounded-md bg-surface-sunken p-3"
              >
                <div className="font-medium text-ink">
                  {t.ten}
                  {t.hamLuong ? ` ${t.hamLuong}` : ""}
                </div>
                <div className="mt-1 text-sm text-ink-muted">
                  {t.soLuong}
                  {t.donVi ?? ""}
                  {t.lieu ? ` · ${t.lieu}` : ""}
                  {t.soLan ? ` · ${t.soLan}` : ""}
                  {t.soNgay ? ` · ${t.soNgay} ngày` : ""}
                </div>
                {t.loiDan ? (
                  <div className="mt-1 text-sm text-ink">{t.loiDan}</div>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function XetNghiemSection({ d }: { d: ChiTietLuotKham }) {
  if (d.xetNghiem === null) {
    return (
      <Card>
        <SectionHeader title="Kết quả xét nghiệm" />
        <KhongLayDuoc ten="kết quả xét nghiệm" />
      </Card>
    );
  }
  if (d.xetNghiem.length === 0) return null;
  return (
    <Card>
      <SectionHeader title="Kết quả xét nghiệm" />
      <div className="flex flex-col gap-4">
        {d.xetNghiem.map((p) => (
          <div key={p.accessionNo} className="flex flex-col gap-2">
            <div className="text-sm font-medium text-ink">
              {p.serviceName ?? p.accessionNo}
            </div>
            {p.chiSo.map((c) => {
              const khoang =
                c.thapNhat != null || c.caoNhat != null
                  ? `${c.thapNhat ?? ""}–${c.caoNhat ?? ""}${c.donVi ? ` ${c.donVi}` : ""}`
                  : c.khoangChu;
              return (
                <div
                  key={`${p.accessionNo}-${c.ma}`}
                  className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0"
                >
                  <span className="text-ink">{c.ten}</span>
                  <span className="shrink-0 text-right">
                    <span
                      className={
                        c.co
                          ? "font-semibold text-warning"
                          : "font-medium text-ink"
                      }
                    >
                      {c.tri ?? "—"}
                      {c.donVi ? ` ${c.donVi}` : ""}
                    </span>
                    {khoang ? (
                      <span className="block text-xs text-ink-muted">
                        bình thường: {khoang}
                      </span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function BangKeSection({ d }: { d: ChiTietLuotKham }) {
  if (d.bangKe === null) return null; // chưa thanh toán thì chưa có bảng kê
  const bk = d.bangKe;
  return (
    <Card>
      <SectionHeader title="Bảng kê chi phí" />
      <div className="flex flex-col gap-2">
        {bk.items.map((it, i) => (
          <div
            key={i}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <span className="text-ink">
              {it.item_name}
              {Number(it.quantity) > 1 ? ` ×${it.quantity}` : ""}
            </span>
            <span className="shrink-0 text-ink-muted">{soTien(it.amount)}</span>
          </div>
        ))}
        <div className="mt-2 border-t border-line pt-2 text-sm">
          <div className="flex justify-between text-ink-muted">
            <span>Bảo hiểm chi trả</span>
            <span>{soTien(bk.bhyt_amount)}</span>
          </div>
          <div className="flex justify-between font-semibold text-ink">
            <span>Bạn tự trả</span>
            <span>{soTien(bk.patient_amount)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
