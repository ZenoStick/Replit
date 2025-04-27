import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkoutTimer } from "@/components/workout-timer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Challenge, Exercise } from "@shared/schema";

interface WorkoutPageProps {
  id: string;
}

export default function Workout({ id }: WorkoutPageProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  
  // Get challenge info
  const { data: challenge, isLoading } = useQuery<Challenge>({
    queryKey: [`/api/challenges/${id}`],
    queryFn: async () => {
      // If id is 0, this is a generic workout without a specific challenge
      if (id === "0") {
        return defaultChallenge;
      }
      
      const res = await fetch(`/api/challenges/${id}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch challenge");
      }
      
      return res.json();
    }
  });
  
  // Mock exercises for the workout
  const exercises: Exercise[] = [
    {
      id: 1,
      name: "Push-ups",
      description: "Complete 10 push-ups with proper form",
      instructions: [
        "Start in a plank position with hands shoulder-width apart",
        "Lower your body until your chest nearly touches the floor",
        "Push back up to the starting position"
      ],
      reps: 10,
      imageUrl: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=500&h=300&fit=crop"
    },
    {
      id: 2,
      name: "Squats",
      description: "Perform 15 squats",
      instructions: [
        "Stand with feet shoulder-width apart",
        "Lower your body as if sitting in a chair",
        "Keep your back straight and knees behind toes",
        "Return to standing position"
      ],
      reps: 15,
      imageUrl: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=500&h=300&fit=crop"
    },
    {
      id: 3,
      name: "Plank",
      description: "Hold a plank position for 30 seconds",
      instructions: [
        "Start in a push-up position, then lower onto forearms",
        "Keep your body in a straight line from head to heels",
        "Engage your core and hold the position"
      ],
      duration: 30,
      imageUrl: "https://images.unsplash.com/photo-1566241142559-40a9552bd7ad?w=500&h=300&fit=crop"
    },
    {
      id: 4,
      name: "Jumping Jacks",
      description: "Complete 20 jumping jacks",
      instructions: [
        "Stand with feet together and arms at sides",
        "Jump to spread legs and raise arms overhead",
        "Jump back to starting position"
      ],
      reps: 20,
      imageUrl: "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=500&h=300&fit=crop"
    }
  ];
  
  const defaultChallenge: Challenge = {
    id: 0,
    title: "Quick Workout",
    description: "A short full-body workout",
    category: "Fitness",
    icon: "dumbbell",
    points: 20,
    duration: 10,
    reps: null,
    isComplete: false,
    progress: 0,
    userId: 0
  };
  
  // Ensure this is always up-to-date by computing it inside the render
  const currentExercise = exercises[currentExerciseIndex];
  
  // Add effect to log exercise changes for debugging
  useEffect(() => {
    console.log("Exercise changed to:", currentExercise?.name, "Index:", currentExerciseIndex);
  }, [currentExerciseIndex, currentExercise?.name]);
  
  // Cleanup effect to cancel any pending timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);
  
  // Complete challenge mutation
  const completeChallenge = useMutation({
    mutationFn: async () => {
      if (id === "0") {
        // If it's a generic workout, just simulate completion
        return { success: true };
      }
      
      return await apiRequest("POST", `/api/challenges/${id}/complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: "Workout Complete!",
        description: `Great job! You've earned ${challenge?.points || 20} points.`,
        variant: "default"
      });
      
      setWorkoutComplete(true);
      
      // Automatically navigate back after 2 seconds
      setTimeout(() => {
        navigate("/home");
      }, 2000);
    },
    onError: (error) => {
      console.error("Error completing challenge:", error);
      toast({
        title: "Error",
        description: "Failed to complete workout. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Track if challenge completion has been triggered
  const [completionTriggered, setCompletionTriggered] = useState(false);
  
  // Better transition handling with refs
  const isTransitioning = useRef(false); 
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleExerciseComplete = useCallback(() => {
    console.log("Exercise complete called. Current index:", currentExerciseIndex, "Total exercises:", exercises.length);
    
    // Prevent duplicate calls during transition
    if (isTransitioning.current) {
      console.log("Already in transition, ignoring call");
      return;
    }
    
    // Set flag to prevent multiple transitions
    isTransitioning.current = true;
    
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    if (currentExerciseIndex < exercises.length - 1) {
      console.log("Moving to next exercise");
      
      // Delay the transition slightly for better UX
      transitionTimeoutRef.current = setTimeout(() => {
        // Update exercise index  
        setCurrentExerciseIndex(prev => {
          console.log("Incrementing exercise index from", prev, "to", prev + 1);
          return prev + 1;
        });
        
        // Reset transition flag after another delay to prevent rapid triggers
        transitionTimeoutRef.current = setTimeout(() => {
          isTransitioning.current = false;
          console.log("Reset transition flag, ready for next exercise");
        }, 500);
      }, 300);
      
    } else if (!completionTriggered && !workoutComplete) {
      console.log("Completing the entire workout");
      setCompletionTriggered(true);
      
      transitionTimeoutRef.current = setTimeout(() => {
        completeChallenge.mutate();
        isTransitioning.current = false;
      }, 300);
    } else {
      // Reset flag if we're not doing anything
      isTransitioning.current = false;
    }
  }, [currentExerciseIndex, exercises.length, completionTriggered, workoutComplete, completeChallenge]);
  
  // Page animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0 }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  if (isLoading) {
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
      exit="exit"
    >
      <motion.div className="flex items-center mb-6" variants={itemVariants}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/home")}
          className="mr-4"
        >
          <i className="fas fa-arrow-left text-xl"></i>
        </Button>
        <h2 className="font-heading font-bold text-2xl">{challenge?.title}</h2>
      </motion.div>
      
      <AnimatePresence mode="wait">
        {workoutComplete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <div className="bg-primary text-white rounded-full p-8 mb-6">
              <i className="fas fa-check text-5xl"></i>
            </div>
            <h3 className="font-heading font-bold text-2xl text-primary mb-2">Workout Complete!</h3>
            <p className="text-gray-600 mb-4">
              Great job! You've earned {challenge?.points || 20} points.
            </p>
            <p className="text-sm text-gray-500">Returning to home screen...</p>
          </motion.div>
        ) : (
          <motion.div
            key="exercise"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex-1 flex flex-col"
          >
            <Card className="bg-white rounded-3xl shadow-md p-5 mb-6">
              <CardContent className="p-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-heading font-bold text-xl">Exercise {currentExerciseIndex + 1} of {exercises.length}</h3>
                  <span className="text-primary font-bold">{challenge?.points || 20} points</span>
                </div>
                
                <div className="rounded-2xl bg-gray-100 overflow-hidden mb-4">
                  <img 
                    src={currentExercise.imageUrl} 
                    alt={`${currentExercise.name} demonstration`} 
                    className="w-full h-48 object-cover"
                  />
                </div>
                
                <h4 className="font-heading font-bold text-lg mb-1">{currentExercise.name}</h4>
                <p className="text-gray-600 text-sm mb-4">{currentExercise.description}</p>
                
                <div className="bg-primary bg-opacity-10 p-4 rounded-xl mb-4">
                  <h5 className="font-bold text-primary mb-2">Instructions</h5>
                  <ul className="text-gray-700 text-sm space-y-2">
                    {currentExercise.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start">
                        <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-xs mr-2 mt-0.5">
                          {index + 1}
                        </span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <WorkoutTimer
                  key={`exercise-${currentExerciseIndex}`}
                  initialSeconds={currentExercise.duration || 60}
                  initialReps={0}
                  targetReps={currentExercise.reps || 0}
                  countReps={!!currentExercise.reps}
                  onComplete={handleExerciseComplete}
                  className="mb-6"
                />
              </CardContent>
            </Card>
            
            <h3 className="font-heading font-bold text-lg mb-4">Coming Up Next</h3>
            
            <div className="space-y-3 mb-20">
              {exercises.slice(currentExerciseIndex + 1).map((exercise, index) => (
                <div key={exercise.id} className="flex items-center bg-white rounded-xl p-3 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <span className="font-bold">{currentExerciseIndex + index + 2}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{exercise.name}</h4>
                    <span className="text-xs text-gray-600">
                      {exercise.reps 
                        ? `${exercise.reps} reps` 
                        : exercise.duration 
                          ? `${exercise.duration} seconds` 
                          : ""}
                    </span>
                  </div>
                </div>
              ))}
              
              {currentExerciseIndex === exercises.length - 1 && (
                <div className="flex items-center bg-white rounded-xl p-3 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <i className="fas fa-flag-checkered"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Finish Workout</h4>
                    <span className="text-xs text-gray-600">Almost there!</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
