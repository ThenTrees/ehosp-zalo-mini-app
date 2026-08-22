import { ReactNode, useState } from "react";
import { Button, ButtonProps } from "../button";

interface FabFormProps {
  fab: ButtonProps | ButtonProps[];
  children: ReactNode;
  onSubmit?: () => Promise<void>;
}

function FabForm({ fab, children, onSubmit }: FabFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (onSubmit) {
        await onSubmit();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1">{children}</div>
      <div className="flex-none flex p-4 pb-sb space-x-3 sticky bottom-0">
        {(Array.isArray(fab) ? fab : [fab]).map((fab, i) => (
          <Button key={i} type="submit" loading={isLoading} {...fab} />
        ))}
      </div>
    </form>
  );
}

export default FabForm;
