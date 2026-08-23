import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import LinkRequired from "@/components/link-required";
import {
  AlertCircleIcon,
  BellIcon,
  CalendarIcon,
  ChevronRightIcon,
  IconProps,
  InfoIcon,
} from "@/components/icons";
import { EmptyState } from "@/components/ui";
import {
  activePatientIdState,
  notificationsSeenAtState,
  notificationsState,
} from "@/state";
import { formatRelativeTime } from "@/utils/format";
import type { NotificationKind } from "@/types";
import { ComponentType } from "react";

const KIEU: Record<
  NotificationKind,
  { icon: ComponentType<IconProps>; mau: string }
> = {
  RESULT_READY: { icon: InfoIcon, mau: "bg-primary-soft text-primary-ink" },
  APPOINTMENT_REMINDER: {
    icon: CalendarIcon,
    mau: "bg-success-soft text-success",
  },
  APPOINTMENT_CHANGED: {
    icon: AlertCircleIcon,
    mau: "bg-warning-soft text-warning",
  },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const patientId = useAtomValue(activePatientIdState);
  const notifications = useAtomValue(notificationsState(patientId));
  const seenAt = useAtomValue(notificationsSeenAtState);
  const danhDauDaXem = useSetAtom(notificationsSeenAtState);

  // Giữ lại mốc lúc mở màn để những tin mới vẫn được tô nền trong suốt lượt
  // xem này; nếu đọc thẳng atom thì nền biến mất ngay khi ghi mốc mới.
  const [mocLucMo] = useState(seenAt);

  useEffect(() => {
    danhDauDaXem(new Date().toISOString());
  }, [danhDauDaXem]);

  if (patientId === null) {
    return (
      <LinkRequired loiNhan="Liên kết hồ sơ để nhận thông báo từ phòng khám." />
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={BellIcon}
        title="Chưa có thông báo nào"
        hint="Phòng khám sẽ nhắc bạn trước lịch hẹn và báo khi có thay đổi."
      />
    );
  }

  const moc = mocLucMo === null ? null : Date.parse(mocLucMo);

  return (
    <div className="divide-y divide-line">
      {notifications.map((tin) => {
        const { icon: Icon, mau } = KIEU[tin.kind];
        const chuaDoc = moc === null || Date.parse(tin.createdAt) > moc;
        const moDuoc = tin.appointmentId !== undefined;

        return (
          <button
            key={tin.id}
            type="button"
            disabled={!moDuoc}
            onClick={() =>
              navigate(`/appointments/${tin.appointmentId}`, {
                viewTransition: true,
              })
            }
            className={`flex w-full items-start gap-3 p-4 text-left ${
              chuaDoc ? "bg-surface-sunken" : "bg-surface"
            } ${moDuoc ? "active:bg-surface-sunken" : ""}`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${mau}`}
            >
              <Icon width={20} height={20} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span
                  className={`min-w-0 flex-1 text-base ${chuaDoc ? "font-semibold text-ink" : "text-ink"}`}
                >
                  {tin.title}
                </span>
                <span className="shrink-0 text-3xs text-ink-muted">
                  {formatRelativeTime(tin.createdAt)}
                </span>
              </span>
              <span className="mt-1 block text-sm text-ink-muted">
                {tin.body}
              </span>
            </span>

            {moDuoc && (
              <ChevronRightIcon
                width={18}
                height={18}
                className="mt-2 shrink-0 text-line-strong"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
