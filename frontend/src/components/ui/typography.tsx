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
        },
        defaultVariants: {
            size: "body",
            weight: "normal",
            align: "left",
        },
});

export interface TypographyProps extends React.HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof typographyVariants> {
    children: React.ReactNode;
    className?: string;
}

export const Typography: React.FC<TypographyProps> = ({
  size,
  weight,
  align,
  className,
  children,
  ...props
}) => {
  return (
    <p
      className={`${typographyVariants({ size, weight, align })} ${
        className || ""
      }`}
      {...props}
    >
      {children}
    </p>
  );
};
