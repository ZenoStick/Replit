import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BadgeItemProps {
  title: string;
  icon: string;
  color: string;
  secondaryColor: string;
  className?: string;
  animate?: boolean;
}

export function BadgeItem({
  title,
  icon,
  color,
  secondaryColor,
  className,
  animate = false
}: BadgeItemProps) {
  const getIconClass = (iconName: string) => {
    return `fas fa-${iconName}`;
  };
  
  const badgeVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring",
        duration: 0.5
      }
    }
  };
  
  const gradientClass = `from-${color} to-${secondaryColor}`;
  
  return (
    <motion.div 
      className={cn("badge flex flex-col items-center", className)}
      initial={animate ? "hidden" : "visible"}
      animate="visible"
      variants={badgeVariants}
    >
      <div className={cn("h-16 w-16 rounded-full bg-gradient-to-br p-0.5", gradientClass)}>
        <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
          <i className={cn(`text-${color} text-lg`, getIconClass(icon))}></i>
        </div>
      </div>
      <span className="text-xs mt-1 text-center">{title}</span>
    </motion.div>
  );
}
