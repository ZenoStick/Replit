import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import NotFound from "@/pages/not-found";

// Lazy-loaded page components
const Login = lazy(() => import("@/pages/login"));
const Onboarding = lazy(() => import("@/pages/onboarding"));
const Home = lazy(() => import("@/pages/home"));
const Challenges = lazy(() => import("@/pages/challenges"));
const Workout = lazy(() => import("@/pages/workout"));
const Rewards = lazy(() => import("@/pages/rewards"));
const Profile = lazy(() => import("@/pages/profile"));
const Spin = lazy(() => import("@/pages/spin"));
const Checkout = lazy(() => import("@/pages/checkout"));

function Router() {
  const [location] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get the current user
        const res = await fetch("/api/user", {
          credentials: "include"
        });

        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
        toast({
          title: "Network Error",
          description: "Could not connect to the server. Please try again.",
          variant: "destructive"
        });
      }
    };

    checkAuth();
  }, [toast, location]);

  if (isAuthenticated === null) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      window.location.href = "/";
      return null;
    }
    return <>{children}</>;
  };

  const showNavbar = isAuthenticated && 
    location !== "/" && 
    location !== "/onboarding" && 
    location !== "/workout" &&
    location !== "/spin" &&
    location !== "/checkout";

  return (
    <>
      <Suspense 
        fallback={
          <div className="h-screen flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        }
      >
        <Switch>
          <Route path="/">
            {isAuthenticated ? <Home /> : <Login setIsAuthenticated={setIsAuthenticated} />}
          </Route>
          <Route path="/login">
            {isAuthenticated ? <Home /> : <Login setIsAuthenticated={setIsAuthenticated} />}
          </Route>
          <Route path="/onboarding">
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          </Route>
          <Route path="/home">
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          </Route>
          <Route path="/challenges">
            <ProtectedRoute>
              <Challenges />
            </ProtectedRoute>
          </Route>
          <Route path="/workout/:id">
            {(params) => (
              <ProtectedRoute>
                <Workout id={params.id} />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/rewards">
            <ProtectedRoute>
              <Rewards />
            </ProtectedRoute>
          </Route>
          <Route path="/profile">
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Route>
          <Route path="/spin">
            <ProtectedRoute>
              <Spin />
            </ProtectedRoute>
          </Route>
          <Route path="/checkout">
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>

      {showNavbar && <Navbar />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
