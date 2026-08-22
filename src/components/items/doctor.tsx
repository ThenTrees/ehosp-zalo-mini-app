import { HTMLProps, ReactNode } from "react";
import CheckIcon from "../icons/check";
import { Doctor } from "@/types";

interface DoctorItemProps extends HTMLProps<HTMLDivElement> {
  doctor: Doctor;
  suffix?: ReactNode;
  withLanguages?: boolean;
  description?: ReactNode;
}

export default function DoctorItem({
  doctor,
  suffix,
  withLanguages,
  description,
  ...props
}: DoctorItemProps) {
  return (
    <div
      className="flex flex-grow items-center justify-center gap-4 cursor-pointer"
      {...props}
    >
      <div className="flex flex-grow justify-center gap-2.5 self-stretch overflow-hidden">
        <div className="h-14 w-14 flex-none">
          <img src={doctor.image} alt={doctor.name} />
        </div>
        <div className="flex flex-grow flex-col gap-1 text-xs overflow-hidden">
          <div className="flex items-center gap-1.5 truncate">
            <div className="text-base font-medium">{doctor.name}</div>
            <div className="w-28 text-disabled">{doctor.title}</div>
          </div>
          {withLanguages && (
            <div className="text-disabled">{doctor.languages}</div>
          )}
          <div className="flex items-center text-2xs text-disabled pt-1.5">
            {description ?? doctor.specialties}
          </div>
        </div>
      </div>
      {suffix}
    </div>
  );
}
