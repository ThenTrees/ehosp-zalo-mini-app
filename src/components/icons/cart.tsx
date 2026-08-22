import { SVGProps } from "react";

interface CartIconProps extends SVGProps<SVGSVGElement> {
  active?: boolean;
}

export default function ChatIcon({ active, ...props }: CartIconProps) {
  return (
    <svg
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
      {...props}
    >
      <g clipPath="url(#clip0_2019_7696)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M23.7884 20.4753V9.25533C23.7784 8.22533 22.9284 7.39533 21.9084 7.39533V19.5053C21.9084 19.9853 21.5684 20.4053 21.1184 20.4753C21.0684 20.4853 21.0184 20.4853 20.9684 20.4853C20.4484 20.4853 20.0284 20.0653 20.0284 19.5553V4.58533C20.0284 3.55533 19.1884 2.71533 18.1584 2.71533H5.07837C4.04837 2.71533 3.20837 3.55533 3.20837 4.58533V20.4753C3.20837 22.0253 4.46837 23.2853 6.01837 23.2853H20.9784C22.5284 23.2853 23.7884 22.0253 23.7884 20.4753ZM6.94721 18.139H16.2972C16.8172 18.139 17.2372 17.719 17.2372 17.209C17.2372 16.679 16.8272 16.269 16.2972 16.269H6.94721C6.43721 16.269 6.01721 16.689 6.01721 17.209C6.01721 17.729 6.42721 18.139 6.94721 18.139ZM6.94721 13.4579H16.2972C16.8172 13.4579 17.2372 13.0379 17.2372 12.5179C17.2372 11.9979 16.8272 11.5879 16.2972 11.5879H6.94721C6.43721 11.5879 6.01721 12.0079 6.01721 12.5179C6.01721 13.0479 6.42721 13.4579 6.94721 13.4579ZM6.94721 8.7909H16.2972C16.8172 8.7909 17.2372 8.3709 17.2372 7.8509C17.2372 7.3309 16.8272 6.9209 16.2972 6.9209H6.94721C6.43721 6.9209 6.01721 7.3409 6.01721 7.8509C6.01721 8.3809 6.42721 8.7909 6.94721 8.7909Z"
          fill={active ? "url(#paint0_linear_2019_7696)" : "#DADADA"}
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_2019_7696"
          x1="-1.82418"
          y1="11.6563"
          x2="10.121"
          y2="29.6963"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--primary-gradient)" />
          <stop offset="1" stopColor="var(--primary)" />
        </linearGradient>
        <clipPath id="clip0_2019_7696">
          <rect
            width="26"
            height="26"
            fill="white"
            transform="translate(0.5)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
