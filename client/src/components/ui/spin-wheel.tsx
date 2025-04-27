import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SpinReward {
  id: number;
  label: string;
  value: string | number;
  color: string;
}

interface SpinWheelProps {
  rewards: SpinReward[];
  onSpinComplete: (reward: SpinReward) => void;
  canSpin: boolean;
  className?: string;
}

export function SpinWheel({
  rewards,
  onSpinComplete,
  canSpin,
  className
}: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedReward, setSelectedReward] = useState<SpinReward | null>(null);

  // Calculate segment size in degrees
  const segmentSize = 360 / rewards.length;

  const spinWheel = () => {
    if (isSpinning || !canSpin) return;
    
    setIsSpinning(true);

    // Random full rotations (2-5) + random segment
    const randomIndex = Math.floor(Math.random() * rewards.length);
    const randomReward = rewards[randomIndex];
    
    // Calculate final rotation
    // We want the wheel to spin so that the selected reward stops at the top (marker position)
    // The marker is at top (0 degrees), so we need to calculate an appropriate angle
    const fullRotations = 1440; // 4 full rotations (4 * 360)
    
    // Target position: the middle of the segment should align with the marker
    const segmentMiddle = randomIndex * segmentSize + segmentSize / 2;
    
    // We want the segment to stop at the top, which means we need to rotate clockwise
    // so that the segment is at the top position (0 degrees)
    // Since we're using negative rotation values (clockwise), we need to adjust the calculation
    const finalRotation = -(fullRotations + segmentMiddle);
    
    setRotation(finalRotation);
    setSelectedReward(randomReward);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (selectedReward && isSpinning) {
      timer = setTimeout(() => {
        setIsSpinning(false);
        onSpinComplete(selectedReward);
      }, 4500); // Allow the animation to complete
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [selectedReward, isSpinning, onSpinComplete]);

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      {/* Marker at top */}
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-5 h-10 bg-accent" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}></div>
      </div>
      
      {/* Wheel */}
      <div className="relative w-[300px] h-[300px]">
        <motion.div
          className="spin-wheel w-full h-full rounded-full overflow-hidden shadow-lg"
          style={{ 
            background: `conic-gradient(${rewards.map((reward, index) => 
              `${reward.color} ${index * segmentSize}deg ${(index + 1) * segmentSize}deg`
            ).join(", ")})`,
          }}
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.1, 0.25, 0.1, 1] }}
        >
          {/* Segment labels */}
          {rewards.map((reward, index) => {
            // Position label in middle of segment
            const angle = index * segmentSize + segmentSize / 2;
            const radians = (angle - 90) * (Math.PI / 180); // -90 to start from top
            const radius = 120; // Distance from center
            const x = Math.cos(radians) * radius + 150; // 150 is center of 300px wheel
            const y = Math.sin(radians) * radius + 150;
            
            return (
              <div
                key={reward.id}
                className="absolute text-white font-bold text-sm"
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  left: `${x}px`,
                  top: `${y}px`,
                }}
              >
                {reward.label}
              </div>
            );
          })}
        </motion.div>
        
        {/* Center button */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center z-20">
          <span className="font-bold text-primary">SPIN</span>
        </div>
      </div>
      
      <Button
        onClick={spinWheel}
        disabled={isSpinning || !canSpin}
        className="mt-6 bg-white text-primary px-8 py-3 rounded-xl font-bold text-lg shadow-lg"
      >
        {isSpinning ? "Spinning..." : canSpin ? "Spin Now" : "Spin Again Tomorrow"}
      </Button>
    </div>
  );
}
