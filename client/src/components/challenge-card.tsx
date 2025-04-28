import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  id: number;
  title: string;
  description: string;
  category: string;
  icon: string;
  points: number;
  duration?: number | null;
  reps?: number | null;
  isComplete: boolean;
  progress: number;
  onStart?: () => void;
  className?: string;
}

export function ChallengeCard({
  id,
  title,
  description,
  category,
  icon,
  points,
  duration,
  reps,
  isComplete,
  progress,
  onStart,
  className
}: ChallengeCardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentProgress, setCurrentProgress] = useState(progress);
  
  // Utility function to get icon color based on category
  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      "Fitness": "bg-nature",
      "Hydration": "bg-secondary",
      "Mindfulness": "bg-accent",
      "Nutrition": "bg-energy",
      "Sleep": "bg-primary"
    };
    
    return categoryColors[category] || "bg-primary";
  };

  // Utility function to get icon
  const getIconClass = (iconName: string) => {
    return `fas fa-${iconName}`;
  };
  
  // Format description text
  const getDescription = () => {
    let desc = description;
    
    if (duration) {
      desc += ` • ${duration} mins`;
    }
    
    if (reps) {
      desc += ` • ${reps} reps`;
    }
    
    desc += ` • ${points} points`;
    
    return desc;
  };
  
  // Start workout or update progress
  const handleAction = () => {
    if (category === "Fitness" && onStart) {
      onStart();
    } else if (!isComplete) {
      updateProgress.mutate();
    }
  };
  
  // Update challenge progress
  const updateProgress = useMutation({
    mutationFn: async () => {
      if (isComplete) return;
      
      // For hydration or other countable challenges, increment progress
      const newProgress = reps 
        ? Math.min(100, Math.ceil((currentProgress + 13) * 100 / 100)) 
        : 100;
        
      await apiRequest('PATCH', `/api/challenges/${id}/progress`, { progress: newProgress });
      return newProgress;
    },
    onSuccess: (newProgress) => {
      setCurrentProgress(newProgress || 0);
      
      if (newProgress === 100) {
        completeChallenge.mutate();
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update challenge progress",
        variant: "destructive"
      });
    }
  });
  
  // Complete challenge
  const completeChallenge = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/challenges/${id}/complete`, {});
    },
    onSuccess: () => {
      toast({
        title: "Challenge Completed!",
        description: `You earned ${points} points!`,
        variant: "default"
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete challenge",
        variant: "destructive"
      });
    }
  });

  return (
    <Card className={cn("challenge-card bg-white rounded-2xl p-4 shadow-md", className)}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center mr-3", getCategoryColor(category))}>
            <i className={cn("text-white text-xl", getIconClass(icon))}></i>
          </div>
          <div>
            <h4 className="font-heading font-bold text-lg">{title}</h4>
            <span className="text-gray-600 text-sm">{getDescription()}</span>
          </div>
        </div>
        
        {isComplete ? (
          <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm">
            Done
          </div>
        ) : category === "Hydration" ? (
          <Button 
            onClick={handleAction}
            className={cn("px-4 py-2 rounded-xl font-bold text-sm border-2 border-violet-700", getCategoryColor(category))}
            disabled={updateProgress.isPending || completeChallenge.isPending}
          >
            {Math.floor(currentProgress * reps! / 100)}/{reps} cups
          </Button>
        ) : (
          <Button 
            onClick={handleAction}
            className={cn("px-4 py-2 rounded-xl font-bold text-sm border-2 border-violet-700", getCategoryColor(category))}
            disabled={updateProgress.isPending || completeChallenge.isPending}
          >
            {category === "Fitness" ? "Start" : "Log"}
          </Button>
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-primary to-secondary h-full rounded-full" 
          style={{ width: `${currentProgress}%` }}
        ></div>
      </div>
    </Card>
  );
}
