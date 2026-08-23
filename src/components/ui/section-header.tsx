import TransitionLink from "@/components/transition-link";

/**
 * Tiêu đề một khu vực trên trang, kèm liên kết "Xem tất cả" tuỳ chọn ở bên phải.
 */
export default function SectionHeader({
  title,
  moreTo,
  moreLabel = "Xem tất cả",
}: {
  title: string;
  moreTo?: string;
  moreLabel?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {moreTo && (
        <TransitionLink
          to={moreTo}
          className="shrink-0 text-sm font-medium text-primary-ink"
        >
          {moreLabel}
        </TransitionLink>
      )}
    </div>
  );
}
