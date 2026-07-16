import { cn } from '@repo/ui';
import Image from 'next/image';

interface DetailCoverImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function DetailCoverImage({
  src,
  alt,
  className,
}: DetailCoverImageProps) {
  return (
    <div
      className={cn(
        'relative h-48 w-full overflow-hidden rounded-xl border border-border bg-muted md:h-56',
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 1024px"
      />
    </div>
  );
}

interface DetailLogoImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function DetailLogoImage({ src, alt, className }: DetailLogoImageProps) {
  return (
    <div
      className={cn(
        'relative size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted',
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={56}
        height={56}
        unoptimized
        className="size-14 object-cover"
      />
    </div>
  );
}
