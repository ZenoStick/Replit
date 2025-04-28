import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WorkoutTimerProps {
  initialSeconds: number;
  initialReps?: number;
  targetReps?: number;
  countReps?: boolean;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  caloriesBurnedPerMinute?: number;
  onComplete: () => void;
  className?: string;
}

export function WorkoutTimer({
  initialSeconds,
  initialReps = 0,
  targetReps = 0,
  countReps = false,
  difficultyLevel = 'beginner',
  caloriesBurnedPerMinute = 5,
  onComplete,
  className
}: WorkoutTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [reps, setReps] = useState(initialReps);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  
  // Refs to keep track of completion state
  const hasCalledComplete = useRef(false);
  const animationFrameId = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  
  // Reset the timer when exercise changes (initialSeconds or targetReps change)
  useEffect(() => {
    console.log("Exercise changed, resetting timer:", { initialSeconds, targetReps });
    setSeconds(initialSeconds);
    setReps(initialReps);
    setIsPaused(false);
    setIsComplete(false);
    setCaloriesBurned(0);
    hasCalledComplete.current = false;
    startTimeRef.current = Date.now();
    
    // Cancel any pending animation frames
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    return () => {
      // Cleanup when unmounting
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [initialSeconds, targetReps, initialReps]);
  
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Safely call onComplete exactly once
  const handleComplete = useCallback(() => {
    if (!hasCalledComplete.current && !isComplete) {
      console.log("Marking exercise as complete");
      hasCalledComplete.current = true;
      setIsComplete(true);
      
      // Calculate final calories burned based on actual time spent
      const timeSpentMinutes = (Date.now() - startTimeRef.current) / 60000;
      const finalCalories = Math.round(timeSpentMinutes * caloriesBurnedPerMinute);
      setCaloriesBurned(finalCalories);
      
      // Use requestAnimationFrame for smoother transitions
      animationFrameId.current = requestAnimationFrame(() => {
        console.log("Calling onComplete callback");
        onComplete();
        animationFrameId.current = null;
      });
    }
  }, [isComplete, onComplete, caloriesBurnedPerMinute]);
  
  const incrementReps = useCallback(() => {
    if (countReps && !isComplete && !hasCalledComplete.current) {
      const newReps = reps + 1;
      setReps(newReps);
      
      // Show progress as soon as user starts counting reps
      if (newReps === 1) {
        setShowProgress(true);
      }
      
      // Check if target is reached
      if (newReps >= targetReps) {
        console.log("Target reps reached:", newReps, ">=", targetReps);
        handleComplete();
      }
    }
  }, [countReps, targetReps, isComplete, reps, handleComplete]);
  
  // Timer for countdown and calorie calculation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (!isPaused && !isComplete && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev - 1;
          
          // Update calories every second based on time elapsed
          const timeSpentMinutes = (Date.now() - startTimeRef.current) / 60000;
          const newCalories = Math.round(timeSpentMinutes * caloriesBurnedPerMinute);
          setCaloriesBurned(newCalories);
          
          if (newSeconds <= 0 && !countReps) {
            // Timer complete (only if not counting reps)
            handleComplete();
            return 0;
          }
          return newSeconds;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPaused, seconds, isComplete, countReps, handleComplete, caloriesBurnedPerMinute]);
  
  const togglePause = () => {
    setIsPaused(prev => !prev);
  };
  
  const markExerciseComplete = useCallback(() => {
    handleComplete();
  }, [handleComplete]);
  
  // Calculate progress percentage for rep-based exercises
  const progressPercentage = countReps && targetReps > 0 
    ? Math.min(Math.round((reps / targetReps) * 100), 100) 
    : Math.min(Math.round(((initialSeconds - seconds) / initialSeconds) * 100), 100);
  
  // Get difficulty color
  const getDifficultyColor = () => {
    switch(difficultyLevel) {
      case 'beginner': return 'text-green-500';
      case 'intermediate': return 'text-yellow-500';
      case 'advanced': return 'text-red-500';
      default: return 'text-green-500';
    }
  };
  
  const getDifficultyBorderColor = () => {
    switch(difficultyLevel) {
      case 'beginner': return 'border-green-500';
      case 'intermediate': return 'border-yellow-500';
      case 'advanced': return 'border-red-500';
      default: return 'border-green-500';
    }
  };
  
  return (
    <div className={cn("text-center", className)}>
      <div className="flex justify-between items-center mb-2">
        <div className={cn("px-3 py-1 rounded-full text-xs font-bold border", getDifficultyBorderColor())}>
          <span className={getDifficultyColor()}>
            {difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)}
          </span>
        </div>
        <div className="text-sm font-medium">
          <span className="text-primary">{caloriesBurned}</span> calories
        </div>
      </div>
      
      <motion.div 
        className="workout-timer font-heading text-primary text-4xl"
        initial={{ scale: 1 }}
        animate={{ scale: isPaused ? 0.95 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {formatTime(seconds)}
      </motion.div>
      
      {countReps && (
        <div className="text-center my-3">
          <motion.span 
            className="text-3xl font-bold"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.3, times: [0, 0.2, 1] }}
            key={reps}
          >
            {reps}
          </motion.span>
          <span className="text-gray-600"> / {targetReps} reps</span>
        </div>
      )}
      
      {(showProgress || !countReps) && (
        <div className="my-4">
          <Progress value={progressPercentage} className="h-2 bg-gray-200" />
        </div>
      )}
      
      <div className="flex space-x-3 mt-4">
        <Button
          onClick={togglePause}
          className="flex-1 bg-white border-2 border-primary text-primary py-3 rounded-xl font-bold hover:bg-primary hover:text-white transition-colors"
          disabled={isComplete}
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>
        
        <Button
          onClick={countReps ? incrementReps : markExerciseComplete}
          className="flex-1 bg-primary text-white py-3 rounded-xl font-bold border-2 border-violet-700 hover:bg-violet-700 transition-colors"
          disabled={isComplete}
        >
          {countReps ? "Done Rep" : "Complete"}
        </Button>
      </div>
    </div>
  );
}
