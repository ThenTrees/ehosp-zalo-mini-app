import { SVGProps } from "react";

/**
 * Bộ icon của app. Một tệp, đúng những icon đang dùng.
 *
 * Theo chỉ dẫn hình khối của design: khung 24px, nét 2px, đầu nét bo tròn.
 * Icon nào có trạng thái "đang chọn" (thanh tab) thì nhận prop `active` và tô
 * nhạt phần thân bằng chính màu chữ hiện hành — không cần vẽ hai bản.
 */

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** Tô nhạt phần thân. Dùng cho mục đang chọn trên thanh tab. */
  active?: boolean;
}

function Svg({ active, children, ...props }: IconProps) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <g
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.16 : 0}
      >
        {children}
      </g>
    </svg>
  );
}

/* ---------- Thanh tab ---------- */

export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 10.6 12 3.5l8.5 7.1V19a1.5 1.5 0 0 1-1.5 1.5h-3.5V15h-7v5.5H5A1.5 1.5 0 0 1 3.5 19z" />
    </Svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" fill="none" />
    </Svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.5 3.5h13v17l-2.6-1.6-2.2 1.6-2.2-1.6-2.2 1.6-2.2-1.6z" />
      <path d="M9 8.5h6M9 12.5h6" fill="none" />
    </Svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M4.75 20.5a7.25 7.25 0 0 1 14.5 0" />
    </Svg>
  );
}

/* ---------- Hành động ---------- */

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5.5v13M5.5 12h13" fill="none" />
    </Svg>
  );
}

export function CalendarPlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17M12 13v5M9.5 15.5h5" fill="none" />
    </Svg>
  );
}

export function TicketIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="6.5" width="17" height="11" rx="2" />
      <path d="M8 10.5h8M8 13.5h5" fill="none" />
    </Svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 9.5a6 6 0 1 0-12 0c0 5.5-2 6.5-2 6.5h16s-2-1-2-6.5z" />
      <path d="M10.2 19.5a2.2 2.2 0 0 0 3.6 0" fill="none" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.75" />
      <path d="M16 16l4 4" fill="none" />
    </Svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" fill="none" />
      <path d="M20 3.5V9h-5.5" fill="none" />
    </Svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.5 3.5H18a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-3.5" fill="none" />
      <path d="M10 8l-4 4 4 4M6 12h9" fill="none" />
    </Svg>
  );
}

/* ---------- Điều hướng ---------- */

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.5 5.5l6.5 6.5-6.5 6.5" fill="none" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.5 9l6.5 6.5L18.5 9" fill="none" />
    </Svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" fill="none" />
    </Svg>
  );
}

/* ---------- Trạng thái ---------- */

export function CheckCircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M8.25 12.4l2.6 2.6 4.9-5.4" fill="none" />
    </Svg>
  );
}

export function AlertCircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 7.75v5" fill="none" />
      <path d="M12 16.15v.1" fill="none" />
    </Svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 11.5v5" fill="none" />
      <path d="M12 7.85v.1" fill="none" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 7v5.3l3.4 2" fill="none" />
    </Svg>
  );
}

/* ---------- Nội dung ---------- */

export function StethoscopeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.5 3.5v5.2a4.5 4.5 0 0 0 9 0V3.5" fill="none" />
      <path d="M4 3.5h3M13 3.5h3" fill="none" />
      <path d="M10 13.2v1.8a5 5 0 0 0 10 0v-1" fill="none" />
      <circle cx="20" cy="11" r="2.2" />
    </Svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" fill="none" />
    </Svg>
  );
}

export function IdCardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <circle cx="8.5" cy="11" r="2" fill="none" />
      <path d="M5.5 16a3.5 3.5 0 0 1 6 0M14 10.5h4.5M14 14h3" fill="none" />
    </Svg>
  );
}

export function QrIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5" />
      <path d="M14 14h3v3h-3zM20.5 14v3M17.5 20.5h3" fill="none" />
    </Svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.2l7 2.6v5.5c0 4.5-3 7.7-7 9.5-4-1.8-7-5-7-9.5V5.8z" />
    </Svg>
  );
}

/** Bảng kẹp hồ sơ — Lịch sử khám. */
export function ClipboardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.5 5.5H5a1.5 1.5 0 0 0-1.5 1.5v12.5A1.5 1.5 0 0 0 5 21h14a1.5 1.5 0 0 0 1.5-1.5V7A1.5 1.5 0 0 0 19 5.5h-1.5" />
      <rect x="8" y="3" width="8" height="4" rx="1.2" />
      <path d="M8 12h8M8 16h5" fill="none" />
    </Svg>
  );
}

/** Viên nang — đơn thuốc. Cố ý KHÔNG dùng ở đâu ngoài nhãn tab đơn thuốc. */
export function PillIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect
        x="2.6"
        y="8.4"
        width="18.8"
        height="7.2"
        rx="3.6"
        transform="rotate(-45 12 12)"
      />
      <path d="M9.2 9.2l5.6 5.6" fill="none" />
    </Svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 13.5h4l1.5 3h6l1.5-3h4" fill="none" />
      <path d="M5.6 4.5h12.8l2.1 9v4a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2v-4z" />
    </Svg>
  );
}
