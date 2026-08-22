import DoctorItem from "@/components/items/doctor";
import PolarizedList from "@/components/polarized-list";
import { bookingFormState, scheduleByIdState } from "@/state";
import { useAtomValue, useSetAtom } from "jotai";
import { useNavigate, useParams } from "react-router-dom";
import NotFound from "../404";
import { TestResult } from "./test-result";
import FabForm from "@/components/form/fab-form";
import { formatDayName, formatFullDate, formatTimeSlot } from "@/utils/format";

function ScheduleDetailPage() {
  const { id } = useParams();
  const schedule = useAtomValue(scheduleByIdState(Number(id)));
  const navigate = useNavigate();
  const setBookingData = useSetAtom(bookingFormState);

  if (!schedule) {
    return <NotFound />;
  }

  return (
    <FabForm
      fab={{
        children: "Tái khám",
        onClick() {
          setBookingData((prev) => ({
            ...prev,
            ...schedule,
          }));
          navigate("/booking", {
            viewTransition: true,
          });
        },
      }}
    >
      <div className="flex w-full flex-col px-4 py-3 space-y-3">
        <div className="flex flex-col justify-center gap-3 rounded-xl bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-base font-medium">Nội khoa tổng quát</div>
            <div className="text-xs text-disabled">Hoàn thành</div>
          </div>
          <hr className="border-t border-black/10" />
          <DoctorItem doctor={schedule.doctor} />
          <PolarizedList
            items={[
              ["Họ tên", schedule.patientName],
              ["Khu vực", schedule.department.name],
              ["Khoa", schedule.department.name],
              [
                "Thời gian khám bệnh",
                `${formatFullDate(schedule.schedule.date)} ${formatDayName(schedule.schedule.date)} ${formatTimeSlot(schedule.schedule.time)}`,
              ],
              ["Loại khám bệnh", "Ngoại trú Khám lần đầu"],
              ["Phương thức thanh toán", "Tự chi trả"],
            ]}
          />
        </div>
        <div className="flex flex-col justify-center gap-4 rounded-xl bg-white p-4 text-base">
          <div className="font-medium">Chi tiết phiếu khám</div>
          <TestResult
            testType="Xét ngiệm"
            testName="X-Quang"
            description="Nhân viên tiếp đón của bệnh viện rất nhiệt tình, dịch vụ rất chu đáo, đây là bệnh viện có dịch vụ tốt nhất mà tôi đã từng đến."
          />
          <TestResult
            testType="Xét Nghiệm"
            testName="Máu, nước tiểu"
            description="Dịch vụ của bệnh viện rất tận tâm, bác sĩ cũng rất tốt bụng và hiền hòa, tay nghề của bác sĩ rất cao."
          />
          <TestResult
            testType="Đánh giá"
            testName="Tổng quan"
            description="Điều kiện vệ sinh của bệnh viện rất tốt, trong nhà vệ sinh có thể tắm. Cần cải thiện nhà ăn, ba bữa không giống nhau, cố gắng để mọi người ăn ngon và no."
          />
        </div>
      </div>
    </FabForm>
  );
}

export default ScheduleDetailPage;
