import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import toast from "react-hot-toast";

import { Button } from "@/components/button";
import { PageHeading } from "@/components/ui";
import { api } from "@/services";
import { ApiError } from "@/services/http";
import { applyLinkState } from "@/state";

/**
 * ĐĂNG NHẬP VÀ GHI DANH — bằng SỐ ĐỊNH DANH CÁ NHÂN, không còn qua Zalo.
 *
 * VÌ SAO ĐỔI. Bản cũ khoá tài khoản theo SỐ ĐIỆN THOẠI Zalo đã xác thực. Nó có
 * một yếu tố sở hữu thật, nhưng số điện thoại thì ĐỔI CHỦ — nhà mạng thu hồi
 * rồi cấp lại nhanh hơn hạn 180 ngày của một phiên, nên người nhận số cũ đọc
 * được hồ sơ người đã bỏ số. Càng nặng khi app bày bệnh sử đầy đủ. Số định danh
 * cá nhân thì không cấp lại cho người khác.
 *
 * HAI CỬA, MỘT MÀN HÌNH. Người bệnh không tự biết mình "đã ghi danh chưa", nên
 * bắt họ chọn giữa hai nút là bắt họ trả lời một câu hỏi về hệ thống. Màn này
 * mặc định là ĐĂNG NHẬP (việc làm hằng ngày) và để ghi danh ở một liên kết phụ
 * cho lần đầu.
 *
 * ⚠ SỐ ĐỊNH DANH KHÔNG PHẢI MẬT KHẨU, và màn hình không được ngụ ý như vậy.
 * Nó chỉ dùng MỘT LẦN lúc ghi danh, cùng 4 số cuối thẻ BHYT; từ đó về sau thứ
 * giữ tài khoản là mật khẩu người bệnh tự đặt. Lý lẽ đầy đủ ở đầu
 * `eHosp/services/emr-api/src/modules/patient-app/taiKhoan.ts`.
 */

type Che = "DANG_NHAP" | "GHI_DANH";

const chiSo = (v: string, toiDa: number) =>
  v.replace(/\D/g, "").slice(0, toiDa);

export default function LinkPage() {
  const [che, setChe] = useState<Che>("DANG_NHAP");
  const [dinhDanh, setDinhDanh] = useState("");
  const [bon, setBon] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");

  const navigate = useNavigate();
  const apDung = useSetAtom(applyLinkState);

  const duDieuKien =
    dinhDanh.length === 12 &&
    matKhau.length >= 10 &&
    (che === "DANG_NHAP" || bon.length === 4);

  async function gui() {
    setLoi("");
    setDangGui(true);
    try {
      if (che === "GHI_DANH") {
        const kq = await api.ghiDanh({
          soDinhDanh: dinhDanh,
          insuranceLast4: bon,
          matKhau,
        });
        await apDung({ token: kq.token, patientId: kq.patientId });
        toast.success(`Đã ghi danh hồ sơ ${kq.fullName}.`);
      } else {
        const kq = await api.dangNhap({ soDinhDanh: dinhDanh, matKhau });
        /*
         * Đăng nhập KHÔNG trả `patientId`: một tài khoản nắm nhiều hồ sơ người
         * nhà, nên máy chủ không đoán hộ ai là hồ sơ đang xem. Truyền `null` để
         * `applyLinkState` giữ hồ sơ đã chọn lần trước, hoặc để `/me` quyết.
         */
        await apDung({ token: kq.token, patientId: null });
        toast.success("Đã đăng nhập.");
      }
      navigate("/", { viewTransition: true });
    } catch (e) {
      /*
       * Hiện NGUYÊN VĂN câu của máy chủ. Nó đã được viết cho người bệnh đọc —
       * kể cả câu 409 "số định danh này đã có tài khoản… vui lòng tới quầy tiếp
       * đón", vốn là lối thoát DUY NHẤT khi tài khoản bị người khác ghi danh
       * trước. Thay bằng một câu chung chung là cắt mất lối thoát ấy.
       */
      setLoi(
        e instanceof ApiError
          ? e.message
          : "Không kết nối được máy chủ. Vui lòng thử lại.",
      );
    } finally {
      setDangGui(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeading
        title={che === "GHI_DANH" ? "Ghi danh lần đầu" : "Đăng nhập"}
        subtitle={
          che === "GHI_DANH"
            ? "Nhập số định danh cá nhân và 4 số cuối thẻ BHYT để phòng khám nhận ra hồ sơ của bạn, rồi tự đặt mật khẩu."
            : "Đăng nhập bằng số định danh cá nhân và mật khẩu bạn đã đặt."
        }
      />

      <O label="Số định danh cá nhân" id="dinh-danh">
        <input
          id="dinh-danh"
          inputMode="numeric"
          autoComplete="username"
          maxLength={12}
          value={dinhDanh}
          onChange={(e) => setDinhDanh(chiSo(e.target.value, 12))}
          placeholder="12 chữ số"
          className="h-12 w-full rounded border border-line bg-surface px-3 text-lg tracking-widest text-ink outline-none placeholder:text-base placeholder:tracking-normal placeholder:text-ink-muted focus:border-2 focus:border-primary"
        />
      </O>

      {che === "GHI_DANH" && (
        <O label="4 số cuối thẻ BHYT" id="bhyt">
          <input
            id="bhyt"
            inputMode="numeric"
            maxLength={4}
            value={bon}
            onChange={(e) => setBon(chiSo(e.target.value, 4))}
            placeholder="••••"
            className="h-12 w-full rounded border border-line bg-surface px-3 text-center text-xl font-bold tracking-[0.5em] text-ink outline-none placeholder:tracking-[0.5em] placeholder:text-ink-muted focus:border-2 focus:border-primary"
          />
        </O>
      )}

      <O
        label={che === "GHI_DANH" ? "Đặt mật khẩu" : "Mật khẩu"}
        id="mat-khau"
        goiY={che === "GHI_DANH" ? "Ít nhất 10 ký tự" : undefined}
      >
        <input
          id="mat-khau"
          type="password"
          autoComplete={
            che === "GHI_DANH" ? "new-password" : "current-password"
          }
          value={matKhau}
          onChange={(e) => setMatKhau(e.target.value)}
          className="h-12 w-full rounded border border-line bg-surface px-3 text-base text-ink outline-none focus:border-2 focus:border-primary"
        />
      </O>

      {loi ? (
        <div
          role="alert"
          className="rounded-md bg-error-soft px-3 py-2 text-sm text-ink"
        >
          {loi}
        </div>
      ) : null}

      <Button onClick={gui} loading={dangGui} disabled={!duDieuKien}>
        {che === "GHI_DANH" ? "Ghi danh" : "Đăng nhập"}
      </Button>

      <button
        type="button"
        onClick={() => {
          setChe(che === "GHI_DANH" ? "DANG_NHAP" : "GHI_DANH");
          setLoi("");
        }}
        className="text-sm text-primary-ink underline"
      >
        {che === "GHI_DANH"
          ? "Tôi đã có mật khẩu — đăng nhập"
          : "Lần đầu dùng ứng dụng — ghi danh"}
      </button>
    </div>
  );
}

function O({
  label,
  id,
  goiY,
  children,
}: {
  label: string;
  id: string;
  goiY?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {goiY ? <p className="mt-1 text-xs text-ink-muted">{goiY}</p> : null}
    </div>
  );
}
