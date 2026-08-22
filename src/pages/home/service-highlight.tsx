import TransitionLink from "@/components/transition-link";
import { ReactNode } from "react";
import { To } from "react-router-dom";

function ServiceHighlight(props: {
  title: string;
  subtitle: string;
  cta?: ReactNode;
  image: string;
  className?: string;
  to: To;
}) {
  return (
    <TransitionLink
      className={"relative flex flex-col gap-1.5 bg-cover bg-center pb-4 px-3 pt-3 w-full h-full rounded-xl rounded-br-none ".concat(
        props.className ?? ""
      )}
      to={props.to}
    >
      <img src={props.image} className="image absolute bottom-0 right-0 w-20" />
      <div className="title text-base font-medium">{props.title}</div>
      <div className="subtitle text-xs text-disabled">{props.subtitle}</div>
      {props.cta}
    </TransitionLink>
  );
}

export default ServiceHighlight;
