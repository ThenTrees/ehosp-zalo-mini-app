import { DashedDivider } from "@/components/dashed-divider";
import FabForm from "@/components/form/fab-form";
import SuccessIcon from "@/components/icons/success";
import PolarizedList from "@/components/polarized-list";
import { bookingFormState, userState } from "@/state";
import { formatShortDate, formatTimeSlot } from "@/utils/format";
import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";

export default function Step3() {
  const navigate = useNavigate();
  const { userInfo } = useAtomValue(userState);
  const formData = useAtomValue(bookingFormState);

  return (
    <FabForm
      fab={{
        children: "Xem lịch hẹn của tôi",
        onClick: () => {
          navigate("/schedule", {
            viewTransition: true,
          });
        },
      }}
    >
      <div className="p-4 h-full flex items-center">
        <div className="flex w-full flex-col items-center gap-4 rounded-2xl bg-white px-4 py-8">
          <SuccessIcon />
          <div className="self-stretch text-center text-lg font-medium">
            Đặt lịch thành công
          </div>
          <DashedDivider />
          <PolarizedList
            items={[
              ["Tên", userInfo.name],
              formData.department && ["Khoa", formData.department.name],
              formData.doctor && ["Bác sĩ", formData.doctor.name],
              formData.slot && [
                "Thời gian khám bệnh",
                `${formatShortDate(formData.slot.date)} ${formatTimeSlot(formData.slot.time)}`,
              ],
              formData.symptoms.length > 0 && [
                "Triệu chứng",
                formData.symptoms.join(", "),
              ],
              formData.description.trim().length > 0 && [
                "Mô tả",
                formData.description,
              ],
            ]}
          />
        </div>
      </div>
    </FabForm>
  );
}
