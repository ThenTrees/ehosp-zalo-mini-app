import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import { getPhoneNumber } from "zmp-sdk";
import toast from "react-hot-toast";
import { api } from "@/services";
import { applyLinkState } from "@/state";
import { Button } from "@/components/button";
import { AlertCircleIcon, ShieldIcon } from "@/components/icons";

type Buoc = "BAT_DAU" | "BIRTHDATE" | "INSURANCE_LAST4";

export default function LinkPage() {
  const navigate = useNavigate();
  const applyLink = useSetAtom(applyLinkState);
  const [buoc, setBuoc] = useState<Buoc>("BAT_DAU");
  const [phoneToken, setPhoneToken] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [last4, setLast4] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");

  async function gui(token: string) {
    setDangGui(true);
    setLoi("");
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
      setLoi(
        error instanceof Error
          ? error.message
          : "Thông tin không khớp. Vui lòng kiểm tra lại.",
      );
    } finally {
      setDangGui(false);
    }
  }

  async function batDau() {
    setLoi("");
    try {
      const { token } = await getPhoneNumber();
      setPhoneToken(token ?? "");
      await gui(token ?? "");
    } catch {
      setLoi("Cần cho phép truy cập số điện thoại để liên kết hồ sơ.");
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
          <ShieldIcon width={30} height={30} />
        </span>
        <h1 className="text-2xl font-bold tracking-tightest text-ink">
          Liên kết hồ sơ
        </h1>
        <p className="mt-2 text-base text-ink-muted">
          Nối tài khoản Zalo của bạn với hồ sơ đã có tại phòng khám để đặt lịch,
          xem số thứ tự và hoá đơn. Một tài khoản liên kết được nhiều hồ sơ
          người thân.
        </p>
      </div>

      {loi && (
        <div className="flex gap-3 rounded-md bg-error-soft p-4">
          <AlertCircleIcon
            width={20}
            height={20}
            className="mt-0.5 shrink-0 text-error"
          />
          <p className="text-sm text-error">{loi}</p>
        </div>
      )}

      {buoc === "BAT_DAU" && (
        <>
          <Button onClick={batDau} loading={dangGui}>
            Liên kết bằng số điện thoại Zalo
          </Button>
          <p className="text-center text-sm text-ink-muted">
            Zalo chỉ gửi cho phòng khám một mã dùng một lần, không gửi thẳng số
            điện thoại của bạn.
          </p>
        </>
      )}

      {buoc === "BIRTHDATE" && (
        <>
          <p className="text-base text-ink">
            Nhập ngày sinh của người bệnh để phòng khám xác minh đúng hồ sơ.
          </p>
          <Field label="Ngày sinh của người bệnh" htmlFor="ngay-sinh">
            <input
              id="ngay-sinh"
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="h-12 w-full rounded border border-line bg-surface px-3 text-base text-ink outline-none focus:border-2 focus:border-primary"
            />
          </Field>
          <Button
            onClick={() => gui(phoneToken)}
            loading={dangGui}
            disabled={!birthdate}
          >
            Xác nhận
          </Button>
        </>
      )}

      {buoc === "INSURANCE_LAST4" && (
        <>
          <p className="text-base text-ink">
            Có nhiều hồ sơ trùng thông tin. Nhập 4 số cuối thẻ BHYT của đúng hồ
            sơ bạn muốn liên kết.
          </p>
          <Field label="4 số cuối thẻ BHYT" htmlFor="bhyt-last4">
            <input
              id="bhyt-last4"
              inputMode="numeric"
              maxLength={4}
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="h-12 w-full rounded border border-line bg-surface px-3 text-center text-xl font-bold tracking-[0.5em] text-ink outline-none placeholder:tracking-[0.5em] placeholder:text-ink-muted focus:border-2 focus:border-primary"
            />
          </Field>
          <Button
            onClick={() => gui(phoneToken)}
            loading={dangGui}
            disabled={last4.length !== 4}
          >
            Xác nhận
          </Button>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-ink"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
