import ArrowRightIcon from "@/components/icons/arrow-right";
import { doctorsState } from "@/state";
import { useAtomValue } from "jotai";
import prescription from "@/static/services/prescription.svg";
import calendar from "@/static/services/calendar.svg";
import clipboard from "@/static/services/clipboard.svg";
import heart from "@/static/services/heart.svg";
import Section from "@/components/section";
import { Action } from "./action";
import { VisitedDoctor } from "./visited-doctor";

function ProfilePage() {
  const [d1, d2] = useAtomValue(doctorsState);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="grid grid-cols-3 pt-4 pb-5">
        {[
          ["Điểm thưởng", 14],
          ["Phiếu giảm giá", 2],
          ["Buổi khám", 3],
        ].map(([key, value]) => (
          <div key={key} className="flex flex-col space-y-1.5 text-center">
            <div className="text-xl font-bold text-primary-gradient">
              {value}
            </div>
            <div className="text-disabled text-2xs">{key}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col bg-white py-8 space-y-9 overflow-y-auto">
        <Section title="Dịch vụ y tế" viewMore="/services">
          <div className="grid grid-cols-4 pt-6 gap-2 text-center text-xs">
            {[
              { icon: prescription, label: "Toa thuốc" },
              { icon: calendar, label: "Lịch hẹn" },
              { icon: clipboard, label: "Lịch sử" },
              { icon: heart, label: "Gia đình" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <img src={icon} className="h-8 w-8" />
                <div className="text-center">{label}</div>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Bác sĩ đã khám">
          <div className="grid grid-cols-2 pt-6 space-x-4">
            <VisitedDoctor doctor={d1} />
            <VisitedDoctor doctor={d2} />
          </div>
        </Section>
        <Section title="Khác">
          <div className="pt-2">
            <Action
              label="Hóa đơn của tôi"
              badge={3}
              icon={<ArrowRightIcon className="h-3.5 w-3.5" />}
              to="/invoices"
            />
            <Action
              label="Gửi phản ảnh dịch vụ"
              icon={<ArrowRightIcon className="h-3.5 w-3.5" />}
              to="/feedback"
            />
            <Action
              label="Thông tin bệnh viện"
              icon={<ArrowRightIcon className="h-3.5 w-3.5" />}
              to="/hospital-info"
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

export default ProfilePage;
