import { SVGProps } from "react";

interface ProfileIconProps extends SVGProps<SVGSVGElement> {
  active?: boolean;
}

export default function ProfileIcon({ active, ...props }: ProfileIconProps) {
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
      <g clipPath="url(#clip0_2019_7718)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M19.4261 8.36422V2.57422H13.496C10.226 2.57422 7.57605 5.16422 7.57605 8.36422C7.57605 11.5642 10.226 14.1642 13.496 14.1642C16.776 14.1642 19.4261 11.5642 19.4261 8.36422Z"
          fill={active ? "url(#paint0_linear_2019_7718)" : "#DADADA"}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.17161 15.3184C7.07161 15.3184 6.01161 15.7484 5.23161 16.4984C4.46161 17.2684 4.02161 18.2984 4.02161 19.3684V19.9484C4.02161 21.8684 5.61161 23.4284 7.57161 23.4284H19.4216C21.3816 23.4284 22.9816 21.8684 22.9816 19.9484V19.3684C22.9816 17.1284 21.1216 15.3184 18.8316 15.3184H8.17161Z"
          fill={active ? "url(#paint0_linear_2019_7718)" : "#DADADA"}
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_2019_7718"
          x1="-1.82418"
          y1="11.6563"
          x2="10.121"
          y2="29.6963"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--primary-gradient)" />
          <stop offset="1" stopColor="var(--primary)" />
        </linearGradient>
        <clipPath id="clip0_2019_7718">
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
