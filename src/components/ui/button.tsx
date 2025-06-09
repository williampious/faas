
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    React.AnchorHTMLAttributes<HTMLAnchorElement>, // Allow anchor props
    VariantProps<typeof buttonVariants> {
  asChild?: boolean // Button's own asChild prop
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild: buttonAsChild = false, // Button's own asChild prop
      ...restProps // Contains other props, including those potentially passed by Link
    },
    ref
  ) => {
    // Destructure 'asChild' from restProps to ensure it's not passed to the DOM element
    // if Link passes it down.
    const { asChild: incomingAsChildFromLink, ...elementSpecificProps } = restProps

    // Determine the component to render.
    // If Button's own asChild is true, use Slot.
    // Else, if href is present (passed from Link), render an 'a' tag.
    // Otherwise, render a 'button' tag.
    const Comp = buttonAsChild
      ? Slot
      : (elementSpecificProps.href ? "a" : "button")

    const finalProps: React.HTMLAttributes<HTMLElement> & Record<string, any> = {
      className: cn(buttonVariants({ variant, size, className })),
      ref: ref as React.ForwardedRef<any>, // Ref can be for button or anchor
      ...elementSpecificProps,
    }

    // Ensure 'type' prop is handled correctly for 'a' vs 'button'
     if (Comp === 'a' && typeof finalProps.type === 'string') {
      // Remove button-specific type if we are rendering an anchor
      if (finalProps.type === 'submit' || finalProps.type === 'reset' || finalProps.type === 'button') {
       delete finalProps.type;
      }
    }
    if (Comp === 'button' && !finalProps.type && !finalProps.href) {
      // Default type for button if not an anchor and type not specified
      finalProps.type = 'button';
    }


    return <Comp {...finalProps} />
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
