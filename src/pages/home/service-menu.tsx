import hospital from "@/static/services/hospital.svg";
import lung from "@/static/services/lung.svg";
import drug from "@/static/services/drug.svg";
import invoice from "@/static/services/invoice.svg";
import all from "@/static/services/all.svg";
import ServiceItem from "@/components/items/service";

export default function ServiceMenu() {
  return (
    <div className="grid grid-cols-5 items-center justify-center text-center text-xs">
      <ServiceItem to="/ask" icon={hospital} label="Tư vấn" />
      <ServiceItem to="/categories" icon={lung} label="Danh mục" />
      <ServiceItem icon={drug} label="Toa thuốc" />
      <ServiceItem to="/invoices" icon={invoice} label="Hóa đơn" />
      <ServiceItem to="/services" icon={all} label="Tất cả" />
    </div>
  );
}
