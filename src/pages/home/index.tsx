import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { Button } from "zmp-ui";
import { activePatientIdState, appointmentsState, profilesState } from "@/state";

export default function HomePage() {
  const navigate = useNavigate();
  const profiles = useAtomValue(profilesState);
  const patientId = useAtomValue(activePatientIdState);
  const appointments = useAtomValue(appointmentsState(patientId));

  if (profiles.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <p className="text-sm text-disabled">
          Liên kết tài khoản Zalo với hồ sơ tại phòng khám để đặt lịch khám và xem
          số thứ tự.
        </p>
        <Button
          fullWidth
          onClick={() => navigate("/link", { viewTransition: true })}
        >
          Liên kết hồ sơ
        </Button>
      </div>
    );
  }

  const sapToi = appointments.filter((h) => h.status === "Scheduled");

  return (
    <div className="p-4 space-y-4">
      <Button
        fullWidth
        onClick={() => navigate("/booking", { viewTransition: true })}
      >
        Đặt lịch khám
      </Button>

      <div className="space-y-2">
        <div className="font-medium">Lịch hẹn sắp tới</div>
        {sapToi.length === 0 ? (
          <div className="text-2xs text-disabled">Bạn chưa có lịch hẹn nào.</div>
        ) : (
          sapToi.map((hen) => (
            <button
              key={hen.id}
              onClick={() =>
                navigate(`/appointments/${hen.id}`, { viewTransition: true })
              }
              className="w-full text-left p-3 rounded-xl bg-white"
            >
              <div className="font-medium">{hen.department.name}</div>
              <div className="text-2xs text-disabled">
                {hen.apptDate} ·{" "}
                {hen.session === "SANG" ? "Buổi sáng" : "Buổi chiều"}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate("/invoices", { viewTransition: true })}
        >
          Hoá đơn
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/notifications", { viewTransition: true })}
        >
          Thông báo
        </Button>
      </div>
    </div>
  );
}
