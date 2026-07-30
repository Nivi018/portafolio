import Link from "next/link";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";

type ButtonLinkProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants> & {
    children: React.ReactNode;
  };

/**
 * Componente Button que renderiza un Link de Next.js
 * Usa el patrón render + nativeButton={false} de Base UI
 */
export function ButtonLink({
  variant,
  size,
  className,
  children,
  ...linkProps
}: ButtonLinkProps) {
  return (
    <Button
      variant={variant}
      size={size}
      render={<Link {...linkProps} />}
      nativeButton={false}
      className={className}
    >
      {children}
    </Button>
  );
}
