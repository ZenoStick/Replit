import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WorkoutTimerProps {
  initialSeconds: number;
  initialReps?: number;
  targetReps?: number;
  countReps?: boolean;
  onComplete: () => void;
  className?: string;
}

export function WorkoutTimer({
  initialSeconds,
  initialReps = 0,
  targetReps = 0,
  countReps = false,
  onComplete,
  className
}: WorkoutTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [reps, setReps] = useState(initialReps);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // Refs to keep track of completion state
  const hasCalledComplete = useRef(false);
  const animationFrameId = useRef<number | null>(null);
  
  // Reset the timer when exercise changes (initialSeconds or targetReps change)
  useEffect(() => {
    console.log("Exercise changed, resetting timer:", { initialSeconds, targetReps });
    setSeconds(initialSeconds);
    setReps(initialReps);
    setIsPaused(false);
    setIsComplete(false);
    hasCalledComplete.current = false;
    
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
      
      // Use requestAnimationFrame for smoother transitions
      animationFrameId.current = requestAnimationFrame(() => {
        console.log("Calling onComplete callback");
        onComplete();
        animationFrameId.current = null;
      });
    }
  }, [isComplete, onComplete]);
  
  const incrementReps = useCallback(() => {
    if (countReps && !isComplete && !hasCalledComplete.current) {
      const newReps = reps + 1;
      setReps(newReps);
      
      // Check if target is reached
      if (newReps >= targetReps) {
        console.log("Target reps reached:", newReps, ">=", targetReps);
        handleComplete();
      }
    }
  }, [countReps, targetReps, isComplete, reps, handleComplete]);
  
  // Timer for countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (!isPaused && !isComplete && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev - 1;
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
  }, [isPaused, seconds, isComplete, countReps, handleComplete]);
  
  const togglePause = () => {
    setIsPaused(prev => !prev);
  };
  
  const manualComplete = useCallback(() => {
    handleComplete();
  }, [handleComplete]);
  
  return (
    <div className={cn("text-center", className)}>
      <motion.div 
        className="workout-timer font-heading text-primary"
        initial={{ scale: 1 }}
        animate={{ scale: isPaused ? 0.95 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {formatTime(seconds)}
      </motion.div>
      
      {countReps && (
        <div className="text-center mb-2">
          <motion.span 
            className="text-2xl font-bold"
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
      
      <div className="flex space-x-3 mt-4">
        <Button
          onClick={togglePause}
          className="flex-1 bg-white border-2 border-primary text-primary py-3 rounded-xl font-bold"
          disabled={isComplete}
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>
        
        {countReps ? (
          <Button
            onClick={incrementReps}
            className="flex-1 bg-primary text-white py-3 rounded-xl font-bold"
            disabled={isComplete}
          >
            Count Rep
          </Button>
        ) : (
          <Button
            onClick={manualComplete}
            className="flex-1 bg-primary text-white py-3 rounded-xl font-bold"
            disabled={isComplete}
          >
            Complete
          </Button>
        )}
      </div>
    </div>
  );
}
