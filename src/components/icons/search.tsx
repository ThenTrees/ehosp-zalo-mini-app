import { SVGProps } from "react";

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
      {...props}
    >
      <g clipPath="url(#clip0_11_41)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M17.7885 17.79C17.9285 17.66 17.9985 17.48 17.9985 17.29C17.9985 17.09 17.9285 16.91 17.7885 16.78L15.1185 14.11C16.2085 12.78 16.8085 11.11 16.8085 9.41C16.8085 5.32 13.4885 2 9.39853 2C6.39853 2 3.71853 3.79 2.56853 6.57C1.41853 9.35 2.04853 12.52 4.16853 14.64C5.56853 16.04 7.41853 16.81 9.39853 16.81C11.1185 16.81 12.7885 16.21 14.1085 15.12L16.7785 17.79C16.9085 17.92 17.0985 18 17.2785 18C17.4685 18 17.6585 17.92 17.7885 17.79ZM9.40219 15.3736C12.6922 15.3736 15.3722 12.6936 15.3722 9.40359C15.3722 6.11359 12.6922 3.43359 9.40219 3.43359C6.11219 3.43359 3.44219 6.11359 3.43219 9.40359C3.43219 12.6936 6.11219 15.3736 9.40219 15.3736Z"
          fill="#999999"
        />
      </g>
      <defs>
        <clipPath id="clip0_11_41">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export default SearchIcon;
