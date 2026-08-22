export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-4 text-disabled">
      Trang <span className="text-primary">{title}</span> sẽ được xây ở bước sau.
    </div>
  );
}
