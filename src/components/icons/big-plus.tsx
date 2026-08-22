import { SVGProps } from "react";

function BigPlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="50"
      height="50"
      viewBox="0 0 46 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 23C0 10.2975 10.2975 0 23 0V0C35.7025 0 46 10.2975 46 23V23C46 35.7025 35.7025 46 23 46V46C10.2975 46 0 35.7025 0 23V23Z"
        fill="url(#paint0_linear_9311_953)"
      />
      <path
        d="M23 13C24.1046 13 25 13.8954 25 15V21H31C32.1046 21 33 21.8954 33 23C33 24.1046 32.1046 25 31 25H25V31C25 32.1046 24.1046 33 23 33C21.8954 33 21 32.1046 21 31V25H15C13.8954 25 13 24.1046 13 23C13 21.8954 13.8954 21 15 21H21V15C21 13.8954 21.8954 13 23 13Z"
        fill="url(#paint1_linear_9311_953)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_9311_953"
          x1="53.2909"
          y1="30.6193"
          x2="32.7547"
          y2="-6.64999"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--primary-gradient)" />
          <stop offset="1" stopColor="var(--primary)" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_9311_953"
          x1="23"
          y1="33"
          x2="23"
          y2="12"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0.8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default BigPlusIcon;
