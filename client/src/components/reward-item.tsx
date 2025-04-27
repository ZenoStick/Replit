import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface RewardItemProps {
  id: number;
  title: string;
  description?: string;
  category: string;
  icon: string;
  pointsCost: number;
  userPoints: number;
  onRedeem?: () => void;
  className?: string;
}

export function RewardItem({
  id,
  title,
  description,
  category,
  icon,
  pointsCost,
  userPoints,
  onRedeem,
  className
}: RewardItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);
  
  const getIconClass = (iconName: string) => {
    return `fas fa-${iconName}`;
  };

  const canAfford = userPoints >= pointsCost;
  
  const redeemReward = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/rewards/${id}/redeem`, {});
    },
    onSuccess: () => {
      toast({
        title: "Reward Redeemed!",
        description: `You've successfully redeemed ${title}`,
        variant: "default"
      });
      
      if (onRedeem) {
        onRedeem();
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/rewards'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to redeem reward. Make sure you have enough points.",
        variant: "destructive"
      });
    }
  });

  const handleRedeem = () => {
    if (!canAfford) {
      toast({
        title: "Not Enough Points",
        description: `You need ${pointsCost - userPoints} more points to redeem this reward.`,
        variant: "destructive"
      });
      return;
    }
    
    redeemReward.mutate();
  };

  return (
    <Card 
      className={cn("bg-white rounded-2xl p-4 shadow-sm", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="bg-gray-100 rounded-xl h-32 flex items-center justify-center mb-3 overflow-hidden relative"
      >
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <i className={cn("text-5xl text-gray-400", getIconClass(icon))}></i>
        </div>
        <div className={cn(
          "h-24 w-24 flex items-center justify-center transition-opacity duration-300",
          isHovered ? "opacity-0" : "opacity-100"
        )}>
          <i className={cn("text-4xl text-gray-700", getIconClass(icon))}></i>
        </div>
      </div>
      
      <h4 className="font-heading font-bold">{title}</h4>
      {description && <p className="text-gray-600 text-xs mb-2">{description}</p>}
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center">
          <i className="fas fa-coin text-energy mr-1"></i>
          <span className="font-medium">{pointsCost}</span>
        </div>
        
        <Button
          onClick={handleRedeem}
          disabled={!canAfford || redeemReward.isPending}
          className={cn(
            "px-3 py-1 rounded-lg text-sm font-medium",
            canAfford ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
          )}
        >
          {redeemReward.isPending ? "..." : "Get"}
        </Button>
      </div>
    </Card>
  );
}
