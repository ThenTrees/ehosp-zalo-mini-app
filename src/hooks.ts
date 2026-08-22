import { MutableRefObject, useLayoutEffect, useState } from "react";
import { UIMatch, useMatches } from "react-router-dom";

export function useRealHeight(
  element: MutableRefObject<HTMLDivElement | null>,
  defaultValue?: number
) {
  const [height, setHeight] = useState(defaultValue ?? 0);
  useLayoutEffect(() => {
    if (element.current && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
        const [{ contentRect }] = entries;
        setHeight(contentRect.height);
      });
      ro.observe(element.current);
      return () => ro.disconnect();
    }
    return () => {};
  }, [element.current]);

  if (typeof ResizeObserver === "undefined") {
    return -1;
  }
  return height;
}

export function useRouteHandle() {
  const matches = useMatches() as UIMatch<
    undefined,
    {
      title?: string;
      back?: boolean;
      scrollRestoration?: number;
      noScroll?: boolean;
      profile?: boolean;
    }
  >[];
  const lastMatch = matches[matches.length - 1];

  return [lastMatch.handle ?? {}, lastMatch, matches] as const;
}
