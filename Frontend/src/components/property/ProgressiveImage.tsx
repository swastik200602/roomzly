import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ProgressiveImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  wrapperClassName?: string;
};

export function ProgressiveImage({
  className,
  wrapperClassName,
  onLoad,
  loading = "lazy",
  ...props
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span className={cn("relative block overflow-hidden bg-surface", wrapperClassName)}>
      {!loaded && <Skeleton className="absolute inset-0 size-full rounded-none" />}
      <img
        {...props}
        loading={loading}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        className={cn(
          "size-full transition-[opacity,filter,transform] duration-500 ease-[var(--ease-expo)]",
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-sm",
          className,
        )}
      />
    </span>
  );
}
