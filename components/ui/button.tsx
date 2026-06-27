'use client';

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-glow relative inline-flex items-center justify-center overflow-hidden whitespace-nowrap rounded-full text-sm font-medium transition-[transform,box-shadow,background-color,opacity] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--token-brand-primary)] text-[var(--token-bg-base)] hover:opacity-90",
        secondary: "bg-[var(--token-bg-elevated)] text-[var(--token-text-primary)] hover:bg-[var(--token-bg-surface)]",
        ghost: "text-[var(--token-text-primary)] hover:bg-[var(--token-bg-surface)]",
        // Glassmorphism — translucent, blurred, monochrome.
        glass: "border border-white/15 bg-white/5 text-[var(--token-text-primary)] backdrop-blur-md hover:bg-white/10"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Show a spinner and disable interaction while an action is in flight. */
  loading?: boolean;
  /** Pull the button a few px toward the cursor on hover (fine pointers only). */
  magnetic?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, magnetic = false, children, onClick, onPointerMove, onPointerLeave, disabled, ...props },
    ref,
  ) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([]);
    const rippleSeq = React.useRef(0);

    // asChild (Slot) must wrap exactly one child, so the ripple / spinner chrome cannot
    // be injected there — the polymorphic path stays a thin styled passthrough.
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const id = (rippleSeq.current += 1);
      setRipples((list) => [...list, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      window.setTimeout(() => setRipples((list) => list.filter((rp) => rp.id !== id)), 650);
      onClick?.(e);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (magnetic && e.pointerType === "mouse") {
        const rect = e.currentTarget.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        e.currentTarget.style.setProperty("--btn-mx", `${(dx * 4).toFixed(1)}px`);
        e.currentTarget.style.setProperty("--btn-my", `${(dy * 4).toFixed(1)}px`);
      }
      onPointerMove?.(e);
    };

    const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.style.removeProperty("--btn-mx");
      e.currentTarget.style.removeProperty("--btn-my");
      onPointerLeave?.(e);
    };

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }), magnetic && "btn-magnetic")}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <span className="btn-spinner" data-button-spinner aria-hidden="true" />}
        <span className={loading ? "opacity-0" : undefined}>{children}</span>
        {ripples.map((rp) => (
          <span
            key={rp.id}
            className="btn-ripple"
            data-button-ripple
            style={{ left: rp.x, top: rp.y }}
            aria-hidden="true"
          />
        ))}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
