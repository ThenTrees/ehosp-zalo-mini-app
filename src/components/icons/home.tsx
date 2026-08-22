import { SVGProps } from "react";

interface HomeIconProps extends SVGProps<SVGSVGElement> {
  active?: boolean;
}

export default function HomeIcon({ active, ...props }: HomeIconProps) {
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
      <g clipPath="url(#clip0_2019_7690)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.5033 2.27344C12.7733 2.27344 12.1033 2.56344 11.5933 3.09344L3.46326 11.5534C2.62326 12.4334 2.73326 13.1834 2.87326 13.5034C2.96326 13.7234 3.30326 14.3434 4.26326 14.3434H5.45326V20.8534C5.45326 22.3334 6.51326 23.7234 8.02326 23.7234H9.39326H11.4933V22.1934V16.8334C11.4933 16.0934 11.3733 15.6834 12.1333 15.6834H13.5033H14.8633C15.6233 15.6834 15.5133 16.0934 15.5133 16.8334V22.1934V23.7234H17.6033H18.9733C20.4833 23.7234 21.5433 22.3334 21.5433 20.8534V14.3434H22.7333C23.7033 14.3434 24.0333 13.7234 24.1333 13.5034C24.2733 13.1834 24.3733 12.4334 23.5433 11.5534L15.4033 3.09344C14.9033 2.56344 14.2233 2.27344 13.5033 2.27344Z"
          fill={active ? "url(#paint0_linear_2019_7690)" : "#DADADA"}
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_2019_7690"
          x1="-1.82418"
          y1="11.6563"
          x2="10.121"
          y2="29.6963"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--primary-gradient)" />
          <stop offset="1" stopColor="var(--primary)" />
        </linearGradient>
        <clipPath id="clip0_2019_7690">
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
