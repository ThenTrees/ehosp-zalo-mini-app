import { useAtomValue } from "jotai";
import DoctorItem from "../items/doctor";
import { doctorsState } from "@/state";
import { Doctor } from "@/types";
import CheckIcon from "../icons/check";
import { startViewTransition } from "@/utils/miscellaneous";
import { useEffect } from "react";

export interface DoctorSelectorProps {
  value?: Doctor;
  onChange: (value: Doctor) => void;
  onLoadDoctors?: (doctors: Doctor[]) => void;
}

function DoctorSelector({
  value,
  onChange,
  onLoadDoctors,
}: DoctorSelectorProps) {
  const doctors = useAtomValue(doctorsState);

  useEffect(() => {
    onLoadDoctors?.(doctors);
  }, [doctors]);

  return (
    <div className="flex flex-col gap-6 bg-white mt-3 p-4">
      {doctors.map((doctor, index) => {
        const selected = value?.id === doctor.id;
        return (
          <DoctorItem
            withLanguages
            key={index}
            doctor={doctor}
            onClick={() => {
              if (doctor.isAvailable) {
                startViewTransition(() => {
                  onChange(doctor);
                });
              }
            }}
            suffix={
              <button
                disabled={!doctor.isAvailable}
                className={`flex items-center justify-center rounded-full flex-none basis-14 h-7 border border-primary-gradient disabled:bg-highlight disabled:grayscale disabled:text-disabled disabled:border-none ${selected ? "bg-primary-gradient" : "text-primary-gradient"}`}
              >
                {selected ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <span className="text-xs">
                    {doctor.isAvailable ? "Chọn" : "Bận"}
                  </span>
                )}
              </button>
            }
          />
        );
      })}
    </div>
  );
}

export default DoctorSelector;
