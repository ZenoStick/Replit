import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";

interface BMICalculatorProps {
  className?: string;
}

export function BMICalculator({ className }: BMICalculatorProps) {
  const [measurementSystem, setMeasurementSystem] = useState<"metric" | "imperial">("metric");
  
  // Metric values
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightKg, setWeightKg] = useState<number>(65);
  
  // Imperial values
  const [heightFt, setHeightFt] = useState<number>(5);
  const [heightIn, setHeightIn] = useState<number>(7);
  const [weightLbs, setWeightLbs] = useState<number>(143);
  
  const [bmi, setBmi] = useState<number>(0);
  const [bmiCategory, setBmiCategory] = useState<string>("");
  const [categoryColor, setCategoryColor] = useState<string>("");
  
  // Calculate BMI
  useEffect(() => {
    let calculatedBmi: number;
    
    if (measurementSystem === "metric") {
      // Metric formula: weight (kg) / (height (m))²
      calculatedBmi = weightKg / Math.pow(heightCm / 100, 2);
    } else {
      // Imperial formula: (weight (lbs) * 703) / (height (in))²
      const totalInches = (heightFt * 12) + heightIn;
      calculatedBmi = (weightLbs * 703) / Math.pow(totalInches, 2);
    }
    
    // Round to 1 decimal place
    calculatedBmi = Math.round(calculatedBmi * 10) / 10;
    
    setBmi(calculatedBmi);
    
    // Set BMI category and color
    if (calculatedBmi < 18.5) {
      setBmiCategory("Underweight");
      setCategoryColor("text-blue-500");
    } else if (calculatedBmi >= 18.5 && calculatedBmi < 25) {
      setBmiCategory("Healthy Weight");
      setCategoryColor("text-green-500");
    } else if (calculatedBmi >= 25 && calculatedBmi < 30) {
      setBmiCategory("Overweight");
      setCategoryColor("text-yellow-500");
    } else {
      setBmiCategory("Obesity");
      setCategoryColor("text-red-500");
    }
    
  }, [heightCm, weightKg, heightFt, heightIn, weightLbs, measurementSystem]);
  
  // Handle metric input changes
  const handleHeightCmChange = (value: number[]) => {
    setHeightCm(value[0]);
  };
  
  const handleWeightKgChange = (value: number[]) => {
    setWeightKg(value[0]);
  };
  
  // Handle imperial input changes
  const handleHeightFtChange = (value: number[]) => {
    setHeightFt(value[0]);
  };
  
  const handleHeightInChange = (value: number[]) => {
    setHeightIn(value[0]);
  };
  
  const handleWeightLbsChange = (value: number[]) => {
    setWeightLbs(value[0]);
  };
  
  // BMI visual indicator
  const getBmiIndicatorPosition = () => {
    // Clamp BMI value between 15 and 35 for visual purposes
    const clampedBmi = Math.max(15, Math.min(35, bmi));
    // Convert to percentage position (15-35 range mapped to 0-100%)
    return ((clampedBmi - 15) / 20) * 100;
  };
  
  return (
    <Card className={`border-2 border-violet-700 overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-primary to-violet-700 text-white">
        <CardTitle className="text-xl font-heading text-center">BMI Calculator</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <Tabs defaultValue="metric" onValueChange={(value) => setMeasurementSystem(value as "metric" | "imperial")}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="metric">Metric</TabsTrigger>
            <TabsTrigger value="imperial">Imperial</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metric" className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label>Height</Label>
                <span className="text-sm font-medium">{heightCm} cm</span>
              </div>
              <Slider 
                defaultValue={[heightCm]} 
                min={120} 
                max={220} 
                step={1} 
                onValueChange={handleHeightCmChange}
                className="my-2"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label>Weight</Label>
                <span className="text-sm font-medium">{weightKg} kg</span>
              </div>
              <Slider 
                defaultValue={[weightKg]} 
                min={30} 
                max={150} 
                step={1} 
                onValueChange={handleWeightKgChange}
                className="my-2"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="imperial" className="space-y-4">
            <div>
              <Label>Height</Label>
              <div className="flex gap-2 mt-1">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs">Feet</span>
                    <span className="text-sm font-medium">{heightFt} ft</span>
                  </div>
                  <Slider 
                    defaultValue={[heightFt]} 
                    min={4} 
                    max={7} 
                    step={1} 
                    onValueChange={handleHeightFtChange}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs">Inches</span>
                    <span className="text-sm font-medium">{heightIn} in</span>
                  </div>
                  <Slider 
                    defaultValue={[heightIn]} 
                    min={0} 
                    max={11} 
                    step={1} 
                    onValueChange={handleHeightInChange}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label>Weight</Label>
                <span className="text-sm font-medium">{weightLbs} lbs</span>
              </div>
              <Slider 
                defaultValue={[weightLbs]} 
                min={60} 
                max={330} 
                step={1} 
                onValueChange={handleWeightLbsChange}
                className="my-2"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold">Your BMI</h3>
            <motion.div 
              className="text-3xl font-bold text-primary mt-1"
              key={bmi}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 10 }}
            >
              {bmi}
            </motion.div>
            <div className={`font-medium mt-1 ${categoryColor}`}>
              {bmiCategory}
            </div>
          </div>
          
          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mt-4 mb-2">
            {/* BMI gradient bar */}
            <div className="absolute inset-0 flex">
              <div className="h-full bg-blue-500 flex-1"></div>
              <div className="h-full bg-green-500 flex-1"></div>
              <div className="h-full bg-yellow-500 flex-1"></div>
              <div className="h-full bg-red-500 flex-1"></div>
            </div>
            
            {/* BMI indicator */}
            <div 
              className="absolute top-0 h-full w-2 bg-white border border-gray-600"
              style={{ left: `${getBmiIndicatorPosition()}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Underweight</span>
            <span>Normal</span>
            <span>Overweight</span>
            <span>Obese</span>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>BMI is a screening tool but not a diagnostic of body fatness or health.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}