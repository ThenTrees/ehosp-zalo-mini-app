import { Card, SectionHeader } from "@/components/ui";
import { MoTaiLieu } from "@/components/mo-tai-lieu";
import { api } from "@/services";
import { formatIsoDateLong } from "@/utils/format";
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

/**
 * SINH HIỆU — số đo tại buồng khám, KHÔNG kèm diễn giải.
 *
 * ⚠ KHÔNG tô màu, KHÔNG so với khoảng bình thường, KHÔNG viết "hơi cao".
 * Một con số kèm nhãn "cao" trên điện thoại là một chẩn đoán do phần mềm đưa
 * ra, mà phần mềm không biết người này đang dùng thuốc gì, vừa leo mấy tầng
 * cầu thang, hay có bệnh nền nào. Người bệnh đọc "huyết áp CAO" lúc 11 giờ đêm
 * thì hoặc hoảng, hoặc tự đổi liều — cả hai đều tệ hơn việc không biết.
 *
 * Chỗ diễn giải là lời dặn của bác sĩ, ngay khối dưới, do người đã khám viết.
 *
 * Trị `null` thì KHÔNG hiện dòng đó: "—" cho một ô không đo trông y hệt một ô
 * đo được trị rỗng, và người bệnh sẽ hỏi quầy vì sao mạch của mình là gạch ngang.
 */
