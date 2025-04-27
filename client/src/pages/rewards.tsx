import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RewardItem } from "@/components/reward-item";
import { useToast } from "@/hooks/use-toast";
import { User, Reward } from "@shared/schema";

export default function Rewards() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("All Rewards");
  
  // Get user data
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/user']
  });
  
  // Get rewards
  const { data: rewards, isLoading: isRewardsLoading } = useQuery<Reward[]>({
    queryKey: ['/api/rewards']
  });
  
  // Get user's redeemed rewards
  const { data: userRewards, isLoading: isUserRewardsLoading } = useQuery<Reward[]>({
    queryKey: ['/api/user/rewards']
  });
  
  const categories = ["All Rewards", "Digital", "Avatar", "Real World"];
  
  // Filter rewards by category
  const filteredRewards = rewards?.filter(reward => 
    activeCategory === "All Rewards" || reward.category === activeCategory
  );
  
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
  
  const handleRedeem = () => {
    // This is handled in the RewardItem component
  };
  
  if (isUserLoading || isRewardsLoading || isUserRewardsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-light p-6 pb-20 min-h-screen flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h2 className="font-heading font-bold text-2xl mb-2">Rewards Shop</h2>
        <div className="flex items-center mb-6">
          <i className="fas fa-coin text-energy mr-2"></i>
          <span className="font-bold text-lg">{user?.points || 0} points available</span>
        </div>
      </motion.div>
      
      <motion.div className="mb-6" variants={itemVariants}>
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              className={`whitespace-nowrap font-medium ${
                activeCategory === category ? "bg-primary text-white" : "bg-white text-gray-600"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </motion.div>
      
      {/* Featured Reward */}
      <motion.div 
        className="bg-gradient-to-r from-secondary to-primary rounded-2xl p-5 mb-6 relative overflow-hidden"
        variants={itemVariants}
      >
        <div className="absolute -right-10 -top-10 bg-white bg-opacity-10 h-32 w-32 rounded-full"></div>
        <div className="absolute -left-8 -bottom-8 bg-white bg-opacity-10 h-24 w-24 rounded-full"></div>
        
        <div className="relative">
          <span className="bg-energy text-dark px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block">LIMITED TIME</span>
          <div className="flex items-center mb-3">
            <div className="w-16 h-16 rounded-xl bg-white p-2 mr-4 flex items-center justify-center">
              <i className="fas fa-headphones text-primary text-2xl"></i>
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-xl">Wireless Earbuds</h3>
              <p className="text-white text-opacity-90">Perfect for your workouts</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-coin text-energy mr-2"></i>
              <span className="text-white font-bold">750 points</span>
            </div>
            <Button 
              className="bg-white text-primary px-4 py-2 rounded-xl font-bold"
              onClick={() => {
                if ((user?.points || 0) < 750) {
                  toast({
                    title: "Not Enough Points",
                    description: "You need more points to redeem this reward.",
                    variant: "destructive"
                  });
                  return;
                }
                
                toast({
                  title: "Coming Soon",
                  description: "This premium reward will be available soon!",
                  variant: "default"
                });
              }}
            >
              Redeem
            </Button>
          </div>
        </div>
      </motion.div>
      
      {/* Rewards Grid */}
      <motion.h3 className="font-heading font-bold text-xl mb-4" variants={itemVariants}>
        Popular Rewards
      </motion.h3>
      
      <motion.div className="grid grid-cols-2 gap-4 mb-20" variants={itemVariants}>
        {filteredRewards?.map((reward) => (
          <RewardItem
            key={reward.id}
            id={reward.id}
            title={reward.title}
            description={reward.description}
            category={reward.category}
            icon={reward.icon}
            pointsCost={reward.pointsCost}
            userPoints={user?.points || 0}
            onRedeem={handleRedeem}
          />
        ))}
        
        {filteredRewards?.length === 0 && (
          <div className="col-span-2 text-center py-8 text-gray-500">
            <p>No rewards available in this category.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
