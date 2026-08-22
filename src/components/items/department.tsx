import { Department } from "@/types";
import { HTMLProps } from "react";
import TransitionLink from "../transition-link";

interface DepartmentItemProps extends HTMLProps<HTMLAnchorElement> {
  item: Department;
}

function DepartmentItem({ item, className, ...props }: DepartmentItemProps) {
  return (
    <TransitionLink
      to={`/department/${item.id}`}
      {...props}
      className={`w-full flex flex-col gap-2 rounded-lg text-left p-2.5 ${className ?? ""}`}
    >
      <div className="text-sm font-medium">{item.name}</div>
      <div className="text-xs text-disabled w-full truncate">
        {item.shortDescription}
      </div>
    </TransitionLink>
  );
}

export default DepartmentItem;
