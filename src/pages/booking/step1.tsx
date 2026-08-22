import DateTimePicker from "@/components/form/date-time-picker";
import DoctorSelector from "@/components/form/doctor-selector";
import DepartmentPicker from "@/components/form/department-picker";
import FabForm from "@/components/form/fab-form";
import { availableTimeSlotsState, bookingFormState } from "@/state";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TimeSlot } from "@/types";
import toast from "react-hot-toast";

export default function Step1() {
  const timeSlots = useAtomValue(availableTimeSlotsState);
  const [formData, setFormData] = useAtom(bookingFormState);
  const [selectedSlot, setSelectedSlot] = useState<Partial<TimeSlot>>(
    formData.slot ?? {}
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedSlot) {
      const { date, time } = selectedSlot;
      if (date && time) {
        setFormData((prev) => ({
          ...prev,
          slot: { date, time },
        }));
      }
    }
  }, [selectedSlot]);

  return (
    <FabForm
      fab={{
        children: "Tiếp tục",
        disabled: !formData.slot || !formData.department || !formData.doctor,
        onClick: () => {
          navigate("/booking/2", {
            viewTransition: true,
          });
        },
        onDisabledClick() {
          toast.error("Vui lòng điền đầy đủ thông tin!");
        },
      }}
    >
      <div className="bg-white flex flex-col space-y-1">
        <div className="p-4">
          <DepartmentPicker
            label="Khoa khám"
            placeholder="Chọn khoa khám"
            value={formData?.department}
            onChange={(department) =>
              setFormData((prev) => ({
                ...prev,
                department,
              }))
            }
          />
        </div>
        <DateTimePicker
          value={selectedSlot}
          onChange={setSelectedSlot}
          slots={timeSlots}
        />
      </div>
      <DoctorSelector
        value={formData?.doctor}
        onChange={(doctor) =>
          setFormData((prev) => ({
            ...prev,
            doctor,
          }))
        }
      />
    </FabForm>
  );
}
