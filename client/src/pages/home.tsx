import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChallengeCard } from "@/components/challenge-card";
import { useToast } from "@/hooks/use-toast";
import { User, Challenge } from "@shared/schema";

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Get user data
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/user']
  });
  
  // Get challenges
  const { data: challenges, isLoading: isChallengesLoading } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges']
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
  
  const handleStartWorkout = (challengeId: number) => {
    navigate(`/workout/${challengeId}`);
  };
  
  if (isUserLoading || isChallengesLoading) {
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
      <motion.div className="flex justify-between items-center mb-6" variants={itemVariants}>
        <div>
          <h2 className="font-heading font-bold text-2xl">Hey, {user?.username}! 👋</h2>
          <p className="text-gray-600">Let's crush today's goals!</p>
        </div>
        <div className="relative">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={`https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop`} alt="Profile" />
            <AvatarFallback>{user?.username?.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-energy rounded-full text-xs flex items-center justify-center font-bold border-2 border-white">
            {user?.level}
          </span>
        </div>
      </motion.div>
      
      {/* Streak Section */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white rounded-3xl shadow-md p-5 mb-6">
          <CardContent className="p-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-heading font-bold text-lg">Current Streak</h3>
              <span className="text-xs bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-full font-medium">Personal Best</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                  <i className="fas fa-fire text-white text-2xl"></i>
                </div>
                <div className="ml-4">
                  <span className="block font-heading font-extrabold text-3xl text-primary">{user?.streakDays}</span>
                  <span className="text-gray-600 text-sm">days in a row</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-heading font-bold text-xl text-accent">{user?.points}</div>
                <span className="text-gray-600 text-sm">total points</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Today's Challenges */}
      <motion.h3 className="font-heading font-bold text-xl mb-4" variants={itemVariants}>
        Today's Challenges
      </motion.h3>
      
      <motion.div className="space-y-4 mb-6 overflow-y-auto flex-1" variants={itemVariants}>
        {challenges?.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            id={challenge.id}
            title={challenge.title}
            description={challenge.description}
            category={challenge.category}
            icon={challenge.icon}
            points={challenge.points}
            duration={challenge.duration}
            reps={challenge.reps}
            isComplete={challenge.isComplete}
            progress={challenge.progress}
            onStart={() => handleStartWorkout(challenge.id)}
          />
        ))}
        
        {challenges?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No challenges available. Check back later!</p>
          </div>
        )}
      </motion.div>
      
      {/* Daily Spin Banner */}
      <motion.div 
        className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-4 flex items-center justify-between mb-20"
        variants={itemVariants}
      >
        <div>
          <h3 className="font-heading font-bold text-white text-lg">Daily Spin Available!</h3>
          <p className="text-white text-opacity-90 text-sm">Spin to win bonus rewards</p>
        </div>
        <Button
          onClick={() => navigate("/spin")}
          className="bg-white text-primary px-4 py-2 rounded-xl font-bold"
        >
          Spin Now
        </Button>
      </motion.div>
    </motion.div>
  );
}
