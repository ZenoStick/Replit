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
  
  // Categorized exercises by difficulty level
  const exercisesByLevel = {
    beginner: [
      {
        id: 1,
        name: "Modified Push-ups",
        description: "Complete 8 push-ups from knees with proper form",
        instructions: [
          "Start in a modified plank position with knees on the ground",
          "Lower your chest toward the floor while maintaining a straight back",
          "Push back up to the starting position",
          "Focus on quality over quantity"
        ],
        reps: 8,
        difficultyLevel: 'beginner',
        caloriesBurnedPerMinute: 3,
        imageUrl: "/assets/workouts/beginner-workout.svg"
      },
      {
        id: 2,
        name: "Bodyweight Squats",
        description: "Perform 12 slow bodyweight squats",
        instructions: [
          "Stand with feet shoulder-width apart",
          "Lower your body as if sitting in a chair to a comfortable depth",
          "Keep your back straight and knees tracking over toes",
          "Return to standing position"
        ],
        reps: 12,
        difficultyLevel: 'beginner',
        caloriesBurnedPerMinute: 5,
        imageUrl: "/assets/workouts/beginner-workout.svg"
      },
      {
        id: 3,
        name: "Basic Plank",
        description: "Hold a plank position for 20 seconds",
        instructions: [
          "Start in a push-up position, then lower onto forearms",
          "Keep your body in a straight line from head to heels",
          "Engage your core and hold the position",
          "Focus on proper form over duration"
        ],
        duration: 20,
        difficultyLevel: 'beginner',
        caloriesBurnedPerMinute: 4,
        imageUrl: "/assets/workouts/beginner-workout.svg"
      },
      {
        id: 4,
        name: "Marching in Place",
        description: "Complete 30 seconds of marching in place",
        instructions: [
          "Stand tall with good posture",
          "Lift knees to hip level alternately",
          "Swing arms naturally as you march",
          "Keep a steady, comfortable pace"
        ],
        duration: 30,
        difficultyLevel: 'beginner',
        caloriesBurnedPerMinute: 6,
        imageUrl: "/assets/workouts/beginner-workout.svg"
      }
    ],
    intermediate: [
      {
        id: 5,
        name: "Standard Push-ups",
        description: "Complete 12 full push-ups with proper form",
        instructions: [
          "Start in a plank position with hands slightly wider than shoulder-width",
          "Lower your body until your chest nearly touches the floor",
          "Keep elbows at a 45-degree angle to your body",
          "Push back up to the starting position"
        ],
        reps: 12,
        difficultyLevel: 'intermediate',
        caloriesBurnedPerMinute: 7,
        imageUrl: "/assets/workouts/intermediate-workout.svg"
      },
      {
        id: 6,
        name: "Jump Squats",
        description: "Perform 15 jump squats with control",
        instructions: [
          "Stand with feet shoulder-width apart",
          "Lower into a squat position",
          "Explosively jump upward",
          "Land softly and immediately lower into the next squat"
        ],
        reps: 15,
        difficultyLevel: 'intermediate',
        caloriesBurnedPerMinute: 10,
        imageUrl: "/assets/workouts/intermediate-workout.svg"
      },
      {
        id: 7,
        name: "Side Plank",
        description: "Hold a side plank for 30 seconds each side",
        instructions: [
          "Lie on your side with legs extended",
          "Prop your upper body up on your forearm",
          "Raise hips to create a straight line from head to feet",
          "Hold position, then switch sides"
        ],
        duration: 60, // 30 seconds per side
        difficultyLevel: 'intermediate',
        caloriesBurnedPerMinute: 6,
        imageUrl: "/assets/workouts/intermediate-workout.svg"
      },
      {
        id: 8,
        name: "Mountain Climbers",
        description: "Complete 45 seconds of mountain climbers",
        instructions: [
          "Start in a plank position with arms straight",
          "Alternately drive knees toward chest in a running motion",
          "Keep hips low and core engaged",
          "Maintain a brisk, controlled pace"
        ],
        duration: 45,
        difficultyLevel: 'intermediate',
        caloriesBurnedPerMinute: 12,
        imageUrl: "/assets/workouts/intermediate-workout.svg"
      }
    ],
    advanced: [
      {
        id: 9,
        name: "Plyometric Push-ups",
        description: "Complete 10 explosive push-ups with hand clap",
        instructions: [
          "Start in standard push-up position",
          "Lower your body toward the floor",
          "Push up explosively so hands leave the ground",
          "Clap hands in mid-air if possible before landing"
        ],
        reps: 10,
        difficultyLevel: 'advanced',
        caloriesBurnedPerMinute: 12,
        imageUrl: "/assets/workouts/advanced-workout.svg"
      },
      {
        id: 10,
        name: "Pistol Squats",
        description: "Perform 8 pistol squats (single-leg squats) per leg",
        instructions: [
          "Stand on one leg, extending the other leg forward",
          "Lower your body while keeping the extended leg off the ground",
          "Maintain balance as you lower to a full squat position",
          "Return to standing using just one leg, then switch sides"
        ],
        reps: 16, // 8 per leg
        difficultyLevel: 'advanced',
        caloriesBurnedPerMinute: 11,
        imageUrl: "/assets/workouts/advanced-workout.svg"
      },
      {
        id: 11,
        name: "Hollow Body Hold",
        description: "Hold hollow body position for 45 seconds",
        instructions: [
          "Lie on your back with arms extended overhead",
          "Lift shoulders and legs off the ground",
          "Create a curved shape with your body",
          "Hold position while keeping lower back pressed into the floor"
        ],
        duration: 45,
        difficultyLevel: 'advanced',
        caloriesBurnedPerMinute: 8,
        imageUrl: "/assets/workouts/advanced-workout.svg"
      },
      {
        id: 12,
        name: "Burpees",
        description: "Complete 15 full burpees with push-up",
        instructions: [
          "Begin standing, then squat and place hands on floor",
          "Jump feet back to plank position",
          "Perform a push-up",
          "Jump feet forward to hands, then explosively jump up with arms overhead"
        ],
        reps: 15,
        difficultyLevel: 'advanced',
        caloriesBurnedPerMinute: 15,
        imageUrl: "/assets/workouts/advanced-workout.svg"
      }
    ]
  };

  // Default to beginner exercises
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  
  // Get exercises based on selected difficulty
  const exercises = exercisesByLevel[difficultyLevel];
  
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
      <motion.div className="flex items-center mb-4" variants={itemVariants}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/home")}
          className="mr-4 border-2 border-violet-700"
        >
          <i className="fas fa-arrow-left text-xl"></i>
        </Button>
        <h2 className="font-heading font-bold text-2xl">{challenge?.title}</h2>
      </motion.div>
      
      <motion.div className="flex flex-wrap gap-2 mb-6 overflow-x-auto" variants={itemVariants}>
        <Button
          onClick={() => setDifficultyLevel('beginner')}
          className={`px-4 py-1 rounded-full text-sm font-medium border-2 ${
            difficultyLevel === 'beginner' 
              ? 'bg-green-500 border-violet-700 text-white' 
              : 'bg-white border-green-500 text-green-500'
          }`}
        >
          Beginner
        </Button>
        <Button
          onClick={() => setDifficultyLevel('intermediate')}
          className={`px-4 py-1 rounded-full text-sm font-medium border-2 ${
            difficultyLevel === 'intermediate' 
              ? 'bg-yellow-500 border-violet-700 text-white' 
              : 'bg-white border-yellow-500 text-yellow-500'
          }`}
        >
          Intermediate
        </Button>
        <Button
          onClick={() => setDifficultyLevel('advanced')}
          className={`px-4 py-1 rounded-full text-sm font-medium border-2 ${
            difficultyLevel === 'advanced' 
              ? 'bg-red-500 border-violet-700 text-white' 
              : 'bg-white border-red-500 text-red-500'
          }`}
        >
          Advanced
        </Button>
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
                
                <div className="rounded-2xl bg-gray-100 overflow-hidden mb-4 border-2 border-violet-700">
                  <img 
                    src={currentExercise.imageUrl} 
                    alt={`${currentExercise.name} demonstration`} 
                    className="w-full h-48 sm:h-64 object-contain"
                  />
                </div>
                
                <h4 className="font-heading font-bold text-xl md:text-2xl mb-2 text-primary">{currentExercise.name}</h4>
                <p className="text-gray-700 text-sm md:text-base mb-5">{currentExercise.description}</p>
                
                <div className="bg-primary bg-opacity-10 p-4 rounded-xl mb-4">
                  <h5 className="font-bold text-primary mb-3">Instructions</h5>
                  <ul className="text-gray-700 text-sm md:text-base space-y-3">
                    {currentExercise.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start">
                        <span className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="leading-relaxed">{instruction}</span>
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
                  difficultyLevel={
                    (currentExercise.difficultyLevel === 'beginner' || 
                     currentExercise.difficultyLevel === 'intermediate' || 
                     currentExercise.difficultyLevel === 'advanced') 
                      ? currentExercise.difficultyLevel 
                      : difficultyLevel
                  }
                  caloriesBurnedPerMinute={currentExercise.caloriesBurnedPerMinute || 5}
                  onComplete={handleExerciseComplete}
                  className="mb-6 border-2 border-violet-700 rounded-xl p-4"
                />
              </CardContent>
            </Card>
            
            <h3 className="font-heading font-bold text-xl text-primary mb-4">Coming Up Next</h3>
            
            <div className="space-y-3 mb-24">
              {exercises.slice(currentExerciseIndex + 1).map((exercise, index) => (
                <div key={exercise.id} className="flex items-center bg-white rounded-xl p-4 shadow-md border-l-4 border-primary">
                  <div className="h-12 w-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-4 text-primary">
                    <span className="font-bold text-lg">{currentExerciseIndex + index + 2}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-base">{exercise.name}</h4>
                    <span className="text-sm text-gray-600">
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
                <div className="flex items-center bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4 text-green-600">
                    <i className="fas fa-flag-checkered text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-base">Finish Workout</h4>
                    <span className="text-sm text-green-600 font-medium">Almost there! You got this!</span>
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
