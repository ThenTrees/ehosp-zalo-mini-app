import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { Button } from "zmp-ui";
import toast from "react-hot-toast";
import { activePatientIdState, profilesState, unlinkState } from "@/state";
import { formatFullDate } from "@/utils/format";

export default function ProfilesPage() {
  const navigate = useNavigate();
  const profiles = useAtomValue(profilesState);
  const [activeId, setActiveId] = useAtom(activePatientIdState);
  const unlink = useSetAtom(unlinkState);

  if (profiles.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <p className="text-sm text-disabled">
          Chưa có hồ sơ nào được liên kết với tài khoản này.
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

  return (
    <div className="p-4 space-y-3">
      {profiles.map((profile) => (
        <button
          key={profile.patientId}
          onClick={() => setActiveId(profile.patientId)}
          className={`w-full text-left p-3 rounded-xl bg-white border ${
            profile.patientId === activeId
              ? "border-primary"
              : "border-transparent"
          }`}
        >
          <div className="font-medium">{profile.fullName}</div>
          <div className="text-2xs text-disabled">
            {profile.patientCode} · {formatFullDate(new Date(profile.birthdate))}
          </div>
        </button>
      ))}

      <Button
        fullWidth
        variant="secondary"
        onClick={() => navigate("/link", { viewTransition: true })}
      >
        Liên kết thêm hồ sơ
      </Button>

      {activeId !== null && (
        <Button
          fullWidth
          variant="tertiary"
          onClick={async () => {
            await unlink(activeId);
            toast.success("Đã huỷ liên kết hồ sơ.");
          }}
        >
          Huỷ liên kết hồ sơ đang chọn
        </Button>
      )}
    </div>
  );
}
