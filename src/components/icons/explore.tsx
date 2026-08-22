import { SVGProps } from "react";

interface CategoryIconProps extends SVGProps<SVGSVGElement> {
  active?: boolean;
}

export default function ExploreIcon({ active, ...props }: CategoryIconProps) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_2019_996)">
        <g clipPath="url(#clip1_2019_996)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.27802 7.78912C2.45802 10.8591 2.36802 14.6591 4.06802 17.8091C2.84802 20.0991 2.46802 21.9091 3.26802 22.7191C4.88802 24.3291 10.538 21.2891 15.908 15.9191C21.278 10.5491 24.328 4.87912 22.718 3.27912C21.908 2.46912 20.108 2.84912 17.798 4.07912C16.328 3.27912 14.678 2.84912 12.998 2.84912C9.42803 2.84912 6.11802 4.72912 4.27802 7.78912ZM7.91983 10.9726C7.91983 11.5326 8.36983 11.9826 8.93983 11.9826C9.49983 11.9826 9.94983 11.5326 9.94983 10.9726C9.94983 10.4026 9.49983 9.95264 8.93983 9.95264C8.36983 9.95264 7.91983 10.4026 7.91983 10.9726ZM10.9653 6.90842C10.9653 8.02842 11.8753 8.93842 12.9953 8.93842C14.1153 8.93842 15.0253 8.02842 15.0253 6.90842C15.0253 5.78842 14.1153 4.87842 12.9953 4.87842C11.8753 4.87842 10.9653 5.78842 10.9653 6.90842Z"
            fill={active ? "url(#paint0_linear_2019_996)" : "#DADADA"}
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M20.1613 20.1533C22.9913 17.3233 23.8913 13.0833 22.4513 9.34326C20.8213 11.9933 18.8613 14.4433 16.6313 16.6233C14.4413 18.8533 11.9913 20.8133 9.34131 22.4533C13.0813 23.8933 17.3213 22.9933 20.1613 20.1533Z"
            fill={active ? "url(#paint1_linear_2019_996)" : "#DADADA"}
          />
        </g>
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_2019_996"
          x1="-1.50734"
          y1="11.7294"
          x2="9.79805"
          y2="28.8027"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--primary-gradient)" />
          <stop offset="1" stopColor="var(--primary)" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_2019_996"
          x1="6.38422"
          y1="15.374"
          x2="14.0619"
          y2="26.9689"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--primary-gradient)" />
          <stop offset="1" stopColor="var(--primary)" />
        </linearGradient>
        <clipPath id="clip0_2019_996">
          <rect width="26" height="26" fill="white" />
        </clipPath>
        <clipPath id="clip1_2019_996">
          <rect
            width="20.3"
            height="20.3"
            fill="white"
            transform="translate(2.84961 2.84912)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
