import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AvatarSelection } from "@/components/ui/avatar-selection";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Avatar } from "@shared/schema";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedAvatar, setSelectedAvatar] = useState<number>(1);
  const [fitnessGoal, setFitnessGoal] = useState<string>("Improve overall fitness");
  const [daysPerWeek, setDaysPerWeek] = useState<number>(3);
  
  // Avatar options
  const avatarOptions: Avatar[] = [
    {
      id: 1,
      imageUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop"
    },
    {
      id: 2,
      imageUrl: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=100&h=100&fit=crop"
    },
    {
      id: 3,
      imageUrl: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=100&h=100&fit=crop"
    },
    {
      id: 4,
      imageUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop"
    }
  ];
  
  // Fitness goals options
  const fitnessGoals = [
    "Improve overall fitness",
    "Build strength",
    "Increase flexibility",
    "Improve mental wellness"
  ];
  
  // Days per week options
  const daysOptions = [3, 4, 5, 6, 7];
  
  // Get user data
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
    refetchOnWindowFocus: false
  });
  
  // Update user preferences
  const updateUser = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/user", {
        avatarId: selectedAvatar,
        fitnessGoal,
        workoutDaysPerWeek: daysPerWeek
      });
    },
    onSuccess: () => {
      navigate("/home");
      toast({
        title: "Profile Updated",
        description: "Your profile has been set up successfully!",
      });
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile.",
        variant: "destructive"
      });
    }
  });
  
  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      updateUser.mutate();
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    },
    exit: { 
      x: "-100vw",
      transition: { ease: "easeInOut" }
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

  return (
    <div className="bg-white p-6 min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          disabled={step === 1}
          className={step === 1 ? "invisible" : ""}
        >
          <i className="fas fa-arrow-left"></i>
        </Button>
        
        <h2 className="font-heading font-bold text-2xl text-primary">Set Your Goals</h2>
        
        <div className="flex space-x-2">
          {[1, 2, 3].map((i) => (
            <span 
              key={i}
              className={`${i === step ? "active-dot" : "inactive-dot"}`}
            ></span>
          ))}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        {step === 1 && (
          <motion.div
            className="flex-1 flex flex-col"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div className="text-center mb-6" variants={itemVariants}>
              <div className="w-40 h-40 mx-auto rounded-full bg-gray-200 mb-4 overflow-hidden">
                <img 
                  src={avatarOptions.find(a => a.id === selectedAvatar)?.imageUrl || avatarOptions[0].imageUrl}
                  alt="Character Selection" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-heading font-bold text-xl">Choose Your Avatar</h3>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <AvatarSelection
                options={avatarOptions}
                selectedId={selectedAvatar}
                onSelect={setSelectedAvatar}
                className="mb-8"
              />
            </motion.div>
          </motion.div>
        )}
        
        {step === 2 && (
          <motion.div
            className="flex-1 flex flex-col"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.h3 className="font-heading font-bold text-xl mb-4" variants={itemVariants}>
              What are your fitness goals?
            </motion.h3>
            
            <motion.div className="space-y-3 mb-6" variants={itemVariants}>
              <RadioGroup value={fitnessGoal} onValueChange={setFitnessGoal}>
                {fitnessGoals.map((goal) => (
                  <div 
                    key={goal}
                    className={`goal-option flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      fitnessGoal === goal ? "border-primary" : "border-gray-200 hover:border-primary/50"
                    }`}
                    onClick={() => setFitnessGoal(goal)}
                  >
                    <RadioGroupItem id={goal} value={goal} className="sr-only" />
                    <div className={`h-6 w-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      fitnessGoal === goal ? "border-primary" : "border-gray-200"
                    }`}>
                      {fitnessGoal === goal && (
                        <div className="h-3 w-3 rounded-full bg-primary"></div>
                      )}
                    </div>
                    <Label htmlFor={goal}>{goal}</Label>
                  </div>
                ))}
              </RadioGroup>
            </motion.div>
          </motion.div>
        )}
        
        {step === 3 && (
          <motion.div
            className="flex-1 flex flex-col"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.h3 className="font-heading font-bold text-xl mb-4" variants={itemVariants}>
              How many days per week?
            </motion.h3>
            
            <motion.div className="flex justify-between mb-10" variants={itemVariants}>
              {daysOptions.map((day) => (
                <div
                  key={day}
                  className={`day-option h-12 w-12 rounded-full flex items-center justify-center cursor-pointer font-bold shadow-md ${
                    daysPerWeek === day 
                      ? "bg-primary text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  } transition-colors`}
                  onClick={() => setDaysPerWeek(day)}
                >
                  {day}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
      
      <Button
        className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-opacity-90 transition-all mb-4"
        onClick={handleNext}
        disabled={updateUser.isPending}
      >
        {updateUser.isPending 
          ? "Loading..." 
          : step < 3 
            ? "Continue" 
            : "Let's Start!"}
      </Button>
    </div>
  );
}
