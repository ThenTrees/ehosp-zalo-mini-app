import { useAtomValue } from "jotai";
import { activePatientIdState, notificationsState } from "@/state";

export default function NotificationsPage() {
  const patientId = useAtomValue(activePatientIdState);
  const notifications = useAtomValue(notificationsState(patientId ?? 0));

  if (notifications.length === 0) {
    return <div className="p-4 text-disabled">Chưa có thông báo nào.</div>;
  }

  return (
    <div className="p-4 space-y-3">
      {notifications.map((tin) => (
        <div key={tin.id} className="p-3 rounded-xl bg-white">
          <div className="font-medium">{tin.title}</div>
          <div className="text-2xs text-disabled pt-1">{tin.body}</div>
        </div>
      ))}
    </div>
  );
}
