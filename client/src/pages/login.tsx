import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

interface LoginProps {
  setIsAuthenticated: (value: boolean) => void;
}

export default function Login({ setIsAuthenticated }: LoginProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: ""
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const login = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", {
        email: formData.email,
        password: formData.password
      });
      return res.json();
    },
    onSuccess: (data) => {
      setIsAuthenticated(true);
      
      if (data.fitnessGoal) {
        navigate("/home");
      } else {
        navigate("/onboarding");
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome back to FitQuest!",
      });
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const register = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/register", {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        avatarId: 1
      });
      return res.json();
    },
    onSuccess: (data) => {
      setIsAuthenticated(true);
      navigate("/onboarding");
      
      toast({
        title: "Registration Successful",
        description: "Welcome to FitQuest!",
      });
    },
    onError: (error) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "Please check your information and try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      // Validate form
      if (!formData.email || !formData.password || !formData.username) {
        toast({
          title: "Missing Information",
          description: "Please fill in all fields",
          variant: "destructive"
        });
        return;
      }
      register.mutate();
    } else {
      if (!formData.email || !formData.password) {
        toast({
          title: "Missing Information",
          description: "Please enter your email and password",
          variant: "destructive"
        });
        return;
      }
      login.mutate();
    }
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
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

  return (
    <div className="bg-gradient-to-br from-primary to-secondary p-6 min-h-screen flex flex-col items-center justify-center">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="w-full bg-white rounded-3xl shadow-xl">
          <CardContent className="pt-8 px-8">
            <motion.div className="flex flex-col items-center mb-6" variants={itemVariants}>
              <div className="w-24 h-24 rounded-full border-4 border-accent bg-primary mb-4 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">FQ</span>
              </div>
              <h1 className="font-heading font-extrabold text-3xl text-primary mb-2">FitQuest</h1>
              <p className="font-body text-gray-600 mb-6">Your fitness journey starts here!</p>
            </motion.div>
            
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              {isSignUp && (
                <motion.div variants={itemVariants}>
                  <Label htmlFor="username" className="block text-sm font-semibold mb-1">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </motion.div>
              )}
              
              <motion.div variants={itemVariants}>
                <Label htmlFor="email" className="block text-sm font-semibold mb-1">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Label htmlFor="password" className="block text-sm font-semibold mb-1">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold text-lg hover:bg-opacity-90 transition-all"
                  disabled={login.isPending || register.isPending}
                >
                  {login.isPending || register.isPending ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
                </Button>
              </motion.div>
              
              {!isSignUp && (
                <motion.div className="text-center" variants={itemVariants}>
                  <a href="#" className="text-primary text-sm font-medium">Forgot Password?</a>
                </motion.div>
              )}
            </form>
            
            <motion.div className="my-6 w-full flex items-center" variants={itemVariants}>
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </motion.div>
            
            <motion.div className="w-full space-y-3" variants={itemVariants}>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center border border-gray-300 p-3 rounded-xl hover:bg-gray-50 transition-all"
              >
                <FcGoogle className="mr-2 h-5 w-5" />
                <span>Continue with Google</span>
              </Button>
              <Button
                className="w-full flex items-center justify-center bg-black text-white border border-gray-300 p-3 rounded-xl hover:bg-gray-800 transition-all"
              >
                <FaApple className="mr-2 h-5 w-5" />
                <span>Continue with Apple</span>
              </Button>
            </motion.div>
            
            <motion.p className="mt-8 text-sm text-gray-600 text-center" variants={itemVariants}>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-semibold"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
