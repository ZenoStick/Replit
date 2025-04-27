import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressCircularProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "accent" | "nature" | "energy";
  showValue?: boolean;
  className?: string;
}

const ProgressCircular = ({
  value,
  max = 100,
  size = "md",
  color = "primary",
  showValue = false,
  className,
  ...props
}: ProgressCircularProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const strokeWidth = size === "sm" ? 4 : size === "md" ? 6 : 8;
  const radius = size === "sm" ? 15 : size === "md" ? 20 : 25;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  const sizeClass = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-20 w-20",
  };
  
  const colorClass = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
    nature: "text-nature",
    energy: "text-energy",
  };
  
  const valueSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div 
      className={cn("relative inline-flex items-center justify-center", sizeClass[size], className)} 
      {...props}
    >
      <svg className="transform -rotate-90 w-full h-full" viewBox={`0 0 ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`}>
        <circle
          className="text-muted stroke-current"
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          className={cn("stroke-current", colorClass[color])}
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      
      {showValue && (
        <div className={cn("absolute inset-0 flex items-center justify-center font-semibold", valueSize[size], colorClass[color])}>
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

export { ProgressCircular };
