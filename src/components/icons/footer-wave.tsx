import { SVGProps } from "react";

function FooterWave(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="100%"
      preserveAspectRatio="none"
      viewBox="0 0 375 99"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M375 99V16H244.44C231.46 16 225.56 14.95 215.57 9.98C215.57 9.98 200.59 0 188.3 0C176.01 0 170.91 3.96 159.19 9.98C147.47 16 129.64 16 129.64 16H0V99H375Z"
        fill="white"
      />
    </svg>
  );
}

export default FooterWave;
