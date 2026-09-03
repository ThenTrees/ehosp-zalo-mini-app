import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import toast from "react-hot-toast";
import { api } from "@/services";
import { getUserAccessToken, getPhoneToken } from "@/services/phone";
import { applyLinkState, profilesState } from "@/state";
import { hoSoVuaLienKet } from "@/utils/link-target";
import { Button } from "@/components/button";
import { AlertCircleIcon, ShieldIcon } from "@/components/icons";

type Step = "BAT_DAU" | "BIRTHDATE" | "INSURANCE_LAST4";

export default function LinkPage() {
  const navigate = useNavigate();
  const applyLink = useSetAtom(applyLinkState);
  /*
   * Danh sách hồ sơ TRƯỚC lần liên kết này — thứ duy nhất cho biết hồ sơ nào
   * trong `result.profiles` là hồ sơ vừa thêm (xem `hoSoVuaLienKet`). Với người
   * chưa liên kết bao giờ, `profilesState` đã nuốt 401 và trả về mảng rỗng, nên
   * đọc ở đây không tốn thêm lời gọi nào ngoài cái Header vẫn gọi sẵn.
   */
  const hoSoDaCo = useAtomValue(profilesState);
  const [step, setStep] = useState<Step>("BAT_DAU");
  const [birthdate, setBirthdate] = useState("");
  const [last4, setLast4] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /**
   * Gửi một lần liên kết.
   *
   * Mỗi lần gửi lấy MÃ MỚI, không dùng lại mã của bước trước: mã của
   * `getPhoneNumber()` dùng được đúng một lần, và Zalo trả lỗi 119 "code has
   * already been used" khi bước nhập ngày sinh gửi lại mã cũ — đo trên máy
   * thật ngày 2026-09-01. Giữ mã trong state là cái bẫy tự nhiên ở đây, vì
   * luồng có nhiều bước mà mã thì không sống qua được bước nào.
   */
  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      let token: string;
      let access: string;
      try {
        [token, access] = await Promise.all([
          getPhoneToken(),
          getUserAccessToken(),
        ]);
      } catch {
        // Tách riêng khỏi lỗi của máy chủ: người bệnh từ chối quyền là một
        // tình huống khác hẳn "thông tin không khớp", và cần một câu chỉ đúng
        // việc phải làm.
        setError("Cần cho phép truy cập số điện thoại để liên kết hồ sơ.");
        return;
      }
      const result = await api.link({
        zaloPhoneToken: token,
        zaloAccessToken: access,
        birthdate: birthdate || undefined,
        insuranceLast4: last4 || undefined,
      });

      if (result.outcome === "CHALLENGE") {
        setStep(result.need);
        return;
      }

      // KHÔNG dùng `result.profiles[0]`: máy chủ sắp danh sách tăng dần theo
      // `linked_at`, nên phần tử đầu là hồ sơ CŨ NHẤT chứ không phải hồ sơ vừa
      // liên kết. Nó cũng ném `TypeError` khi mảng rỗng.
      const vuaLienKet = hoSoVuaLienKet(hoSoDaCo, result.profiles);
      await applyLink({
        token: result.token,
        patientId: vuaLienKet?.patientId ?? null,
      });
      toast.success(
        vuaLienKet
          ? `Đã liên kết hồ sơ ${vuaLienKet.fullName}.`
          : "Liên kết tài khoản thành công.",
      );
      navigate("/", { viewTransition: true });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Thông tin không khớp. Vui lòng kiểm tra lại.",
      );
    } finally {
      setSubmitting(false);
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

      {error && (
        <div className="flex gap-3 rounded-md bg-error-soft p-4">
          <AlertCircleIcon
            width={20}
            height={20}
            className="mt-0.5 shrink-0 text-error"
          />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {step === "BAT_DAU" && (
        <>
          <Button onClick={() => submit()} loading={submitting}>
            Liên kết bằng số điện thoại Zalo
          </Button>
          <p className="text-center text-sm text-ink-muted">
            Zalo chỉ gửi cho phòng khám một mã dùng một lần, không gửi thẳng số
            điện thoại của bạn.
          </p>
        </>
      )}

      {step === "BIRTHDATE" && (
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
            onClick={() => submit()}
            loading={submitting}
            disabled={!birthdate}
          >
            Xác nhận
          </Button>
        </>
      )}

      {step === "INSURANCE_LAST4" && (
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
            onClick={() => submit()}
            loading={submitting}
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
