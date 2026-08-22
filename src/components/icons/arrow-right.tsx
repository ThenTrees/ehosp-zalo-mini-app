import { SVGProps } from "react";

function ArrowRightIcon({
  color,
  ...props
}: { color?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="13"
      height="14"
      viewBox="0 0 13 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_11_190)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.53642 11.8978C4.69642 11.8978 4.83642 11.8378 4.94642 11.7378L9.24642 7.58777C9.35642 7.47777 9.41642 7.33777 9.41642 7.18777C9.41642 7.02777 9.35642 6.88777 9.23642 6.77777L4.94642 2.63777C4.83642 2.52777 4.68642 2.46777 4.53642 2.46777C4.38642 2.46777 4.23642 2.52777 4.12642 2.63777C4.01642 2.73777 3.95642 2.88777 3.95642 3.03777C3.95642 3.18777 4.01642 3.32777 4.12642 3.43777L8.00642 7.18777L4.12642 10.9278C4.01642 11.0378 3.95642 11.1778 3.95642 11.3278C3.95642 11.4878 4.01642 11.6278 4.12642 11.7378C4.23642 11.8478 4.38642 11.8978 4.53642 11.8978Z"
          fill={color ?? "#999999"}
        />
      </g>
      <defs>
        <clipPath id="clip0_11_190">
          <rect
            width="13"
            height="13"
            fill="white"
            transform="translate(0 0.5)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}

export default ArrowRightIcon;
