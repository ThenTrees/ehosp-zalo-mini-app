import { useState } from "react";
import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import LinkRequired from "@/components/link-required";
import { ClipboardIcon, InfoIcon, PillIcon } from "@/components/icons";
import { Card, EmptyState, Segmented } from "@/components/ui";
import { activePatientIdState, prescriptionsState, visitsState } from "@/state";
import VisitCard from "./visit-card";
import PrescriptionCard from "./prescription-card";

type Tab = "kham" | "thuoc";

/**
 * Lịch sử khám — hai lát cắt của cùng một quá khứ: các lần đã khám và các đơn
 * thuốc sinh ra từ chúng.
 *
 * Tên trang cố ý KHÔNG phải "Bệnh án". Trang này không hiển thị chẩn đoán, kết
 * quả hay tên thuốc — spec §6.1 quy tắc 1 — nên gọi nó là bệnh án sẽ hứa với
 * người bệnh một thứ nó không có, và họ sẽ mở ra rồi thất vọng đúng vào lúc
 * đang cần thông tin nhất.
 */
export default function RecordsPage() {
  const patientId = useAtomValue(activePatientIdState);
  const [tab, setTab] = useState<Tab>("kham");

  if (patientId === null) {
    return (
      <LinkRequired message="Liên kết hồ sơ để xem lại các lần khám và đơn thuốc của bạn." />
    );
  }

  return (
    <div>
      <SliceChoice tab={tab} onChange={setTab} patientId={patientId} />
      {tab === "kham" ? (
        <VisitList patientId={patientId} />
      ) : (
        <PrescriptionList patientId={patientId} />
      )}
      <ClinicalNotice />
    </div>
  );
}

function SliceChoice({
  tab,
  onChange,
  patientId,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
  patientId: number;
}) {
  const visits = useAtomValue(visitsState(patientId));
  const prescriptions = useAtomValue(prescriptionsState(patientId));

  return (
    <Segmented
      value={tab}
      onChange={onChange}
      options={[
        { value: "kham", label: "Lượt khám", count: visits.length },
        { value: "thuoc", label: "Đơn thuốc", count: prescriptions.length },
      ]}
    />
  );
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

function PrescriptionList({ patientId }: { patientId: number }) {
  const navigate = useNavigate();
  const prescriptions = useAtomValue(prescriptionsState(patientId));
  const visits = useAtomValue(visitsState(patientId));

  if (prescriptions.length === 0) {
    return (
      <EmptyState
        icon={PillIcon}
        title="Chưa có đơn thuốc nào"
        hint="Đơn thuốc bác sĩ kê cho bạn sẽ xuất hiện ở đây sau khi khám xong."
      />
    );
  }

  return (
    <div className="space-y-3 p-4">
      {prescriptions.map((prescription) => (
        <PrescriptionCard
          key={prescription.id}
          prescription={prescription}
          // Đơn thuốc luôn có `visitId`, nhưng lượt khám tương ứng có thể nằm
          // ngoài 100 dòng gần nhất mà máy chủ trả về. Không tìm thấy thì bỏ
          // hẳn lối đi, thay vì điều hướng tới một trang chắc chắn báo 404.
          onClick={
            visits.some((visit) => visit.id === prescription.visitId)
              ? () =>
                  navigate(`/records/${prescription.visitId}`, {
                    viewTransition: true,
                  })
              : undefined
          }
        />
      ))}
    </div>
  );
}

/**
 * Nói thẳng giới hạn của trang, ngay trên trang.
 *
 * Người bệnh mở "Lịch sử khám" để tìm chẩn đoán là chuyện sẽ xảy ra. Để họ tự
 * cuộn hết danh sách rồi tự kết luận "app này thiếu" là tệ hơn việc nói trước
 * chỗ nào có thứ họ cần.
 */
function ClinicalNotice() {
  return (
    <div className="px-4 pb-6">
      <Card className="flex gap-3">
        <InfoIcon
          width={20}
          height={20}
          className="mt-0.5 shrink-0 text-primary-ink"
        />
        {/*
          Dải chữ cũ ở đây nói "mini app chỉ hiển thị trạng thái… chẩn đoán, kết
          quả xét nghiệm và tên thuốc xem tại VNeID". Câu ấy ĐÚNG cho tới
          2026-09-03 và SAI kể từ hôm ấy — chạm vào một lần khám là thấy đủ bốn
          thứ. Để lại là dạy người bệnh đừng bấm vào thứ vừa được làm ra cho họ.
        */}
        <p className="text-sm text-ink-muted">
          Chạm vào một lần khám để xem chẩn đoán, đơn thuốc, kết quả xét nghiệm
          và bảng kê chi phí của lần đó. Bản có giá trị pháp lý nằm ở Sổ sức
          khoẻ điện tử trên VNeID.
        </p>
      </Card>
    </div>
  );
}
