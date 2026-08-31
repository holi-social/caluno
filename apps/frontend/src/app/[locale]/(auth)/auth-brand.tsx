import { Logo } from '@repo/ui/logo';

interface AuthBrandProps {
  /** Width in pixels; height scales automatically to preserve the logo's aspect ratio. */
  width?: number;
  className?: string;
}

/** Caluno mark for auth pages. */
export function AuthBrand({ width = 180, className }: AuthBrandProps) {
  return <Logo width={width} className={className} />;
}
