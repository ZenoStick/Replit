import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { z } from "zod";
import MemoryStore from "memorystore";
import Stripe from "stripe";
import {
  insertUserSchema,
  loginSchema,
  insertChallengeSchema,
  insertWorkoutSchema,
  insertAchievementSchema,
  insertSpinResultSchema
} from "@shared/schema";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware - MUST COME FIRST
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret-key",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // Prune expired entries every 24h
      }),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        secure: process.env.NODE_ENV === "production",
      },
    })
  );
  
  // Test route for creating a default user (for development only)
  app.get("/api/test/create-user", async (req, res) => {
    try {
      // Check if test user already exists
      const existingUser = await storage.getUserByEmail("test@example.com");
      if (existingUser) {
        // Set user session for existing user
        req.session.userId = existingUser.id;
        
        const { password, ...userWithoutPassword } = existingUser;
        return res.status(200).json({
          message: "Test user already exists, session created", 
          user: userWithoutPassword
        });
      }
      
      // Create a test user
      const user = await storage.createUser({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        avatarId: 1,
        fitnessGoal: "Weight Loss",
        workoutDaysPerWeek: 3
      });
      
      // Set user session
      req.session.userId = user.id;
      
      // Remove password from the response
      const { password, ...userResponse } = user;
      res.status(201).json({message: "Test user created and logged in", user: userResponse});
    } catch (error) {
      console.error("Error creating test user:", error);
      res.status(500).json({ message: "Error creating test user" });
    }
  });

  // Authentication middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Set user session
      req.session.userId = user.id;
      
      // Remove password from the response
      const { password, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error during registration" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(loginData.email);
      if (!user || user.password !== loginData.password) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
      
      // Set user session
      req.session.userId = user.id;
      
      // Remove password from the response
      const { password, ...userResponse } = user;
      res.status(200).json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error during login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // User routes
  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from the response
      const { password, ...userResponse } = user;
      res.status(200).json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching user" });
    }
  });
  
  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const userData = req.body;
      
      const updatedUser = await storage.updateUserProfile(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from the response
      const { password, ...userResponse } = updatedUser;
      res.status(200).json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Challenge routes
  app.get("/api/challenges", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const challenges = await storage.getChallenges(userId);
      res.status(200).json(challenges);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching challenges" });
    }
  });

  app.post("/api/challenges", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const challengeData = insertChallengeSchema.parse({
        ...req.body,
        userId
      });
      
      const challenge = await storage.createChallenge(challengeData);
      res.status(201).json(challenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error creating challenge" });
    }
  });

  app.patch("/api/challenges/:id/progress", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const challengeId = parseInt(req.params.id);
      const progress = z.number().min(0).max(100).parse(req.body.progress);
      
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      if (challenge.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this challenge" });
      }
      
      const updatedChallenge = await storage.updateChallengeProgress(challengeId, progress);
      res.status(200).json(updatedChallenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error updating challenge progress" });
    }
  });

  app.post("/api/challenges/:id/complete", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const challengeId = parseInt(req.params.id);
      
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      if (challenge.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to complete this challenge" });
      }
      
      const completedChallenge = await storage.completeChallenge(challengeId);
      res.status(200).json(completedChallenge);
    } catch (error) {
      res.status(500).json({ message: "Server error completing challenge" });
    }
  });

  // Workout routes
  app.get("/api/workouts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const workouts = await storage.getWorkouts(userId);
      res.status(200).json(workouts);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching workouts" });
    }
  });

  app.post("/api/workouts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const workoutData = insertWorkoutSchema.parse({
        ...req.body,
        userId
      });
      
      const workout = await storage.createWorkout(workoutData);
      res.status(201).json(workout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error creating workout" });
    }
  });

  app.post("/api/workouts/:id/complete", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const workoutId = parseInt(req.params.id);
      
      const workout = await storage.getWorkout(workoutId);
      
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      if (workout.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to complete this workout" });
      }
      
      const completedWorkout = await storage.completeWorkout(workoutId);
      
      // Update user streak
      const user = await storage.getUser(userId);
      if (user) {
        await storage.updateUserStreak(userId, user.streakDays + 1);
      }
      
      res.status(200).json(completedWorkout);
    } catch (error) {
      res.status(500).json({ message: "Server error completing workout" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const achievements = await storage.getAchievements(userId);
      res.status(200).json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching achievements" });
    }
  });

  // Reward routes
  app.get("/api/rewards", requireAuth, async (req, res) => {
    try {
      const rewards = await storage.getRewards();
      res.status(200).json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching rewards" });
    }
  });

  app.get("/api/user/rewards", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const userRewards = await storage.getUserRewards(userId);
      res.status(200).json(userRewards);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching user rewards" });
    }
  });

  app.post("/api/rewards/:id/redeem", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const rewardId = parseInt(req.params.id);
      
      // Get the reward details first to check if it's a physical reward
      const [reward] = await storage.getRewardById(rewardId);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      // If it's a physical/real-world reward that requires shipping or fulfillment
      if (reward.category === "Real World") {
        // Validate shipping information if provided in the request
        const { shippingName, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry } = req.body;
        
        if (!shippingName || !shippingAddress || !shippingCity || !shippingState || !shippingZip || !shippingCountry) {
          return res.status(400).json({ message: "Shipping information is required for physical rewards" });
        }
        
        const userReward = await storage.redeemReward(userId, rewardId);
        
        if (!userReward) {
          return res.status(400).json({ message: "Failed to redeem reward. Check if you have enough points." });
        }
        
        // For physical rewards, create a Stripe PaymentIntent with $0 amount
        // This is just to collect shipping details and confirm the order
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 0, // $0 since the user is paying with points
          currency: 'usd',
          metadata: {
            userId: userId.toString(),
            rewardId: rewardId.toString(),
            rewardTitle: reward.title,
            rewardDescription: reward.description,
            shippingName,
            shippingAddress,
            shippingCity,
            shippingState,
            shippingZip,
            shippingCountry
          }
        });
        
        return res.status(200).json({ 
          userReward,
          clientSecret: paymentIntent.client_secret,
          isPhysicalReward: true
        });
      } else {
        // For digital rewards, just redeem normally
        const userReward = await storage.redeemReward(userId, rewardId);
        
        if (!userReward) {
          return res.status(400).json({ message: "Failed to redeem reward. Check if you have enough points." });
        }
        
        return res.status(200).json({ 
          userReward, 
          isPhysicalReward: false 
        });
      }
    } catch (error) {
      console.error("Error redeeming reward:", error);
      res.status(500).json({ message: "Server error redeeming reward" });
    }
  });
  
  // Endpoint to create a payment intent for real-world rewards
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { rewardId, shippingInfo } = req.body;
      
      if (!rewardId) {
        return res.status(400).json({ message: "Reward ID is required" });
      }
      
      // Get the reward to check its value
      const [reward] = await storage.getRewardById(parseInt(rewardId));
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 0, // Free since paid with points
        currency: "usd",
        metadata: {
          userId: userId.toString(),
          rewardId: rewardId.toString(),
          rewardTitle: reward.title,
          ...shippingInfo
        }
      });
      
      res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Spin wheel routes
  app.get("/api/spins", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const spinHistory = await storage.getSpinHistory(userId);
      
      // Check if user has spun today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const spunToday = spinHistory.some(spin => {
        const spinDate = new Date(spin.spinDate);
        spinDate.setHours(0, 0, 0, 0);
        return spinDate.getTime() === today.getTime();
      });
      
      res.status(200).json({ spins: spinHistory, canSpinToday: !spunToday });
    } catch (error) {
      res.status(500).json({ message: "Server error fetching spin history" });
    }
  });

  app.post("/api/spins", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      // Check if user has already spun today
      const spinHistory = await storage.getSpinHistory(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const spunToday = spinHistory.some(spin => {
        const spinDate = new Date(spin.spinDate);
        spinDate.setHours(0, 0, 0, 0);
        return spinDate.getTime() === today.getTime();
      });
      
      if (spunToday) {
        return res.status(400).json({ message: "You've already used your daily spin" });
      }
      
      // Determine spin result (random)
      const spinOptions = [
        { reward: "points", points: 50 },
        { reward: "points", points: 100 },
        { reward: "avatar", points: 0 },
        { reward: "surprise", points: 20 }
      ];
      
      const result = spinOptions[Math.floor(Math.random() * spinOptions.length)];
      
      const spinData = insertSpinResultSchema.parse({
        userId,
        reward: result.reward,
        points: result.points
      });
      
      const spinResult = await storage.createSpinResult(spinData);
      res.status(201).json(spinResult);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error creating spin result" });
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboard", requireAuth, async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      
      // Remove passwords and limit results to top 10
      const leaderboardResponse = leaderboard
        .slice(0, 10)
        .map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
      
      res.status(200).json(leaderboardResponse);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching leaderboard" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
