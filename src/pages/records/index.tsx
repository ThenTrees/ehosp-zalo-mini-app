import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import LinkRequired from "@/components/link-required";
import { ClipboardIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui";
import { activePatientIdState, visitsState } from "@/state";
import VisitCard from "./visit-card";

/**
 * Lịch sử khám — MỘT danh sách các lần đã khám, mỗi dòng kèm chẩn đoán chính.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * HAI THỨ ĐÃ GỠ NGÀY 2026-09-04, và cả hai vì cùng một lý do
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * · TAB "ĐƠN THUỐC". Nó tồn tại khi màn chi tiết chưa có gì để xem: hồi ấy đó
 *   là cách duy nhất để người bệnh biết mình đã được kê những đơn nào. Nay chạm
 *   vào một lần khám là thấy đơn thuốc ĐẦY ĐỦ của lần ấy — tên thuốc, hàm
 *   lượng, liều, lời dặn — nên một danh sách đơn tách rời, chỉ mang mã và trạng
 *   thái, là bản NGHÈO HƠN của thứ đã có, đặt ở một chỗ khác. Hai lối vào cùng
 *   một dữ liệu, lối này kém hơn lối kia, là thứ làm người dùng phải học xem
 *   nên bấm đâu.
 *
 * · DẢI "xem tại Sổ sức khoẻ điện tử trên VNeID". Nó bảo người bệnh đi nơi khác
 *   tìm đúng những thứ màn này vừa bày ra. Bản có giá trị PHÁP LÝ vẫn ở VNeID
 *   và điều đó vẫn đúng — nhưng nói câu ấy ngay trên một danh sách đã mang chẩn
 *   đoán là dạy họ đừng dùng thứ vừa làm cho họ.
 *
 * TÊN TRANG vẫn KHÔNG phải "Bệnh án", và lý do đã đổi: trước đây vì trang không
 * có nội dung lâm sàng nên gọi vậy là hứa quá. Nay nó CÓ, nhưng "bệnh án" là
 * một hồ sơ pháp lý có hình dạng do TT 32 quy định, còn đây là bản đọc cho
 * người bệnh. Gọi đúng tên vẫn quan trọng, chỉ vì một lẽ khác.
 */
export default function RecordsPage() {
  const patientId = useAtomValue(activePatientIdState);

  if (patientId === null) {
    return (
      <LinkRequired message="Liên kết hồ sơ để xem lại các lần khám của bạn." />
    );
  }

  return <VisitList patientId={patientId} />;
}

function VisitList({ patientId }: { patientId: number }) {
  const navigate = useNavigate();
  const visits = useAtomValue(visitsState(patientId));

  if (visits.length === 0) {
    return (
      <EmptyState
        icon={ClipboardIcon}
        title="Chưa có lần khám nào"
        hint="Mỗi lần bạn tới khám tại phòng khám sẽ xuất hiện ở đây."
        actionLabel="Đặt lịch khám"
        actionTo="/booking"
      />
    );
  }

  return (
    <div className="space-y-3 p-4">
      {visits.map((visit) => (
        <VisitCard
          key={visit.id}
          visit={visit}
          onClick={() =>
            navigate(`/records/${visit.id}`, { viewTransition: true })
          }
        />
      ))}
    </div>
  );
}
