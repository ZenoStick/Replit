import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BadgeItem } from "@/components/badge-item";
import { BMICalculator } from "@/components/bmi-calculator";
import { User, Achievement } from "@shared/schema";
import { truncateText } from "@/lib/utils";

export default function Profile() {
  // Get user data
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/user']
  });
  
  // Get achievements
  const { data: achievements, isLoading: isAchievementsLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements']
  });
  
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
  
  // Mock badges data for visual design
  const badges = [
    {
      id: 1,
      title: "Streak Master",
      icon: "fire",
      color: "energy",
      secondaryColor: "orange-500"
    },
    {
      id: 2,
      title: "Push-up Pro",
      icon: "dumbbell",
      color: "primary",
      secondaryColor: "secondary"
    },
    {
      id: 3,
      title: "Hydration Hero",
      icon: "glass-water",
      color: "nature",
      secondaryColor: "green-300"
    },
    {
      id: 4,
      title: "Mindful Mind",
      icon: "brain",
      color: "accent",
      secondaryColor: "pink-300"
    }
  ];
  
  // Calculate level progress
  const calculateLevelProgress = () => {
    if (!user) return 0;
    
    const currentLevelPoints = (user.level - 1) * 100;
    const nextLevelPoints = user.level * 100;
    const pointsInCurrentLevel = user.points - currentLevelPoints;
    const pointsNeededForLevel = nextLevelPoints - currentLevelPoints;
    
    return Math.min(100, Math.floor((pointsInCurrentLevel / pointsNeededForLevel) * 100));
  };
  
  // Points needed for next level
  const pointsToNextLevel = () => {
    if (!user) return 0;
    
    const nextLevelPoints = user.level * 100;
    return nextLevelPoints - user.points;
  };
  
  if (isUserLoading || isAchievementsLoading) {
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
        My Profile
      </motion.h2>
      
      <motion.div variants={itemVariants}>
        <Card className="bg-white rounded-3xl shadow-md p-5 mb-6">
          <CardContent className="p-0">
            <div className="flex items-center mb-4">
              <div className="relative mr-4">
                <Avatar className="h-20 w-20 border-4 border-primary">
                  <AvatarImage src={`https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop`} alt="Profile" />
                  <AvatarFallback>{user?.username?.charAt(0)}</AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 bg-primary text-white h-8 w-8 rounded-full flex items-center justify-center">
                  <i className="fas fa-camera text-sm"></i>
                </button>
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl">{user?.username}</h3>
                <p className="text-gray-600">Level {user?.level} Athlete</p>
                <div className="flex items-center mt-1">
                  <i className="fas fa-fire text-energy mr-1"></i>
                  <span className="text-sm">{user?.streakDays} day streak</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Level Progress</span>
                <span className="text-sm text-primary font-bold">Level {(user?.level || 1) + 1} in {pointsToNextLevel()} pts</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-3 mb-1">
                <div 
                  className="bg-primary rounded-full h-3" 
                  style={{ width: `${calculateLevelProgress()}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Stats Section */}
      <motion.h3 className="font-heading font-bold text-xl mb-4" variants={itemVariants}>
        My Stats
      </motion.h3>
      
      <motion.div className="grid grid-cols-2 gap-4 mb-6" variants={itemVariants}>
        <Card className="bg-white rounded-2xl p-4 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center mb-1">
              <div className="h-10 w-10 rounded-full bg-nature flex items-center justify-center mr-3">
                <i className="fas fa-dumbbell text-white text-sm"></i>
              </div>
              <span className="font-medium">Workouts</span>
            </div>
            <h4 className="font-heading font-bold text-2xl">28</h4>
            <p className="text-gray-600 text-xs">Completed this month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white rounded-2xl p-4 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center mb-1">
              <div className="h-10 w-10 rounded-full bg-energy flex items-center justify-center mr-3">
                <i className="fas fa-bolt text-white text-sm"></i>
              </div>
              <span className="font-medium">Points</span>
            </div>
            <h4 className="font-heading font-bold text-2xl">{user?.points}</h4>
            <p className="text-gray-600 text-xs">Total earned</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white rounded-2xl p-4 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center mb-1">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mr-3">
                <i className="fas fa-trophy text-white text-sm"></i>
              </div>
              <span className="font-medium">Challenges</span>
            </div>
            <h4 className="font-heading font-bold text-2xl">
              {achievements?.length || 0}
            </h4>
            <p className="text-gray-600 text-xs">Total completed</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white rounded-2xl p-4 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center mb-1">
              <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center mr-3">
                <i className="fas fa-medal text-white text-sm"></i>
              </div>
              <span className="font-medium">Achievements</span>
            </div>
            <h4 className="font-heading font-bold text-2xl">{badges.length}</h4>
            <p className="text-gray-600 text-xs">Badges earned</p>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Badges and Health Sections */}
      <motion.div className="mb-6" variants={itemVariants}>
        <Tabs defaultValue="badges" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4 border-2 border-violet-700">
            <TabsTrigger value="badges">My Badges</TabsTrigger>
            <TabsTrigger value="bmi">BMI Calculator</TabsTrigger>
            <TabsTrigger value="customize">Customize</TabsTrigger>
          </TabsList>
          
          <TabsContent value="badges">
            <motion.div className="grid grid-cols-4 gap-3" variants={itemVariants}>
              {badges.map((badge) => (
                <BadgeItem
                  key={badge.id}
                  title={badge.title}
                  icon={badge.icon}
                  color={badge.color}
                  secondaryColor={badge.secondaryColor}
                />
              ))}
            </motion.div>
          </TabsContent>
          
          <TabsContent value="bmi">
            <BMICalculator className="w-full" />
          </TabsContent>
          
          <TabsContent value="customize">
            <Card className="border-2 border-violet-700">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-3">Profile Customization</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Choose Avatar</h4>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6].map((id) => (
                        <button
                          key={id}
                          className="rounded-full w-14 h-14 overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                        >
                          <img 
                            src={`https://images.unsplash.com/photo-1${530000000 + id * 100}?w=56&h=56&fit=crop`}
                            alt={`Avatar option ${id}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Fitness Goals</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {["Weight Loss", "Muscle Gain", "Endurance", "Flexibility", "General Fitness", "Sports Performance"].map((goal) => (
                        <Button 
                          key={goal}
                          variant="outline"
                          className="border-2 border-gray-200 hover:border-primary"
                        >
                          {goal}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Theme Color</h4>
                    <div className="flex gap-2">
                      {["bg-primary", "bg-accent", "bg-secondary", "bg-nature", "bg-energy"].map((color) => (
                        <button
                          key={color}
                          className={`${color} w-8 h-8 rounded-full border-2 border-gray-200 hover:border-black`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <Button className="w-full bg-primary text-white border-2 border-violet-700">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
      
      {/* Settings Section */}
      <motion.div className="space-y-3 mb-20" variants={itemVariants}>
        <a href="#" className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <i className="fas fa-gear text-gray-500"></i>
            </div>
            <span className="font-medium">Settings</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400"></i>
        </a>
        
        <a href="#" className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <i className="fas fa-bell text-gray-500"></i>
            </div>
            <span className="font-medium">Notifications</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400"></i>
        </a>
        
        <a href="#" className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <i className="fas fa-user-group text-gray-500"></i>
            </div>
            <span className="font-medium">Friends</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400"></i>
        </a>
        
        <a href="#" className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <i className="fas fa-circle-question text-gray-500"></i>
            </div>
            <span className="font-medium">Help & Support</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400"></i>
        </a>
      </motion.div>
    </motion.div>
  );
}
