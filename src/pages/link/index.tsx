import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import { getPhoneNumber } from "zmp-sdk";
import { Button, Input } from "zmp-ui";
import toast from "react-hot-toast";
import { api } from "@/services";
import { applyLinkState } from "@/state";

type Buoc = "BAT_DAU" | "BIRTHDATE" | "INSURANCE_LAST4";

export default function LinkPage() {
  const navigate = useNavigate();
  const applyLink = useSetAtom(applyLinkState);
  const [buoc, setBuoc] = useState<Buoc>("BAT_DAU");
  const [phoneToken, setPhoneToken] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [last4, setLast4] = useState("");
  const [dangGui, setDangGui] = useState(false);

  async function gui(token: string) {
    setDangGui(true);
    try {
      const ketQua = await api.link({
        zaloPhoneToken: token,
        birthdate: birthdate || undefined,
        insuranceLast4: last4 || undefined,
      });

      if (ketQua.outcome === "CHALLENGE") {
        setBuoc(ketQua.need);
        return;
      }

      await applyLink({
        token: ketQua.token,
        patientId: ketQua.profiles[0].patientId,
      });
      toast.success("Liên kết tài khoản thành công.");
      navigate("/", { viewTransition: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Thông tin không khớp. Vui lòng kiểm tra lại."
      );
    } finally {
      setDangGui(false);
    }
  }

  async function batDau() {
    try {
      const { token } = await getPhoneNumber();
      setPhoneToken(token ?? "");
      await gui(token ?? "");
    } catch {
      toast.error("Cần cho phép truy cập số điện thoại để liên kết hồ sơ.");
    }
  }

  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-disabled">
        Liên kết tài khoản Zalo với hồ sơ tại phòng khám để đặt lịch và xem số thứ
        tự. Bạn có thể liên kết nhiều hồ sơ cho người thân.
      </p>

      {buoc === "BAT_DAU" && (
        <Button fullWidth onClick={batDau} loading={dangGui}>
          Liên kết bằng số điện thoại Zalo
        </Button>
      )}

      {buoc === "BIRTHDATE" && (
        <>
          <Input
            label="Ngày sinh của người bệnh"
            placeholder="YYYY-MM-DD"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />
          <Button fullWidth onClick={() => gui(phoneToken)} loading={dangGui}>
            Xác nhận
          </Button>
        </>
      )}

      {buoc === "INSURANCE_LAST4" && (
        <>
          <p className="text-sm text-disabled">
            Có nhiều hồ sơ trùng thông tin. Nhập 4 số cuối thẻ BHYT của đúng hồ sơ
            bạn muốn liên kết.
          </p>
          <Input
            label="4 số cuối thẻ BHYT"
            maxLength={4}
            value={last4}
            onChange={(e) => setLast4(e.target.value)}
          />
          <Button fullWidth onClick={() => gui(phoneToken)} loading={dangGui}>
            Xác nhận
          </Button>
        </>
      )}
    </div>
  );
}