export function SinhHieuSection({ d }: { d: ChiTietLuotKham }) {
  const s = d.sinhHieu;
  if (!s) return null;

  const ha =
    s.huyetApTamThu !== null && s.huyetApTamTruong !== null
      ? `${s.huyetApTamThu}/${s.huyetApTamTruong}`
      : s.huyetApTamThu !== null
        ? String(s.huyetApTamThu)
        : null;

  const o: { nhan: string; tri: string | null; donVi: string }[] = [
    { nhan: "Huyết áp", tri: ha, donVi: "mmHg" },
    { nhan: "Mạch", tri: s.mach === null ? null : String(s.mach), donVi: "lần/phút" },
    { nhan: "Nhiệt độ", tri: s.nhietDo === null ? null : String(s.nhietDo), donVi: "°C" },
    { nhan: "SpO₂", tri: s.spo2 === null ? null : String(s.spo2), donVi: "%" },
    { nhan: "Nhịp thở", tri: s.nhipTho === null ? null : String(s.nhipTho), donVi: "lần/phút" },
    { nhan: "Cân nặng", tri: s.canNangKg === null ? null : String(s.canNangKg), donVi: "kg" },
    { nhan: "Chiều cao", tri: s.chieuCaoCm === null ? null : String(s.chieuCaoCm), donVi: "cm" },
    { nhan: "Đường huyết", tri: s.duongHuyet === null ? null : String(s.duongHuyet), donVi: "mmol/L" },
  ].filter((x) => x.tri !== null);

  if (o.length === 0) return null;

  return (
    <Card>
      <SectionHeader title="Sinh hiệu" />
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
        {o.map((x) => (
          <div key={x.nhan} className="flex items-baseline justify-between gap-2">
            <dt className="text-sm text-ink-muted">{x.nhan}</dt>
            <dd className="text-base font-semibold tabular-nums text-ink">
              {x.tri}
              <span className="ml-1 text-xs font-normal text-ink-muted">
                {x.donVi}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-ink-muted">
        Số đo tại buồng khám trong lần khám này. Cần hiểu ý nghĩa các con số,
        hãy hỏi bác sĩ — đừng tự so với số của người khác.
      </p>
    </Card>
  );
}

/**
 * LỜI DẶN CỦA BÁC SĨ + NGÀY TÁI KHÁM.
 *
 * Hai thứ này trước đây CHỈ có trên tờ giấy in. Ai mất tờ giấy là mất lời dặn,
 * và đó là thứ hay mất nhất trong cả tập giấy ra viện.
 *
 * Để RIÊNG một khối và đặt TRƯỚC đơn thuốc: nó là thứ người bệnh cần đọc nhất
 * và cũng là thứ dễ bị cuộn qua nhất.
 */
export function LoiDanSection({ d }: { d: ChiTietLuotKham }) {
  if (!d.loiDan && !d.ngayTaiKham) return null;
  return (
    <Card>
      <SectionHeader title="Lời dặn của bác sĩ" />
      {d.loiDan ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
          {d.loiDan}
        </p>
      ) : null}
      {d.ngayTaiKham ? (
        <p className="mt-3 rounded-md bg-primary-soft px-3 py-2 text-sm font-medium text-primary-ink">
          Hẹn tái khám: {formatIsoDateLong(d.ngayTaiKham)}
        </p>
      ) : null}
    </Card>
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

export function DonThuocSection({
  d,
  patientId,
}: {
  d: ChiTietLuotKham;
  patientId: number;
}) {
  if (d.donThuoc.length === 0) return null;
  return (
    <Card>
      <SectionHeader title="Đơn thuốc" />
      <div className="flex flex-col gap-4">
        {d.donThuoc.map((don) => (
          <div key={don.code} className="flex flex-col gap-2">
            {/*
              NÚT MỞ PDF NẰM NGAY TRÊN KHỐI ĐƠN, không chỉ ở mục "Giấy tờ" cuối
              trang: người bệnh nhìn thấy tên thuốc thì tìm tờ giấy ở ngay đó.

              Và khi CHƯA CÓ bản ký thì NÓI RA. Trên cụm hôm nay chỉ 72/1894
              lượt khám có tệp đã đóng băng, nên nhánh `null` là nhánh THƯỜNG —
              ẩn nút đi im lặng làm người bệnh tưởng chức năng hỏng, đúng chuyện
              đã xảy ra ngày 2026-09-04.
            */}
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-ink-muted">{don.code}</span>
              {don.taiLieuId ? (
                <MoTaiLieu
                  id={don.taiLieuId}
                  patientId={patientId}
                  className="shrink-0 text-xs font-medium text-primary-ink underline"
                >
                  Mở bản PDF đã ký
                </MoTaiLieu>
              ) : (
                <span className="shrink-0 text-xs text-ink-muted">
                  Chưa có bản PDF
                </span>
              )}
            </div>
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

const TEN_LOAI: Record<string, string> = {
  BENH_AN_KY: "Bệnh án ngoại trú",
  DON_THUOC_KY: "Đơn thuốc",
  BANG_KE_KY: "Bảng kê chi phí",
  HOA_DON_KY: "Hoá đơn",
  CHI_DINH_CLS_KY: "Phiếu chỉ định cận lâm sàng",
  KQ_XN: "Phiếu kết quả xét nghiệm",
};

const coKB = (b: number | null): string =>
  b == null ? "" : `${Math.max(1, Math.round(b / 1024))} KB`;

/**
 * GIẤY TỜ ĐÃ KÝ của lượt khám.
 *
 * Khác bốn khối trên ở một điểm đáng nói: chúng đọc lại từ CSDL mỗi lần mở, còn
 * đây là những tờ ĐÃ KHOÁ trong ngăn ghi-một-lần — bản mà người bệnh cầm đi đâu
 * cũng đối chiếu được, và là thứ họ cần khi đi khám nơi khác.
 *
 * MỞ BẰNG `<a target="_blank">`, KHÔNG TẢI VỀ RỒI DỰNG BLOB. Tệp đi thẳng từ
 * máy chủ vào trình xem PDF của điện thoại; giữ vài trăm KB trong RAM của một
 * chiếc máy cũ để làm đúng việc trình duyệt đã làm sẵn là một đánh đổi sai.
 * Máy chủ đã đặt `Content-Disposition: inline` và `Cache-Control: no-store`.
 */
export function TaiLieuSection({
  d,
  patientId,
}: {
  d: ChiTietLuotKham;
  patientId: number;
}) {
  if (d.taiLieu.length === 0) return null;
  return (
    <Card>
      <SectionHeader title="Giấy tờ của lần khám này" />
      <div className="flex flex-col">
        {d.taiLieu.map((t) => (
          <MoTaiLieu
            key={t.id}
            id={t.id}
            patientId={patientId}
            className="flex w-full items-baseline justify-between gap-3 border-b border-line py-2.5 text-left last:border-0"
          >
            <span className="min-w-0 flex-1 text-ink">
              {TEN_LOAI[t.loai] ?? t.tenHienThi ?? t.loai}
              {t.banSo > 1 ? (
                <span className="ml-1 text-xs text-ink-muted">
                  bản {t.banSo}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 text-xs text-primary-ink">
              Mở PDF{t.soByte ? ` · ${coKB(t.soByte)}` : ""}
            </span>
          </MoTaiLieu>
        ))}
      </div>
    </Card>
  );
}
