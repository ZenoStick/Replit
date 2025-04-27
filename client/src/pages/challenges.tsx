import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChallengeCard } from "@/components/challenge-card";
import { useLocation } from "wouter";
import { User, Challenge } from "@shared/schema";

export default function Challenges() {
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Get user data
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/user']
  });
  
  // Get challenges
  const { data: challenges, isLoading: isChallengesLoading } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges']
  });
  
  // Get leaderboard
  const { data: leaderboard, isLoading: isLeaderboardLoading } = useQuery<User[]>({
    queryKey: ['/api/leaderboard']
  });
  
  const categories = ["All", "Fitness", "Nutrition", "Mindfulness", "Sleep"];
  
  // Filter challenges by category
  const filteredChallenges = challenges?.filter(challenge => 
    activeCategory === "All" || challenge.category === activeCategory
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
  
  if (isUserLoading || isChallengesLoading || isLeaderboardLoading) {
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
      <motion.h2 className="font-heading font-bold text-2xl mb-6" variants={itemVariants}>
        Challenges
      </motion.h2>
      
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
      
      {/* Weekend Challenge */}
      <motion.div 
        className="bg-gradient-to-r from-accent to-primary rounded-2xl p-5 mb-6 relative overflow-hidden"
        variants={itemVariants}
      >
        <div className="absolute -right-6 -top-6 bg-white bg-opacity-10 h-24 w-24 rounded-full"></div>
        <div className="absolute -right-2 -bottom-2 bg-white bg-opacity-10 h-16 w-16 rounded-full"></div>
        
        <div className="relative">
          <span className="bg-energy text-dark px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block">WEEKEND SPECIAL</span>
          <h3 className="font-heading font-bold text-white text-xl mb-1">Team Challenge</h3>
          <p className="text-white text-opacity-90 mb-3">Join forces with friends to complete 1000 push-ups</p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white text-opacity-80 text-sm">Ends in 32 hours</span>
            </div>
            <Button className="bg-white text-primary px-4 py-2 rounded-xl font-bold">
              Join Now
            </Button>
          </div>
        </div>
      </motion.div>
      
      {/* Challenge Categories */}
      <motion.div className="grid grid-cols-2 gap-4 mb-6" variants={itemVariants}>
        <Card className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center">
          <div className="h-14 w-14 rounded-full bg-nature flex items-center justify-center mb-3">
            <i className="fas fa-dumbbell text-white text-xl"></i>
          </div>
          <h4 className="font-heading font-bold text-center">Fitness</h4>
          <p className="text-gray-600 text-xs text-center">12 challenges</p>
        </Card>
        
        <Card className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center">
          <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-3">
            <i className="fas fa-glass-water text-white text-xl"></i>
          </div>
          <h4 className="font-heading font-bold text-center">Hydration</h4>
          <p className="text-gray-600 text-xs text-center">5 challenges</p>
        </Card>
        
        <Card className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center">
          <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center mb-3">
            <i className="fas fa-brain text-white text-xl"></i>
          </div>
          <h4 className="font-heading font-bold text-center">Mindfulness</h4>
          <p className="text-gray-600 text-xs text-center">8 challenges</p>
        </Card>
        
        <Card className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center">
          <div className="h-14 w-14 rounded-full bg-energy flex items-center justify-center mb-3">
            <i className="fas fa-utensils text-white text-xl"></i>
          </div>
          <h4 className="font-heading font-bold text-center">Nutrition</h4>
          <p className="text-gray-600 text-xs text-center">10 challenges</p>
        </Card>
      </motion.div>
      
      {/* Leaderboard Preview */}
      <motion.h3 className="font-heading font-bold text-xl mb-4" variants={itemVariants}>
        Leaderboard
      </motion.h3>
      
      <motion.div variants={itemVariants}>
        <Card className="bg-white rounded-2xl p-5 shadow-md mb-20">
          <CardContent className="p-0">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">This Week's Top Performers</span>
              <a href="#" className="text-primary font-medium text-sm">View All</a>
            </div>
            
            <div className="space-y-4">
              {leaderboard?.slice(0, 3).map((leaderUser, index) => {
                const isCurrentUser = leaderUser.id === user?.id;
                
                return (
                  <div 
                    key={leaderUser.id}
                    className={`flex items-center ${isCurrentUser ? "bg-gray-100 rounded-xl p-2" : ""}`}
                  >
                    <div className={`h-8 w-8 rounded-full text-white flex items-center justify-center font-bold text-sm mr-3 ${
                      index === 0 ? "bg-primary" : index === 1 ? "bg-secondary" : "bg-accent"
                    }`}>
                      {index + 1}
                    </div>
                    
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={`https://images.unsplash.com/photo-1${530000000 + leaderUser.id * 100}?w=50&h=50&fit=crop`} alt={leaderUser.username} />
                      <AvatarFallback>{leaderUser.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{isCurrentUser ? "You" : `${leaderUser.username.split(' ')[0]} ${leaderUser.username.split(' ')[1]?.charAt(0) || ''}.`}</h4>
                      <div className="flex items-center">
                        <i className="fas fa-fire-flame-curved text-xs text-energy mr-1"></i>
                        <span className="text-xs text-gray-600">{leaderUser.streakDays} day streak</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="font-bold text-primary">{leaderUser.points}</span>
                      <span className="text-xs text-gray-600 block">points</span>
                    </div>
                  </div>
                );
              })}
              
              {!isCurrentUser(user, leaderboard?.slice(0, 3)) && (
                <div className="flex items-center bg-gray-100 rounded-xl p-2">
                  <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm mr-3">
                    {getUserRank(user, leaderboard)}
                  </div>
                  
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=50&h=50&fit=crop" alt={user?.username} />
                    <AvatarFallback>{user?.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">You</h4>
                    <div className="flex items-center">
                      <i className="fas fa-fire-flame-curved text-xs text-energy mr-1"></i>
                      <span className="text-xs text-gray-600">{user?.streakDays} day streak</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="font-bold text-primary">{user?.points}</span>
                    <span className="text-xs text-gray-600 block">points</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Helper functions
function isCurrentUser(user: User | undefined, leaders: User[] | undefined): boolean {
  if (!user || !leaders) return false;
  return leaders.some(leader => leader.id === user.id);
}

function getUserRank(user: User | undefined, leaderboard: User[] | undefined): number {
  if (!user || !leaderboard) return 0;
  return leaderboard.findIndex(leader => leader.id === user.id) + 1;
}
