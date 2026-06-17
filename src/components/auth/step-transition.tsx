"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

type Direction = "forward" | "backward";

export function StepTransition({
  stepKey,
  direction,
  children,
}: {
  stepKey: string;
  direction: Direction;
  children: React.ReactNode;
}) {
  const [renderedKey, setRenderedKey] = useState(stepKey);
  const [renderedChildren, setRenderedChildren] = useState(children);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    if (stepKey === renderedKey) {
      const id = requestAnimationFrame(() => setRenderedChildren(children));
      return () => cancelAnimationFrame(id);
    }

    const outId = requestAnimationFrame(() => setPhase("out"));
    const t = setTimeout(() => {
      setRenderedKey(stepKey);
      setRenderedChildren(children);
      setPhase("in");
    }, 180);

    return () => { cancelAnimationFrame(outId); clearTimeout(t); };
  }, [stepKey, children, renderedKey]);

  const translateOut = direction === "forward" ? "-translate-x-4" : "translate-x-4";
  const translateIn = direction === "forward" ? "translate-x-4" : "-translate-x-4";

  return (
    <div
      className={cn(
        "transition-all duration-200 ease-out",
        phase === "out" && `opacity-0 ${translateOut}`,
        phase === "in" && "opacity-100 translate-x-0"
      )}
      style={phase === "in" ? undefined : { transform: undefined }}
      key={renderedKey}
    >
      <div
        className={cn(
          "transition-all duration-200 ease-out",
          phase === "in" ? "opacity-100 translate-x-0" : `opacity-0 ${translateIn}`
        )}
      >
        {renderedChildren}
      </div>
    </div>
  );
}