import { bookingFormState } from "@/state";
import { Doctor } from "@/types";
import { useSetAtom } from "jotai";
import { useNavigate } from "react-router-dom";

interface VisitedDoctorProps {
  doctor: Doctor;
}

export function VisitedDoctor({ doctor }: VisitedDoctorProps) {
  const setFormData = useSetAtom(bookingFormState);
  const navigate = useNavigate();

  return (
    <button
      className="flex items-center gap-2 rounded-lg bg-[#F6F8FC] px-3 py-2 text-left"
      onClick={() => {
        setFormData((prev) => ({
          ...prev,
          doctor,
        }));
        navigate("/booking", {
          viewTransition: true,
        });
      }}
    >
      <img src={doctor.image} className="w-10 h-10 rounded-full object-cover" />
      <div className="flex flex-grow flex-col gap-2">
        <div className="text-sm font-medium">{doctor.name}</div>
        <div className="flex items-start text-disabled text-2xs">
          {doctor.specialties}
        </div>
      </div>
    </button>
  );
}
