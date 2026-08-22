import { useContext } from "react";
import { DetailPageContext } from "./context";

export default function Tab1() {
  const { tab1 } = useContext(DetailPageContext);

  return (
    <div
      className="flex w-full flex-col gap-4 px-4 pt-4 text-sm leading-[150%]"
      dangerouslySetInnerHTML={{ __html: tab1.htmlContent }}
    />
  );
}
