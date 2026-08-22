import NotFound from "@/pages/404";
import { userState } from "@/state";
import { NotifiableError } from "@/utils/errors";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useRouteError } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();
  const resetUser = useSetAtom(userState);

  useEffect(() => {
    if (error instanceof NotifiableError) {
      toast.error(error.message);
      resetUser();
    } else {
      console.warn({ error });
    }
  }, [error]);

  return <NotFound noToast />;
}
