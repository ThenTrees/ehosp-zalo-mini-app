import { ReactNode } from "react";
import TransitionLink from "./transition-link";

interface RemoteDiagnosisItemProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export default function RemoteDiagnosisItem({
  icon,
  title,
  subtitle,
}: RemoteDiagnosisItemProps) {
  return (
    <TransitionLink
      to="/booking"
      className="flex flex-col justify-center rounded-lg bg-background p-3"
    >
      <div className="flex items-center justify-center gap-2 pr-3">
        <div className="h-10 w-10">{icon}</div>
        <div className="flex flex-grow flex-col items-start gap-1.5 self-stretch overflow-hidden">
          <div className="self-stretch text-base font-medium truncate">
            {title}
          </div>
          <div className="text-xs text-disabled">{subtitle}</div>
        </div>
      </div>
    </TransitionLink>
  );
}
