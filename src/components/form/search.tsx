import SearchIcon from "@/components/icons/search";
import { HTMLProps } from "react";

export default function SearchInput({
  className,
  ...props
}: HTMLProps<HTMLInputElement>) {
  return (
    <div
      className={`flex items-center justify-between rounded-full bg-white relative space-x-1 border border-black/10 ${className ?? ""}`}
    >
      <input
        placeholder="Tìm bệnh, bác sĩ, thuốc..."
        className="placeholder:text-disabled text-sm pl-[34px] h-[34px] flex-1 rounded-full outline-none"
        required
        name="keyword"
        {...props}
      />
      <SearchIcon className="h-5 w-5 absolute left-2" />
    </div>
  );
}
