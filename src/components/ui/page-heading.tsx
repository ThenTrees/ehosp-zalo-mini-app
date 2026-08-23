/**
 * Tiêu đề lớn đầu trang cho các trang nằm trên thanh tab. Header của chúng chỉ
 * có tên phòng khám và chuông, nên tên trang nằm trong thân trang — đúng cách
 * bố cục của design.
 */
export default function PageHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="px-4 pb-4 pt-1">
      <h1 className="text-2xl font-bold tracking-tightest text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
    </div>
  );
}
