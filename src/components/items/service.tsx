import { To } from "react-router-dom";
import TransitionLink from "../transition-link";

interface Link {
  to: To;
}

interface CTA {
  onClick: () => void;
}

interface ServiceItemProps {
  icon: string;
  label: string;
  className?: string;
}

export default function ServiceItem({
  icon,
  label,
  className = "",
  ...props
}: ServiceItemProps & (Link | CTA)) {
  const children = (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <div className="h-8 w-8 flex items-center justify-center">
        <img src={icon} alt={label} />
      </div>
      <div className="text-2xs text-center w-full truncate">{label}</div>
    </div>
  );
  if ("to" in props) {
    return <TransitionLink to={props.to}>{children}</TransitionLink>;
  }

  return <button onClick={props.onClick}>{children}</button>;
}
