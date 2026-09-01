import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useParams } from "react-router-dom";
import LinkRequired from "@/components/link-required";
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
  visitsState,
} from "@/state";
import { formatIsoDateLong } from "@/utils/format";
import PrescriptionCard from "./prescription-card";
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

function Body({
  visitId,
  patientId,
}: {
  visitId: number;
  patientId: number;
}) {
  const visits = useAtomValue(visitsState(patientId));
  const prescriptions = useAtomValue(prescriptionsState(patientId));
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

  const ofThisVisit = prescriptions.filter((prescription) => prescription.visitId === visit.id);

  return (
    <div className="space-y-6 p-4">
      <VisitCard visit={visit} departmentName={departmentName(visit.departmentId)} />

      <div className="space-y-3">
        <SectionHeader title="Đơn thuốc của lần khám này" />
        {ofThisVisit.length === 0 ? (
          <Card>
            <p className="text-sm text-ink-muted">
              Lần khám này không có đơn thuốc nào.
            </p>
          </Card>
        ) : (
          ofThisVisit.map((prescription) => <PrescriptionCard key={prescription.id} prescription={prescription} />)
        )}
      </div>

      <Card className="flex gap-3">
        <InfoIcon
          width={20}
          height={20}
          className="mt-0.5 shrink-0 text-primary-ink"
        />
        <p className="text-sm text-ink-muted">
          Chẩn đoán, kết quả xét nghiệm và tên thuốc của lần khám này xem tại Sổ
          sức khoẻ điện tử trên VNeID, hoặc hỏi tại quầy và đọc mã lượt khám ở
          trên.
        </p>
      </Card>
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
