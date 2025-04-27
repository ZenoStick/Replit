import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface AvatarOption {
  id: number;
  imageUrl: string;
}

interface AvatarSelectionProps {
  options: AvatarOption[];
  selectedId: number;
  onSelect: (id: number) => void;
  className?: string;
}

export function AvatarSelection({
  options,
  selectedId,
  onSelect,
  className
}: AvatarSelectionProps) {
  return (
    <div className={cn("grid grid-cols-4 gap-3", className)}>
      {options.map((avatar) => (
        <div
          key={avatar.id}
          className={cn(
            "avatar-option bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center cursor-pointer transition-all",
            "border-2",
            avatar.id === selectedId ? "border-primary" : "border-transparent hover:border-primary/50",
          )}
          onClick={() => onSelect(avatar.id)}
        >
          <Avatar className="h-14 w-14 border">
            <AvatarImage src={avatar.imageUrl} alt={`Avatar option ${avatar.id}`} />
            <AvatarFallback>{avatar.id}</AvatarFallback>
          </Avatar>
        </div>
      ))}
    </div>
  );
}
