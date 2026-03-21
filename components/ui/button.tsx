import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'glass';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function buttonVariants({ variant = 'default', size = 'default', className = '' }: Partial<ButtonProps> & { className?: string }) {
  const baseClasses = "inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-[#7c3aed] text-white hover:bg-[#6d28d9]", // Default Theme Primary
    outline: "border border-[var(--border-color)] bg-transparent hover:bg-white/5 text-[var(--text-primary)]",
    ghost: "hover:bg-white/10 text-[var(--text-primary)]",
    glass: "glass-icon-btn text-[var(--studio-meta-color)] bg-[var(--studio-header-bg)] hover:bg-white/10",
  };
  
  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-full px-3 text-xs",
    lg: "h-10 rounded-full px-8",
    icon: "h-10 w-10 flex items-center justify-center p-0",
  };

  return `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
