export default function Header() {
  return (
    <div className="px-4 pt-3">
      <div className="flex items-center justify-between gap-4 rounded-lg bg-highlight p-3">
        <span className="text-sm">Không biết chọn dịch vụ nào?</span>
        <button className="rounded-xl bg-white px-3 py-1 text-xs text-primary">
          Tư vấn khám
        </button>
      </div>
    </div>
  );
}
