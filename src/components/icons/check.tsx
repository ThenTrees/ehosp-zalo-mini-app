import { SVGProps } from 'react';

function CheckIcon({ color, ...props }: { color?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.5204 4.97982C13.7156 5.17508 13.7156 5.49167 13.5204 5.68693L7.59109 11.6162C7.35678 11.8505 6.97688 11.8505 6.74257 11.6162L3.47994 8.35359C3.28468 8.15833 3.28468 7.84175 3.47994 7.64649C3.6752 7.45123 3.99179 7.45123 4.18705 7.64649L7.16683 10.6263L12.8133 4.97982C13.0085 4.78456 13.3251 4.78456 13.5204 4.97982Z"
        fill={color ?? 'white'}
      />
    </svg>
  );
}

export default CheckIcon;
