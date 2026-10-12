import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 water-droplet-btn",
  {
    variants: {
      variant: {
        default: "water-droplet-crystal shadow-md active:scale-[0.96]",
        hero: "water-droplet-crystal text-base shadow-lg hover:scale-[1.03] active:scale-[0.96]",
        primary: "water-droplet-primary shadow-md active:scale-[0.96]",
        sale: "water-droplet-sale shadow-md active:scale-[0.96]",
        destructive: "water-droplet-sale shadow-md active:scale-[0.96]",
        outline: "water-droplet-crystal active:scale-[0.96]",
        secondary: "water-droplet-crystal active:scale-[0.96]",
        ghost: "!rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-foreground !backdrop-blur-none !shadow-none !border-none before:!hidden",
        link: "text-primary underline-offset-4 hover:underline !rounded-none !shadow-none !border-none !backdrop-blur-none before:!hidden",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-full",
        sm: "h-8.5 rounded-full px-3.5 text-xs",
        lg: "h-12 rounded-full px-8 text-base",
        xl: "h-14 rounded-full px-10 text-lg",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
