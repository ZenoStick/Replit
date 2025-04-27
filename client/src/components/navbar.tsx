import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Trophy, Dumbbell, Gift, User } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();

  const items = [
    { path: "/home", label: "Home", icon: Home },
    { path: "/challenges", label: "Challenges", icon: Trophy },
    { path: "/workout/0", label: "Workouts", icon: Dumbbell }, // 0 is a placeholder that will be handled in the workout page
    { path: "/rewards", label: "Rewards", icon: Gift },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white flex justify-around items-center py-3 px-6 shadow-lg rounded-t-3xl z-10">
      {items.map((item) => {
        const isActive = location === item.path || 
          (item.path === "/workout/0" && location.startsWith("/workout"));
          
        return (
          <Link key={item.path} href={item.path}>
            <a className={cn(
              "flex flex-col items-center",
              isActive ? "text-primary" : "text-gray-400"
            )}>
              <item.icon className="text-xl h-5 w-5" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </a>
          </Link>
        );
      })}
    </div>
  );
}
