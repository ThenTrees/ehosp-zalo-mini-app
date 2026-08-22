import ServiceItem from "@/components/items/service";
import MarkedTitleSection from "@/components/marked-title-section";
import hospital from "@/static/services/hospital.svg";
import lung from "@/static/services/lung.svg";
import drug from "@/static/services/drug.svg";
import invoice from "@/static/services/invoice.svg";
import heartAndPill from "@/static/services/heart-and-pill.svg";
import pill from "@/static/services/pill.svg";
import diag from "@/static/services/diag.svg";
import accessibility from "@/static/services/accessibility.svg";
import dna from "@/static/services/dna.svg";
import stethoscope from "@/static/services/stethoscope.svg";
import heart from "@/static/services/heart.svg";
import calendar from "@/static/services/calendar.svg";
import clipboard from "@/static/services/clipboard.svg";
import weight from "@/static/services/weight.svg";
import skin from "@/static/services/skin.svg";
import eye from "@/static/services/eye.svg";
import chatOa from "@/static/services/chat-oa.svg";
import { openChat } from "zmp-sdk";
import { getConfig } from "@/utils/miscellaneous";

function ServicesPage() {
  return (
    <div className="py-4 px-3 space-y-4">
      <MarkedTitleSection title="Dịch vụ phổ biến">
        <div className="grid grid-cols-4 px-5 gap-6">
          <ServiceItem
            icon={hospital}
            label="Tư vấn"
            to="/services/consultation"
          />
          <ServiceItem icon={lung} label="Danh mục" to="/services/categories" />
          <ServiceItem
            icon={drug}
            label="Toa thuốc"
            to="/services/prescriptions"
          />
          <ServiceItem icon={invoice} label="Hóa đơn" to="/services/invoices" />
        </div>
      </MarkedTitleSection>
      <MarkedTitleSection title="Tất cả dịch vụ">
        <div className="grid grid-cols-4 px-5 gap-x-3 gap-y-8">
          <ServiceItem
            icon={chatOa}
            label="Chat OA"
            onClick={() =>
              openChat({
                type: "oa",
                id: getConfig((c) => c.template.oaID),
              })
            }
          />
          <ServiceItem
            icon={heartAndPill}
            label="Tim mạch"
            to="/services/cardiology"
          />
          <ServiceItem icon={pill} label="Thuốc" to="/services/medicine" />
          <ServiceItem icon={diag} label="Chẩn đoán" to="/services/diagnosis" />
          <ServiceItem
            icon={accessibility}
            label="Khám tổng quát"
            to="/services/general-checkup"
          />
          <ServiceItem icon={dna} label="Xét nghiệm" to="/services/lab-tests" />
          <ServiceItem
            icon={stethoscope}
            label="Khám bệnh"
            to="/services/medical-examination"
          />
          <ServiceItem icon={heart} label="Sức khỏe" to="/services/health" />
          <ServiceItem
            icon={calendar}
            label="Lịch hẹn"
            to="/services/appointments"
          />
          <ServiceItem icon={clipboard} label="Hồ sơ" to="/services/records" />
          <ServiceItem icon={weight} label="Cân nặng" to="/services/weight" />
          <ServiceItem icon={skin} label="Da liễu" to="/services/dermatology" />
          <ServiceItem icon={eye} label="Mắt" to="/services/eye" />
        </div>
      </MarkedTitleSection>
    </div>
  );
}

export default ServicesPage;
