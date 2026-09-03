import { useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/button";
import {
  CalendarIcon,
  ClipboardIcon,
  CheckCircleIcon,
  IdCardIcon,
  LogOutIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/icons";
import { Card, EmptyState, ListRow, PageHeading } from "@/components/ui";
import { activePatientIdState, profilesState, unlinkState } from "@/state";
import { formatIsoDate } from "@/utils/format";
import type { PatientProfile } from "@/types";

const GENDER_LABELS: Record<PatientProfile["gender"], string> = {
  M: "Nam",
  F: "Nữ",
  U: "Chưa rõ",
};

/** Chữ cái đầu của tên, dùng thay ảnh đại diện — mini app không xin ảnh Zalo. */
function initial(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] ?? "?").toUpperCase();
}

export default function ProfilesPage() {
  const navigate = useNavigate();
  const profiles = useAtomValue(profilesState);
  const [activeId, setActiveId] = useAtom(activePatientIdState);
  const unlink = useSetAtom(unlinkState);
  const [confirmingUnlink, setConfirmingUnlink] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  if (profiles.length === 0) {
    return (
      <EmptyState
        icon={ShieldIcon}
        title="Chưa liên kết hồ sơ nào"
        hint="Liên kết tài khoản Zalo với hồ sơ tại phòng khám để đặt lịch khám và xem hoá đơn."
        actionLabel="Liên kết hồ sơ"
        actionTo="/link"
      />
    );
  }

  const viewing =
    profiles.find((p) => p.patientId === activeId) ?? profiles[0] ?? null;

  return (
    <div>
      <PageHeading title="Hồ sơ của tôi" />

      <div className="space-y-6 p-4 pt-0">
        {viewing && (
          <Card className="text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-2xl font-bold text-primary-ink">
              {initial(viewing.fullName)}
            </span>
            <div className="mt-3 text-xl font-bold text-ink">
              {viewing.fullName}
            </div>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1 text-sm text-ink-muted">
              <IdCardIcon width={16} height={16} />
              Mã BN: {viewing.patientCode}
            </div>
          </Card>
        )}

        {viewing && (
          <Section title="Thông tin cá nhân">
            <ListRow
              icon={CalendarIcon}
              label="Ngày sinh"
              value={formatIsoDate(viewing.birthdate)}
              valueOnRight
            />
            <Divider />
            <ListRow
              icon={UserIcon}
              label="Giới tính"
              value={GENDER_LABELS[viewing.gender]}
              valueOnRight
            />
            {viewing.insuranceLast4 && (
              <>
                <Divider />
                <ListRow
                  icon={ShieldIcon}
                  label="Thẻ BHYT"
                  value={`•••• ${viewing.insuranceLast4}`}
                  valueOnRight
                />
              </>
            )}
          </Section>
        )}

        <Section title={`Hồ sơ đã liên kết (${profiles.length})`}>
          {profiles.map((profile, i) => (
            <div key={profile.patientId}>
              {i > 0 && <Divider />}
              <button
                type="button"
                onClick={() => setActiveId(profile.patientId)}
                className="flex w-full min-h-14 items-center gap-3 px-4 py-3 text-left active:bg-surface-sunken"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-base font-bold text-primary-ink">
                  {initial(profile.fullName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base text-ink">
                    {profile.fullName}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-ink-muted">
                    {profile.patientCode}
                  </span>
                </span>
                {profile.patientId === (activeId ?? profiles[0]?.patientId) && (
                  <CheckCircleIcon
                    width={22}
                    height={22}
                    className="shrink-0 text-primary"
                  />
                )}
              </button>
            </div>
          ))}
        </Section>

        <Section title="Tài khoản">
          <ListRow
            icon={ClipboardIcon}
            label="Lịch sử khám"
            onClick={() => navigate("/records", { viewTransition: true })}
          />
          <Divider />
          <ListRow
            icon={IdCardIcon}
            label="Liên kết thêm hồ sơ người thân"
            onClick={() => navigate("/link", { viewTransition: true })}
          />
          <Divider />
          {confirmingUnlink ? (
            <div className="space-y-3 p-4">
              <p className="text-sm text-ink">
                Huỷ liên kết hồ sơ <b>{viewing?.fullName}</b>? Bạn sẽ không xem
                được lịch hẹn và hoá đơn của hồ sơ này cho tới khi liên kết lại.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  disabled={unlinking}
                  onClick={() => setConfirmingUnlink(false)}
                >
                  Giữ lại
                </Button>
                <Button
                  variant="danger"
                  loading={unlinking}
                  onClick={async () => {
                    if (activeId === null) return;
                    /*
                     * `try/catch` là bắt buộc ở đây, không phải cho đẹp.
                     * `ErrorBoundary` của react-router KHÔNG bắt lỗi ném trong
                     * trình xử lý sự kiện, nên bản trước biến một lần huỷ liên
                     * kết thất bại thành unhandled rejection: khung xác nhận
                     * đứng im, không toast thành công lẫn thất bại, người dùng
                     * không biết mình đã bấm hay chưa. Một thao tác KHÔNG HOÀN
                     * LẠI ĐƯỢC mà hỏng trong im lặng là kiểu hỏng tệ nhất.
                     */
                    setUnlinking(true);
                    try {
                      await unlink(activeId);
                      setConfirmingUnlink(false);
                      toast.success("Đã huỷ liên kết hồ sơ.");
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Không huỷ liên kết được. Vui lòng thử lại.",
                      );
                    } finally {
                      setUnlinking(false);
                    }
                  }}
                >
                  Huỷ liên kết
                </Button>
              </div>
            </div>
          ) : (
            <ListRow
              icon={LogOutIcon}
              label="Huỷ liên kết hồ sơ đang chọn"
              danger
              chevron={false}
              disabled={activeId === null}
              onClick={() => setConfirmingUnlink(true)}
            />
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-2 px-1 text-2xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </h2>
      <Card bare>{children}</Card>
    </div>
  );
}

function Divider() {
  return <div className="ml-16 border-t border-line" />;
}
