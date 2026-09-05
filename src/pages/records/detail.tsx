import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useParams } from "react-router-dom";
import LinkRequired from "@/components/link-required";
import { TienDoLuotKham } from "@/components/tien-do-luot-kham";
import {
  CalendarIcon,
  ClipboardIcon,
  InfoIcon,
  StethoscopeIcon,
} from "@/components/icons";
import {
  Card,
  EmptyState,
  SectionHeader,
  StatusChip,
  visitTone,
} from "@/components/ui";
import {
  activePatientIdState,
  customTitleState,
  departmentNameState,
  prescriptionsState,
  visitDetailState,
  visitsState,
} from "@/state";
import { formatIsoDateLong } from "@/utils/format";
import PrescriptionCard from "./prescription-card";
import {
  BangKeSection,
  ChanDoanSection,
  SinhHieuSection,
  LoiDanSection,
  TaiLieuSection,
  DonThuocSection,
  XetNghiemSection,
} from "./clinical-sections";
import type { VisitSummary } from "@/types";

/**
 * Chi tiết một lần khám: lần khám ấy, và những đơn thuốc sinh ra từ nó.
 *
 * Không gọi thêm tuyến nào — máy chủ không có `/visits/:id`, và cũng không cần:
 * danh sách lượt khám và danh sách đơn thuốc đã nằm sẵn trong state, nối lại
 * bằng `visitId`. Thêm một tuyến chỉ để đọc một dòng đã có là thêm một bề mặt
 * phải canh chốt phạm vi hồ sơ.
 */
export default function RecordDetailPage() {
  const { visitId } = useParams();
  const patientId = useAtomValue(activePatientIdState);

  if (patientId === null) {
    return <LinkRequired message="Liên kết hồ sơ để xem lại lần khám này." />;
  }

  return <Body visitId={Number(visitId)} patientId={patientId} />;
}

function Body({ visitId, patientId }: { visitId: number; patientId: number }) {
  const visits = useAtomValue(visitsState(patientId));
  const prescriptions = useAtomValue(prescriptionsState(patientId));
  /*
   * Đọc theo `visitId` TRÊN URL, không theo `visit.id` đã lọc — hook không đặt
   * sau một điều kiện được, mà `visit` thì chỉ tính ra ở dưới. Nghĩa là gõ tay
   * một id không thuộc mình VẪN gửi một lời gọi đi.
   *
   * Điều đó không sao, và chỗ chốt nằm đúng chỗ nó phải nằm: máy chủ lọc
   * `patient_id` ngay trong câu SQL của `chiTietLuotKham()` và trả 404. Nhánh
   * `!visit` bên dưới chỉ là phép lịch sự phía máy khách, KHÔNG phải chốt an
   * ninh — đừng ai gỡ chốt máy chủ vì thấy nó ở đây.
   */
  const chiTiet = useAtomValue(visitDetailState({ id: visitId, patientId }));
  const departmentName = useAtomValue(departmentNameState);
  const setTitle = useSetAtom(customTitleState);

  const visit = visits.find((visit) => visit.id === visitId);
  const title = visit ? departmentName(visit.departmentId) : "Lần khám";

  useEffect(() => {
    setTitle(title);
    return () => setTitle("");
  }, [title, setTitle]);

  if (!visit) {
    return (
      <EmptyState
        icon={ClipboardIcon}
        title="Không tìm thấy lần khám"
        hint="Lần khám này không thuộc hồ sơ đang xem, hoặc đã quá xa để hiển thị."
        actionLabel="Về lịch sử khám"
        actionTo="/records"
      />
    );
  }

  const ofThisVisit = prescriptions.filter(
    (prescription) => prescription.visitId === visit.id,
  );

  return (
    <div className="space-y-6 p-4">
      <VisitCard
        visit={visit}
        departmentName={departmentName(visit.departmentId)}
      />

      {chiTiet ? (
        <>
          {/*
            Cũng hiện ở lượt khám CŨ: người bệnh mở lại để biết lần ấy đã làm
            những gì, và dòng tiến độ tóm tắt điều đó gọn hơn bốn khối bên dưới.
          */}
          <TienDoLuotKham visitId={visitId} patientId={patientId} />
          <ChanDoanSection d={chiTiet} />
          {/*
            Sinh hiệu và lời dặn đứng NGAY SAU chẩn đoán, TRƯỚC đơn thuốc: đó là
            thứ tự người bệnh đọc một tờ ra viện — bị gì, đo được gì, dặn gì,
            rồi mới tới uống gì.
          */}
          <SinhHieuSection d={chiTiet} />
          <LoiDanSection d={chiTiet} />
          <DonThuocSection d={chiTiet} patientId={patientId} />
          <XetNghiemSection d={chiTiet} />
          <BangKeSection d={chiTiet} />
          <TaiLieuSection d={chiTiet} patientId={patientId} />
        </>
      ) : null}

      {/*
        HAI KHỐI ĐÃ GỠ Ở ĐÂY, ngày 2026-09-03:

        · "Đơn thuốc của lần khám này" dựng từ `PrescriptionSummary` — nó chỉ có
          mã đơn, ngày kê và trạng thái phát. `DonThuocSection` bên trên nay bày
          đúng những đơn ấy KÈM tên thuốc, hàm lượng, liều và lời dặn. Giữ cả
          hai là in hai lần cùng một đơn, lần sau nghèo hơn lần trước.

        · Dải "chẩn đoán, kết quả xét nghiệm và tên thuốc xem tại VNeID" — câu ấy
          đứng NGAY DƯỚI chính chẩn đoán, kết quả và tên thuốc mà nó bảo là không
          có. Nó đúng cho tới hôm nay và sai kể từ hôm nay.

        Bản có giá trị PHÁP LÝ vẫn ở VNeID, và câu ấy nay nằm một lần duy nhất ở
        cuối màn Lịch sử khám — nơi nó còn đúng.
      */}
    </div>
  );
}

function VisitCard({
  visit,
  departmentName,
}: {
  visit: VisitSummary;
  departmentName: string;
}) {
  const { label, tone } = visitTone(visit);

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-2xs text-ink-muted">Chuyên khoa</div>
          <div className="mt-0.5 truncate text-xl font-bold text-ink">
            {departmentName}
          </div>
        </div>
        <StatusChip tone={tone}>{label}</StatusChip>
      </div>

      <div className="mt-4 space-y-3 border-t border-line pt-4">
        <div className="flex items-center gap-3">
          <CalendarIcon width={20} height={20} className="text-primary-ink" />
          <span className="text-base text-ink">
            {formatIsoDateLong(visit.visitDate)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StethoscopeIcon
            width={20}
            height={20}
            className="shrink-0 text-primary-ink"
          />
          <span className="font-mono text-base tracking-wide text-ink">
            {visit.visitCode}
          </span>
        </div>
      </div>
    </Card>
  );
}
