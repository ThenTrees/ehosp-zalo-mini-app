import { Link, To } from "react-router-dom";

interface ActionProps {
  label: string;
  badge?: number;
  icon: React.ReactNode;
  to: To;
}

export function Action({ label, badge, icon, to }: ActionProps) {
  return (
    <Link className="flex items-center justify-between py-4" to={to}>
      <div className="flex items-center gap-1 text-sm">
        <div>{label}</div>
        {badge && (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 px-1 text-center text-3xs text-white">
            {badge}
          </div>
        )}
      </div>
      {icon}
    </Link>
  );
}
