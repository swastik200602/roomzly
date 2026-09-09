import { useEffect, useState } from "react";

import defaultFallback from "@/assets/property-1.jpg";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ProgressiveImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  wrapperClassName?: string;
  fallbackSrc?: string;
};

export function ProgressiveImage({
  className,
  wrapperClassName,
  onLoad,
  onError,
  loading = "lazy",
  src,
  fallbackSrc = defaultFallback,
  alt,
  ...props
}: ProgressiveImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setLoaded(false);
  }, [src]);

  return (
    <span className={cn("relative block overflow-hidden bg-surface", wrapperClassName)}>
      {!loaded && <Skeleton className="absolute inset-0 size-full rounded-none" />}
      <img
        {...props}
        src={imgSrc || fallbackSrc}
        alt={alt}
        loading={loading}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          if (imgSrc && imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
          } else {
            setLoaded(true);
          }
          onError?.(event);
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
