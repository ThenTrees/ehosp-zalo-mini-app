import { Button } from "@/components/button";
import { DashedDivider } from "@/components/dashed-divider";
import PolarizedList from "@/components/polarized-list";
import { invoicesState, userState } from "@/state";
import { useAtomValue } from "jotai";

function InvoicesPage() {
  const { userInfo } = useAtomValue(userState);
  const invoices = useAtomValue(invoicesState);

  return (
    <div className="py-5 px-4 space-y-4">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="w-full space-y-6 rounded-2xl bg-white px-4 py-6"
        >
          <div className="text-xl font-medium">
            {invoice.booking.department.name}
          </div>
          <DashedDivider />
          <PolarizedList
            items={[
              ["Tên", userInfo.name],
              ["Khu vực bệnh viện", "Bệnh viện Quốc tế Gia Hội Thượng Hải"],
              ["Khoa", "Nội khoa A"],
              ["Thời gian khám bệnh", "2022.02.16 Thứ Tư 09:00-09:30"],
              ["Loại khám bệnh", "Khám bệnh\nKhám lần đầu"],
            ]}
          />
          <Button>Thanh toán</Button>
        </div>
      ))}
    </div>
  );
}

export default InvoicesPage;
