import { Button } from "@/components/button";
import SearchIcon from "@/components/icons/search";
import { HTMLProps } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar({
  className,
  loading,
  ...props
}: HTMLProps<HTMLInputElement> & { loading?: boolean }) {
  const navigate = useNavigate();
  return (
    <form
      className={`flex items-center justify-between rounded-full bg-white relative p-1 space-x-1 ${className ?? ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        const keyword = new FormData(e.currentTarget).get("keyword") as string;
        navigate(`/search?keyword=${encodeURIComponent(keyword)}`, {
          viewTransition: true,
        });
      }}
    >
      <input
        placeholder="Tìm bệnh, bác sĩ, thuốc..."
        className="placeholder:text-disabled text-sm pl-8 flex-1 rounded-full self-stretch outline-none"
        required
        name="keyword"
        {...props}
      />
      <SearchIcon className="h-5 w-5 absolute left-2" />
      <Button
        className="rounded-full !w-auto h-[26px] [&_.spinner]:w-4 [&_.spinner]:h-4 px-4 text-center text-xs text-white"
        loading={loading}
      >
        Tìm
      </Button>
    </form>
  );
}
