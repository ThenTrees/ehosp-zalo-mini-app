import { useAtomValue } from "jotai";

import { Card, SectionHeader } from "@/components/ui";
import { trangThaiLuotState } from "@/state";
import { formatIsoDate, todayIso } from "@/utils/format";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DÒNG TIẾN ĐỘ CỦA LƯỢT KHÁM — "giờ tới đâu rồi"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Câu hỏi này người bệnh hỏi nhân viên nhiều nhất trong lúc ngồi chờ, và mỗi
 * lần hỏi là một lần ai đó rời việc để trả lời. Màn hình trả lời thay.
 *
 * BA ĐIỀU ĐÃ CÂN NHẮC:
 *
 * · CHỈ HIỆN CHẶNG CÓ THẬT. Máy chủ đã lọc: lượt khám không có chỉ định xét
 *   nghiệm thì không có chặng ấy. Một dòng "Kết quả xét nghiệm — chưa có" nằm
 *   xám vĩnh viễn làm người bệnh ngồi chờ một thứ sẽ không bao giờ tới.
 *
 * · KHÔNG ĐOÁN THỜI GIAN CÒN LẠI cho từng chặng. Màn hàng chờ đã có ước lượng
 *   dựa trên số người trước; đoán "xét nghiệm còn 20 phút" thì phải biết máy
 *   nào đang chạy, mẫu tới đâu, kỹ thuật viên có mấy người — không biết thì
 *   con số ấy là một lời hứa suông, và người bệnh nhớ lời hứa.
 *
 * · CHẶNG CHƯA XONG VẪN HIỆN, MỜ ĐI. Giấu nó thì dòng tiến độ cụt ngang và
 *   người ta không biết còn bao nhiêu bước nữa.
 */
export function TienDoLuotKham({
  visitId,
  patientId,
}: {
  visitId: number | null;
  patientId: number | null;
}) {
  const tt = useAtomValue(trangThaiLuotState({ visitId, patientId }));
  if (!tt || tt.moc.length === 0) return null;

  return (
    <Card>
      {/*
        Tiêu đề theo NGÀY CỦA LƯỢT KHÁM, không đóng cứng "hôm nay": khối này
        cũng hiện trên lượt khám cũ, và "Tiến độ khám hôm nay" trên một lượt của
        tháng trước là một câu nói dối nhỏ mà người đọc phải tự sửa trong đầu.
      */}
      <SectionHeader
        title={
          tt.visitDate === todayIso()
            ? "Tiến độ khám hôm nay"
            : `Tiến độ lượt khám ${formatIsoDate(tt.visitDate ?? "")}`
        }
      />
      <ol className="flex flex-col">
        {tt.moc.map((m, i) => (
          <li key={m.ma} className="flex gap-3">
            {/* Cột trái: chấm + đường nối. Đường nối dừng ở mục cuối. */}
            <div className="flex flex-col items-center">
              {/*
                Chấm là thứ DUY NHẤT nói xong hay chưa, và nó thuần màu sắc —
                trình đọc màn hình không thấy gì, người mù màu cũng vậy. Nhãn
                chữ đi kèm, ẩn khỏi mắt nhưng có với trình đọc.
              */}
              <span
                aria-hidden
                className={
                  "mt-1.5 h-3 w-3 shrink-0 rounded-full " +
                  (m.xong ? "bg-primary" : "border-2 border-line bg-white")
                }
              />
              {i < tt.moc.length - 1 && (
                <span aria-hidden className="w-px flex-1 bg-line" />
              )}
            </div>
            <div className="flex-1 pb-4 last:pb-0">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={
                    "text-sm " +
                    (m.xong ? "font-medium text-ink" : "text-ink-muted")
                  }
                >
                  {m.ten}
                  <span className="sr-only">
                    {m.xong ? " — đã xong" : " — chưa xong"}
                  </span>
                </span>
                {m.dem && (
                  <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                    {m.dem}
                  </span>
                )}
              </div>
              {m.luc && (
                <div className="mt-0.5 text-xs text-ink-muted">
                  {gioPhut(m.luc)}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/**
 * Chỉ giờ:phút, không ngày.
 *
 * Dòng tiến độ nói về HÔM NAY, và một chuỗi "05/09/2026 08:41" dài gấp ba mà
 * không thêm thông tin nào. Chuỗi máy chủ có thể không có múi giờ, nên cắt
 * chuỗi chứ KHÔNG dựng `Date` — dựng `Date` từ một chuỗi thiếu múi giờ là để
 * trình duyệt tự đoán, và nó đoán khác nhau giữa iOS với Android.
 */
function gioPhut(iso: string): string {
  const m = /T(\d{2}:\d{2})/.exec(iso);
  return m ? m[1] : "";
}
