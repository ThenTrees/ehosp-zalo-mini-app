import { useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { Button } from "@/components/button";
import { Card, SectionHeader } from "@/components/ui";
import LinkRequired from "@/components/link-required";
import { activePatientIdState, visitDetailState } from "@/state";
import {
  docLich,
  luuLich,
  nhacKeTiep,
  xoaLich,
  type LichNhacThuoc,
} from "@/services/nhac-thuoc";
import {
  GIO_GOI_Y,
  TEN_BUA_AN,
  TEN_BUOI,
  gomNhomNhac,
  soNgayDeNghi,
} from "@/utils/lich-uong-thuoc";
import { formatIsoDateLong, todayIso } from "@/utils/format";
import type { ThuocDaKe } from "@/types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NHẮC UỐNG THUỐC — máy gom, NGƯỜI chọn giờ và bấm bật
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Chia việc rất rõ, và ranh giới ấy là phần quan trọng nhất của màn hình:
 *
 *   MÁY  gom thuốc vào các nhóm (buổi × trước/sau ăn) theo BỐN CỘT SỐ của đơn,
 *        và đề nghị số ngày theo thuốc dài ngày nhất.
 *   NGƯỜI đọc từng nhóm, chọn GIỜ, sửa số ngày, rồi mới bấm bật.
 *
 * Máy KHÔNG bao giờ tự bật. Nhắc sai liều không phải một tiện ích hỏng, nó là
 * một việc nguy hiểm — nên người bệnh phải nhìn tận mắt danh sách thuốc trong
 * mỗi lời nhắc trước khi đồng ý nhận nó.
 */
export default function NhacThuocPage() {
  const { visitId: raw } = useParams();
  const visitId = Number(raw);
  const patientId = useAtomValue(activePatientIdState);
  const chiTiet = useAtomValue(visitDetailState({ id: visitId, patientId }));

  const [gio, datGio] = useState<Record<string, string>>({});
  const [soNgay, datSoNgay] = useState<number | "">("");
  const [daLuu, datDaLuu] = useState<LichNhacThuoc | null>(null);
  const [dangLuu, datDangLuu] = useState(false);

  /*
   * `reduce` chứ không `flatMap`: `lib` của dự án dừng ở es2017 vì browserslist
   * còn nhắm iOS 9.3 — xem CLAUDE.md. Đừng nâng `lib` để dùng một hàm tiện.
   */
  const thuoc = useMemo(
    () =>
      (chiTiet?.donThuoc ?? []).reduce<ThuocDaKe[]>(
        (acc, d) => acc.concat(d.thuoc),
        [],
      ),
    [chiTiet],
  );
  const nhom = useMemo(() => gomNhomNhac(thuoc), [thuoc]);
  const deNghi = useMemo(() => soNgayDeNghi(thuoc), [thuoc]);

  useEffect(() => {
    if (patientId === null || !Number.isFinite(visitId)) return;
    void docLich(patientId, visitId).then((l) => {
      datDaLuu(l);
      // Có lịch cũ thì nạp lại giờ đã chọn — đừng bắt họ chọn lại từ đầu.
      if (l) {
        const g: Record<string, string> = {};
        for (const n of l.nhac) g[`${n.buoi}|${n.bua}`] = n.gio;
        datGio(g);
        datSoNgay(l.soNgay);
      } else if (deNghi) {
        datSoNgay(deNghi);
      }
    });
  }, [patientId, visitId, deNghi]);

  if (patientId === null) {
    return <LinkRequired message="Liên kết hồ sơ để đặt nhắc uống thuốc." />;
  }

  if (nhom.length === 0) {
    return (
      <div className="p-4">
        <Card>
          <SectionHeader title="Chưa đặt nhắc được cho đơn này" />
          <p className="text-sm text-ink-muted">
            Đơn này không có thuốc đường uống có ghi liều theo buổi, nên ứng
            dụng không dựng được lịch nhắc. Thuốc bôi, thuốc nhỏ, thuốc tiêm và
            thuốc dùng khi cần đều không nhắc tự động — hỏi bác sĩ hoặc dược sĩ
            để dùng cho đúng.
          </p>
        </Card>
      </div>
    );
  }

  const gioCua = (k: string, mac: string) => gio[k] ?? mac;
  const thieuGio = nhom.some(
    (n) => !/^\d{2}:\d{2}$/.test(gioCua(`${n.buoi}|${n.bua}`, GIO_GOI_Y[n.buoi])),
  );
  const soNgayHopLe = typeof soNgay === "number" && soNgay >= 1 && soNgay <= 90;

  const bat = async () => {
    if (!soNgayHopLe || thieuGio) return;
    datDangLuu(true);
    try {
      const l: LichNhacThuoc = {
        visitId,
        patientId,
        tuNgay: todayIso(),
        soNgay,
        nhac: nhom.map((n) => ({
          buoi: n.buoi,
          bua: n.bua,
          gio: gioCua(`${n.buoi}|${n.bua}`, GIO_GOI_Y[n.buoi]),
          thuoc: n.thuoc.map((t) => `${t.ten} · ${t.lieu} ${t.donVi ?? ""}`.trim()),
        })),
        taoLuc: new Date().toISOString(),
      };
      await luuLich(l);
      datDaLuu(l);
      toast.success("Đã bật nhắc uống thuốc.");
    } catch (e) {
      /*
       * NÓI RA KHI GHI HỎNG. Kho lưu của zmp-sdk có thể từ chối (chưa được cấp
       * quyền, hết dung lượng), và bản đầu nuốt lỗi trong `finally` — nút nhả
       * ra, không có thông báo nào, và người bệnh tưởng đã bật nhắc trong khi
       * KHÔNG có gì được lưu. Im lặng ở đây tệ hơn hẳn một câu lỗi.
       */
      toast.error(
        e instanceof Error ? e.message : "Không lưu được lịch nhắc trên máy.",
      );
    } finally {
      datDangLuu(false);
    }
  };

  const tat = async () => {
    try {
      await xoaLich(patientId, visitId);
      datDaLuu(null);
      toast.success("Đã tắt nhắc.");
    } catch (e) {
      // Cùng lý do với `bat`: tắt hỏng mà im lặng thì người bệnh tưởng đã tắt.
      toast.error(
        e instanceof Error ? e.message : "Không xoá được lịch nhắc trên máy.",
      );
    }
  };

  const keTiep = daLuu ? nhacKeTiep(daLuu) : null;
  /*
   * Số ngày CÒN LẠI, tính từ ngày bắt đầu — không phải tổng số ngày đã đặt.
   * `Math.ceil` để ngày đang dùng dở vẫn tính là một ngày còn lại.
   */
  const conLaiNgay = daLuu
    ? Math.max(0, daLuu.soNgay - Math.floor(
      (Date.now() - new Date(`${daLuu.tuNgay}T00:00:00`).getTime()) / 86_400_000))
    : 0;

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-xl font-bold text-ink">Nhắc uống thuốc</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Ứng dụng gom thuốc theo buổi từ đơn của bạn. Hãy đọc lại từng nhóm và
          chọn giờ cho đúng bữa ăn của mình.
        </p>
      </div>

      {nhom.map((n) => {
        const k = `${n.buoi}|${n.bua}`;
        return (
          <Card key={k}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-ink">
                  {TEN_BUOI[n.buoi]}
                  <span className="ml-2 text-sm font-normal text-ink-muted">
                    {TEN_BUA_AN[n.bua]}
                  </span>
                </div>
              </div>
              <input
                type="time"
                aria-label={`Giờ uống ${TEN_BUOI[n.buoi]} ${TEN_BUA_AN[n.bua]}`}
                value={gioCua(k, GIO_GOI_Y[n.buoi])}
                onChange={(e) => datGio({ ...gio, [k]: e.target.value })}
                className="shrink-0 rounded-md border border-line bg-white px-3 py-2 text-base tabular-nums text-ink"
              />
            </div>

            <ul className="mt-3 flex flex-col gap-1">
              {n.thuoc.map((t) => (
                <li
                  key={t.ten}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 flex-1 text-ink">{t.ten}</span>
                  <span className="shrink-0 tabular-nums text-ink-muted">
                    {t.lieu} {t.donVi ?? ""}
                  </span>
                </li>
              ))}
            </ul>

            {n.bua === "KHONG_RO" && (
              <p className="mt-2 rounded-md bg-warning-soft px-3 py-2 text-xs text-ink">
                Đơn không ghi rõ uống trước hay sau ăn. Hỏi lại bác sĩ hoặc dược
                sĩ trước khi đặt giờ.
              </p>
            )}
          </Card>
        );
      })}

      <Card>
        <label htmlFor="so-ngay" className="block text-sm font-medium text-ink">
          Nhắc trong bao nhiêu ngày
        </label>
        <input
          id="so-ngay"
          type="number"
          min={1}
          max={90}
          inputMode="numeric"
          value={soNgay}
          onChange={(e) =>
            datSoNgay(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="mt-2 w-28 rounded-md border border-line bg-white px-3 py-2 text-base tabular-nums text-ink"
        />
        <p className="mt-1 text-xs text-ink-muted">
          {deNghi
            ? `Đơn ghi dùng ${deNghi} ngày.`
            : "Đơn không ghi số ngày — hãy nhập theo lời dặn của bác sĩ."}
        </p>
      </Card>

      {daLuu ? (
        <>
          {/*
            "CÒN N NGÀY" PHẢI LÀ SỐ NGÀY CÒN LẠI, không phải tổng số ngày đã
            đặt. Bản đầu in `daLuu.soNgay` — một lịch 7 ngày bật từ tuần trước
            vẫn nói "còn 7 ngày" mãi mãi, và người bệnh uống thêm một tuần nữa.

            Ngày cũng in kiểu người đọc: "05/09/2026" chứ không "2026-09-05".
          */}
          <div className="rounded-md bg-primary-soft px-4 py-3 text-sm text-primary-ink">
            {conLaiNgay > 0
              ? `Đang bật · còn ${conLaiNgay} ngày`
              : "Lịch đã hết hạn"}
            {" · bắt đầu "}
            {formatIsoDateLong(daLuu.tuNgay)}
            {keTiep ? ` · lần nhắc tới ${keTiep.gio}` : ""}
          </div>
          <Button variant="secondary" onClick={() => void tat()}>
            Tắt nhắc
          </Button>
        </>
      ) : (
        <Button
          loading={dangLuu}
          disabled={!soNgayHopLe || thieuGio}
          onClick={() => void bat()}
        >
          Bật nhắc uống thuốc
        </Button>
      )}

      {/*
        NÓI THẲNG GIỚI HẠN. Nền tảng Zalo Mini App không cho hẹn giờ báo cục bộ,
        và đẩy từ máy chủ phải qua ZNS — đòi mẫu tin được duyệt và một phiếu
        đồng ý riêng. Hứa "sẽ báo đúng giờ" rồi không báo thì người bệnh bỏ
        thuốc mà vẫn tưởng mình chưa tới giờ; đó là hại, không phải hụt hẫng.
      */}
      <p className="text-xs text-ink-muted">
        Bản này lưu lịch trên máy bạn và hiện lại mỗi lần mở ứng dụng. Ứng dụng{" "}
        <b>chưa</b> tự báo ra ngoài đúng giờ — đừng dựa vào nó thay cho đồng hồ
        báo thức.
      </p>
    </div>
  );
}
