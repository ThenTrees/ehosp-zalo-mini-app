import { SVGProps } from 'react';

function ChevronDownIcon({ color, ...props }: { color?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_58_259)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.58848 6.17103C7.58848 6.32103 7.63848 6.47103 7.75848 6.58103L13.0085 11.831C13.2285 12.061 13.5985 12.061 13.8285 11.831C14.0585 11.601 14.0585 11.231 13.8285 11.011L8.57848 5.76103C8.35848 5.53103 7.98848 5.53103 7.75848 5.76103C7.63848 5.87103 7.58848 6.02103 7.58848 6.17103Z"
          fill={color ?? '#9A9A9A'}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2.51189 11.8312C2.74189 12.0612 3.11189 12.0612 3.33189 11.8312L8.58189 6.58115C8.81189 6.36115 8.81189 5.99115 8.58189 5.76115C8.35189 5.53115 7.98189 5.53115 7.76189 5.76115L2.51189 11.0112C2.39189 11.1212 2.34189 11.2712 2.34189 11.4212C2.34189 11.5712 2.39189 11.7212 2.51189 11.8312Z"
          fill={color ?? '#9A9A9A'}
        />
      </g>
      <defs>
        <clipPath id="clip0_58_259">
          <rect
            width="11.6591"
            height="6.412"
            fill="white"
            transform="translate(14 12) rotate(-180)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}

export default ChevronDownIcon;
