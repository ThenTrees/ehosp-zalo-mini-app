import { HTMLAttributes, ReactNode } from "react";

interface MarkedTitleSectionProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
}

function MarkedTitleSection({
  title,
  children,
  ...props
}: MarkedTitleSectionProps) {
  return (
    <div className="bg-white rounded-lg pt-4 pb-6 space-y-4">
      <div className="flex items-center gap-2.5" {...props}>
        <div className="h-5 w-[5px]">
          <svg
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            viewBox="0 0 5 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0 0H3C4.10457 0 5 0.895431 5 2V19C5 20.1046 4.10457 21 3 21H0V0Z"
              fill="var(--primary)"
            />
          </svg>
        </div>
        <span className="text-base font-medium">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default MarkedTitleSection;
