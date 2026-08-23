import { ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { IconProps, InboxIcon } from "@/components/icons";
import { Button } from "@/components/button";

/**
 * Màn rỗng dùng chung. Trước đây mỗi trang tự viết một dòng chữ xám khác nhau,
 * nên người bệnh gặp năm giọng văn khác nhau cho cùng một tình huống.
 */
export default function EmptyState({
  icon: Icon = InboxIcon,
  title,
  hint,
  actionLabel,
  actionTo,
  onAction,
}: {
  icon?: ComponentType<IconProps>;
  title: string;
  hint?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
        <Icon width={30} height={30} />
      </span>
      <p className="text-lg font-semibold text-ink">{title}</p>
      {hint && <p className="mt-2 text-sm text-ink-muted">{hint}</p>}
      {actionLabel && (actionTo || onAction) && (
        <Button
          fullWidth={false}
          className="mt-6 px-6"
          onClick={() =>
            onAction
              ? onAction()
              : navigate(actionTo!, { viewTransition: true })
          }
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
