import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SpinWheel } from "@/components/ui/spin-wheel";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, SpinResult } from "@shared/schema";

export default function Spin() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [spinResult, setSpinResult] = useState<{reward: string, points: number} | null>(null);
  
  // Get user data
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/user']
  });
  
  // Get spin history to determine if user can spin today
  const { data: spinData, isLoading: isSpinDataLoading } = useQuery({
    queryKey: ['/api/spins'],
    refetchOnWindowFocus: false
  });
  
  // Spin wheel rewards
  const spinRewards = [
    { id: 1, label: "+50", value: 50, color: "#5E17EB" },
    { id: 2, label: "Surprise", value: "surprise", color: "#00D9D9" },
    { id: 3, label: "+100", value: 100, color: "#FF427F" },
    { id: 4, label: "Avatar", value: "avatar", color: "#FFD600" },
    { id: 5, label: "+20", value: 20, color: "#4CD964" },
    { id: 6, label: "+75", value: 75, color: "#5E17EB" },
    { id: 7, label: "Badge", value: "badge", color: "#00D9D9" },
    { id: 8, label: "+30", value: 30, color: "#FF427F" }
  ];
  
  // Spin the wheel
  const spin = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/spins", {});
      return res.json();
    },
    onSuccess: (data: SpinResult) => {
      setSpinResult({
        reward: data.reward,
        points: data.points || 0
      });
      
      let rewardMessage = "You won a special reward!";
      
      if (data.reward === "points") {
        rewardMessage = `You won ${data.points} points!`;
      } else if (data.reward === "avatar") {
        rewardMessage = "You won a new avatar item!";
      } else if (data.reward === "surprise") {
        rewardMessage = "You won a surprise gift!";
      }
      
      setTimeout(() => {
        toast({
          title: "Congratulations!",
          description: rewardMessage,
          variant: "default"
        });
      }, 4500); // Show after spin animation completes
      
      queryClient.invalidateQueries({ queryKey: ['/api/spins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      console.error("Spin error:", error);
      toast({
        title: "Error",
        description: "Failed to spin the wheel. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleSpinComplete = (reward: any) => {
    // The actual reward result comes from the API, not the visual wheel
    console.log("Spin animation completed");
  };
  
  // Page animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  if (isUserLoading || isSpinDataLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-gradient-to-br from-primary to-accent p-6 pb-20 min-h-screen flex flex-col items-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="flex items-center justify-between w-full mb-8" variants={itemVariants}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/home")}
          className="bg-white bg-opacity-20 h-10 w-10 rounded-full flex items-center justify-center"
        >
          <i className="fas fa-arrow-left text-white"></i>
        </Button>
        <h2 className="font-heading font-bold text-2xl text-white">Daily Spin</h2>
        <div className="h-10 w-10"></div>
      </motion.div>
      
      <motion.div 
        className="bg-white bg-opacity-10 rounded-3xl p-6 flex flex-col items-center w-full max-w-md"
        variants={itemVariants}
      >
        <h3 className="font-heading font-bold text-xl text-white mb-1">Spin to Win!</h3>
        <p className="text-white text-opacity-90 text-center mb-6">One free spin daily - collect points and surprises</p>
        
        <SpinWheel
          rewards={spinRewards}
          onSpinComplete={handleSpinComplete}
          canSpin={spinData?.canSpinToday || false}
          className="mb-6"
        />
        
        <Button
          onClick={() => spin.mutate()}
          disabled={spin.isPending || !spinData?.canSpinToday}
          className="bg-white text-primary py-3 px-8 rounded-xl font-bold text-lg shadow-lg hover:bg-opacity-90 transition-all"
        >
          {spin.isPending 
            ? "Spinning..." 
            : spinData?.canSpinToday 
              ? "Spin Now" 
              : "Spin Again Tomorrow"}
        </Button>
      </motion.div>
      
      <motion.div className="mt-6" variants={itemVariants}>
        <h4 className="text-white font-medium mb-2 text-center">Possible Rewards</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center mb-1">
              <span className="font-bold text-primary">+50</span>
            </div>
            <span className="text-xs text-white">Points</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center mb-1">
              <i className="fas fa-gift text-primary text-lg"></i>
            </div>
            <span className="text-xs text-white">Surprise</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center mb-1">
              <i className="fas fa-shirt text-primary text-lg"></i>
            </div>
            <span className="text-xs text-white">Avatar</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center mb-1">
              <span className="font-bold text-primary">+100</span>
            </div>
            <span className="text-xs text-white">Points</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
