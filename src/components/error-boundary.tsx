import NotFound from "@/pages/404";
import { NotifiableError } from "@/utils/errors";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useRouteError } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    if (error instanceof NotifiableError) {
      toast.error(error.message);
    } else {
      console.warn({ error });
    }
  }, [error]);

  return <NotFound noToast />;
}
