import { cn } from '@/lib/utils';
import { JSX } from 'react';

interface TypographyProps
  extends React.HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'blockquote' | 'muted';
}

export function Typography({
  variant = 'p',
  className,
  children,
  ...props
}: TypographyProps) {
  const styles = {
    h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
    h2: 'scroll-m-20 text-3xl font-semibold tracking-tight transition-colors',
    h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
    h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
    p: 'leading-7 [&:not(:first-child)]:mt-6',
    blockquote: 'mt-6 border-l-2 pl-6 italic',
    muted: 'text-sm text-muted-foreground',
  };

  const Component = variant as keyof JSX.IntrinsicElements;

  return (
    <Component className={cn(styles[variant], className)} {...props}>
      {children}
    </Component>
  );
}
