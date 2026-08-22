import React from "react";

interface PlusIconProps {
  className?: string;
}

export function PlusIcon({ className }: PlusIconProps) {
  return (
    <svg
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: "visible" }}
    >
      <path
        d="M11.998 4.5C12.3292 4.50009 12.5974 4.76847 12.5977 5.09961V11.8984H19.3955L19.5156 11.9102C19.7892 11.966 19.9951 12.208 19.9951 12.498C19.9951 12.7881 19.7892 13.0301 19.5156 13.0859L19.3955 13.0977H12.5977V19.8955C12.5974 20.2266 12.3292 20.495 11.998 20.4951C11.6668 20.4951 11.3987 20.2267 11.3984 19.8955V13.0977H4.59961C4.26843 13.0974 4.00002 12.8293 4 12.498C4 12.1668 4.26842 11.8986 4.59961 11.8984H11.3984V5.09961C11.3986 4.76842 11.6668 4.5 11.998 4.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
