// https://ui.shadcn.com/docs/components/typography

import React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

const typographyVariants = cva("text-black leading-tight", {
    variants: {
        size: {
            h1: "scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance",
            h2: "text-2xl",
            h3: "text-1xl",
            body: "text-base",
            small: "text-sm text-gray-700",
        },
        weight: {
            normal: "font-normal",
            medium: "font-medium",
            bold: "font-bold",
        },
        align: {
            left: "text-left",
            center: "text-center",
            right: "text-right",
        },
        color: {
            black: "text-black",
            gray: "text-gray-500",
            red: "text-red-500",
            blue: "text-blue-500",
            green: "text-green-500",
            white: "text-white",
            yellow: "text-yellow-500"
        }
    },
    defaultVariants: {
        size: "body",
        weight: "normal",
        align: "left",
        color: "black",
    },
});

export interface TypographyProps extends Omit<React.HTMLAttributes<HTMLParagraphElement>, keyof VariantProps<typeof typographyVariants>>, VariantProps<typeof typographyVariants> {
    children: React.ReactNode;
    className?: string;
}

export const Typography: React.FC<TypographyProps> = ({
    size,
    weight,
    align,
    color,
    className,
    children,
    ...props
  }) => {
    return (
      <p
        className={`${typographyVariants({ size, weight, align, color })} ${
          className || ""
        }`}
        {...props}
      >
        {children}
      </p>
    );
  };
