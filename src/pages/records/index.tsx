import { useState } from "react";
import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import LinkRequired from "@/components/link-required";
import { ClipboardIcon, InfoIcon, PillIcon } from "@/components/icons";
import { Card, EmptyState, Segmented } from "@/components/ui";
import { activePatientIdState, prescriptionsState, visitsState } from "@/state";
import VisitCard from "./visit-card";
import PrescriptionCard from "./prescription-card";

type Lat = "kham" | "thuoc";

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
  const [lat, setLat] = useState<Lat>("kham");

  if (patientId === null) {
    return (
      <LinkRequired loiNhan="Liên kết hồ sơ để xem lại các lần khám và đơn thuốc của bạn." />
    );
  }

  return (
    <div>
      <ChonLat lat={lat} onChange={setLat} patientId={patientId} />
      {lat === "kham" ? (
        <DanhSachLuotKham patientId={patientId} />
      ) : (
        <DanhSachDonThuoc patientId={patientId} />
      )}
      <GhiChuLamSang />
    </div>
  );
}

function ChonLat({
  lat,
  onChange,
  patientId,
}: {
  lat: Lat;
  onChange: (lat: Lat) => void;
  patientId: number;
}) {
  const luotKham = useAtomValue(visitsState(patientId));
  const donThuoc = useAtomValue(prescriptionsState(patientId));

  return (
    <Segmented
      value={lat}
      onChange={onChange}
      options={[
        { value: "kham", label: "Lượt khám", count: luotKham.length },
        { value: "thuoc", label: "Đơn thuốc", count: donThuoc.length },
      ]}
    />
  );
}

function DanhSachLuotKham({ patientId }: { patientId: number }) {
  const navigate = useNavigate();
  const luotKham = useAtomValue(visitsState(patientId));

  if (luotKham.length === 0) {
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
      {luotKham.map((luot) => (
        <VisitCard
          key={luot.id}
          luot={luot}
          onClick={() =>
            navigate(`/records/${luot.id}`, { viewTransition: true })
          }
        />
      ))}
    </div>
  );
}

function DanhSachDonThuoc({ patientId }: { patientId: number }) {
  const navigate = useNavigate();
  const donThuoc = useAtomValue(prescriptionsState(patientId));
  const luotKham = useAtomValue(visitsState(patientId));

  if (donThuoc.length === 0) {
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
      {donThuoc.map((don) => (
        <PrescriptionCard
          key={don.id}
          don={don}
          // Đơn thuốc luôn có `visitId`, nhưng lượt khám tương ứng có thể nằm
          // ngoài 100 dòng gần nhất mà máy chủ trả về. Không tìm thấy thì bỏ
          // hẳn lối đi, thay vì điều hướng tới một trang chắc chắn báo 404.
          onClick={
            luotKham.some((lk) => lk.id === don.visitId)
              ? () =>
                  navigate(`/records/${don.visitId}`, { viewTransition: true })
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
function GhiChuLamSang() {
  return (
    <div className="px-4 pb-6">
      <Card className="flex gap-3">
        <InfoIcon
          width={20}
          height={20}
          className="mt-0.5 shrink-0 text-primary-ink"
        />
        <p className="text-sm text-ink-muted">
          Mini app chỉ hiển thị trạng thái các lần khám và đơn thuốc. Chẩn đoán,
          kết quả xét nghiệm và tên thuốc cụ thể xem tại Sổ sức khoẻ điện tử
          trên VNeID, hoặc hỏi trực tiếp tại quầy của phòng khám.
        </p>
      </Card>
    </div>
  );
}
