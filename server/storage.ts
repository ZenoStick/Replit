import { 
  users, type User, type InsertUser,
  challenges, type Challenge, type InsertChallenge,
  workouts, type Workout, type InsertWorkout,
  achievements, type Achievement, type InsertAchievement,
  rewards, type Reward, type InsertReward,
  userRewards, type UserReward, type InsertUserReward,
  spinResults, type SpinResult, type InsertSpinResult
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: number, points: number): Promise<User | undefined>;
  updateUserStreak(userId: number, streak: number): Promise<User | undefined>;
  updateUserProfile(userId: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Challenges
  getChallenges(userId: number): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallengeProgress(id: number, progress: number): Promise<Challenge | undefined>;
  completeChallenge(id: number): Promise<Challenge | undefined>;
  
  // Workouts
  getWorkouts(userId: number): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  completeWorkout(id: number): Promise<Workout | undefined>;
  
  // Achievements
  getAchievements(userId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Rewards
  getRewards(): Promise<Reward[]>;
  getRewardById(id: number): Promise<Reward[]>;
  getUserRewards(userId: number): Promise<Reward[]>;
  redeemReward(userId: number, rewardId: number): Promise<UserReward | undefined>;
  
  // Spin Wheel
  getSpinHistory(userId: number): Promise<SpinResult[]>;
  createSpinResult(spinResult: InsertSpinResult): Promise<SpinResult>;
  
  // Leaderboard
  getLeaderboard(): Promise<User[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private challenges: Map<number, Challenge>;
  private workouts: Map<number, Workout>;
  private achievements: Map<number, Achievement>;
  private rewards: Map<number, Reward>;
  private userRewards: Map<number, UserReward>;
  private spinResults: Map<number, SpinResult>;
  
  currentUserId: number;
  currentChallengeId: number;
  currentWorkoutId: number;
  currentAchievementId: number;
  currentRewardId: number;
  currentUserRewardId: number;
  currentSpinResultId: number;

  constructor() {
    this.users = new Map();
    this.challenges = new Map();
    this.workouts = new Map();
    this.achievements = new Map();
    this.rewards = new Map();
    this.userRewards = new Map();
    this.spinResults = new Map();
    
    this.currentUserId = 1;
    this.currentChallengeId = 1;
    this.currentWorkoutId = 1;
    this.currentAchievementId = 1;
    this.currentRewardId = 1;
    this.currentUserRewardId = 1;
    this.currentSpinResultId = 1;
    
    // Initialize default rewards
    this.initializeRewards();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      level: 1, 
      points: 0, 
      streakDays: 0,
      createdAt: now,
      avatarId: insertUser.avatarId || 1,
      fitnessGoal: insertUser.fitnessGoal || null,
      workoutDaysPerWeek: insertUser.workoutDaysPerWeek || 3,
      themeColor: insertUser.themeColor || 0
    };
    this.users.set(id, user);
    
    // Create initial challenges for the user
    this.createInitialChallenges(id);
    
    return user;
  }
  
  async updateUserPoints(userId: number, points: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      points: user.points + points,
      // Simple level calculation: level up every 100 points
      level: Math.floor((user.points + points) / 100) + 1
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserStreak(userId: number, streak: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      streakDays: streak
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserProfile(userId: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Do not allow updating certain fields like id, points, level, etc.
    const { id, points, level, createdAt, ...allowedUpdates } = userData as any;
    
    const updatedUser = { 
      ...user,
      ...allowedUpdates,
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Challenge methods
  async getChallenges(userId: number): Promise<Challenge[]> {
    return Array.from(this.challenges.values()).filter(
      (challenge) => challenge.userId === userId
    );
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }

  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const id = this.currentChallengeId++;
    const challenge: Challenge = { 
      ...insertChallenge, 
      id, 
      isComplete: false, 
      progress: 0,
      duration: insertChallenge.duration || null,
      reps: insertChallenge.reps || null
    };
    this.challenges.set(id, challenge);
    return challenge;
  }
  
  async updateChallengeProgress(id: number, progress: number): Promise<Challenge | undefined> {
    const challenge = await this.getChallenge(id);
    if (!challenge) return undefined;
    
    const updatedChallenge = { 
      ...challenge, 
      progress
    };
    
    this.challenges.set(id, updatedChallenge);
    return updatedChallenge;
  }
  
  async completeChallenge(id: number): Promise<Challenge | undefined> {
    const challenge = await this.getChallenge(id);
    if (!challenge) return undefined;
    
    const updatedChallenge = { 
      ...challenge, 
      isComplete: true,
      progress: 100
    };
    
    this.challenges.set(id, updatedChallenge);
    
    // Add points to user
    await this.updateUserPoints(challenge.userId, challenge.points);
    
    return updatedChallenge;
  }

  // Workout methods
  async getWorkouts(userId: number): Promise<Workout[]> {
    return Array.from(this.workouts.values()).filter(
      (workout) => workout.userId === userId
    );
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = this.currentWorkoutId++;
    const workout: Workout = { 
      ...insertWorkout, 
      id,
      completedDate: null
    };
    this.workouts.set(id, workout);
    return workout;
  }
  
  async completeWorkout(id: number): Promise<Workout | undefined> {
    const workout = await this.getWorkout(id);
    if (!workout) return undefined;
    
    const now = new Date();
    const updatedWorkout = { 
      ...workout, 
      completedDate: now
    };
    
    this.workouts.set(id, updatedWorkout);
    
    // Add basic points for completing a workout (30 points)
    await this.updateUserPoints(workout.userId, 30);
    
    return updatedWorkout;
  }

  // Achievement methods
  async getAchievements(userId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values()).filter(
      (achievement) => achievement.userId === userId
    );
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = this.currentAchievementId++;
    const now = new Date();
    const achievement: Achievement = { 
      ...insertAchievement, 
      id,
      achievedDate: now
    };
    this.achievements.set(id, achievement);
    return achievement;
  }

  // Reward methods
  async getRewards(): Promise<Reward[]> {
    return Array.from(this.rewards.values());
  }
  
  async getRewardById(id: number): Promise<Reward[]> {
    const reward = this.rewards.get(id);
    return reward ? [reward] : [];
  }
  
  async getUserRewards(userId: number): Promise<Reward[]> {
    const userRewardIds = Array.from(this.userRewards.values())
      .filter(ur => ur.userId === userId)
      .map(ur => ur.rewardId);
    
    return Array.from(this.rewards.values())
      .filter(reward => userRewardIds.includes(reward.id));
  }
  
  async redeemReward(userId: number, rewardId: number): Promise<UserReward | undefined> {
    const user = await this.getUser(userId);
    const reward = this.rewards.get(rewardId);
    
    if (!user || !reward) return undefined;
    
    // Check if user has enough points
    if (user.points < reward.pointsCost) return undefined;
    
    // Deduct points from user
    await this.updateUserPoints(userId, -reward.pointsCost);
    
    // Add reward to user
    const id = this.currentUserRewardId++;
    const now = new Date();
    const userReward: UserReward = {
      id,
      userId,
      rewardId,
      acquiredDate: now
    };
    
    this.userRewards.set(id, userReward);
    return userReward;
  }

  // Spin Wheel methods
  async getSpinHistory(userId: number): Promise<SpinResult[]> {
    return Array.from(this.spinResults.values()).filter(
      (spin) => spin.userId === userId
    );
  }
  
  async createSpinResult(insertSpinResult: InsertSpinResult): Promise<SpinResult> {
    const id = this.currentSpinResultId++;
    const now = new Date();
    const spinResult: SpinResult = { 
      ...insertSpinResult, 
      id,
      spinDate: now,
      points: insertSpinResult.points || null
    };
    this.spinResults.set(id, spinResult);
    
    // If points were awarded, update user points
    if (spinResult.points && spinResult.points > 0) {
      await this.updateUserPoints(spinResult.userId, spinResult.points);
    }
    
    return spinResult;
  }

  // Leaderboard
  async getLeaderboard(): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.points - a.points);
  }
  
  // Helper methods
  private async createInitialChallenges(userId: number) {
    const challenges: InsertChallenge[] = [
      {
        title: "Morning Workout",
        description: "Complete a quick morning workout routine",
        category: "Fitness",
        icon: "dumbbell",
        points: 20,
        duration: 15,
        reps: null,
        userId
      },
      {
        title: "Hydration Goal",
        description: "Drink 8 cups of water today",
        category: "Hydration",
        icon: "glass-water",
        points: 15,
        duration: null,
        reps: 8,
        userId
      },
      {
        title: "Mindfulness Break",
        description: "Take 5 minutes for mindfulness meditation",
        category: "Mindfulness",
        icon: "brain",
        points: 10,
        duration: 5,
        reps: null,
        userId
      },
      {
        title: "Healthy Meal",
        description: "Log a healthy meal with protein and vegetables",
        category: "Nutrition",
        icon: "utensils",
        points: 15,
        duration: null,
        reps: null,
        userId
      }
    ];
    
    for (const challenge of challenges) {
      await this.createChallenge(challenge);
    }
  }
  
  private initializeRewards() {
    const defaultRewards: InsertReward[] = [
      {
        title: "Premium Avatar",
        description: "Unlock a premium avatar for your profile",
        category: "Digital",
        icon: "user-astronaut",
        pointsCost: 200,
        isAvailable: true
      },
      {
        title: "App Wallpaper",
        description: "Exclusive app wallpaper pack",
        category: "Digital",
        icon: "image",
        pointsCost: 100,
        isAvailable: true
      },
      {
        title: "$5 Gift Card",
        description: "Redeem for a $5 digital gift card",
        category: "Real World",
        icon: "gift",
        pointsCost: 500,
        isAvailable: true
      },
      {
        title: "Exclusive Badge",
        description: "Showcase a rare achievement badge on your profile",
        category: "Digital",
        icon: "medal",
        pointsCost: 150,
        isAvailable: true
      },
      {
        title: "Wireless Earbuds",
        description: "Perfect for your workouts",
        category: "Real World",
        icon: "headphones",
        pointsCost: 750,
        isAvailable: true
      }
    ];
    
    for (const reward of defaultRewards) {
      const id = this.currentRewardId++;
      this.rewards.set(id, { 
        ...reward, 
        id,
        isAvailable: reward.isAvailable || true 
      });
    }
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    
    // Create initial challenges for the user
    await this.createInitialChallenges(user.id);
    
    return user;
  }
  
  async updateUserPoints(userId: number, points: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;
    
    const newPoints = user.points + points;
    const newLevel = Math.floor(newPoints / 100) + 1;
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        points: newPoints, 
        level: newLevel 
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }
  
  async updateUserStreak(userId: number, streak: number): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ streakDays: streak })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }
  
  async updateUserProfile(userId: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;
    
    // Do not allow updating certain fields like id, points, level, etc.
    const { id, points, level, createdAt, ...allowedUpdates } = userData as any;
    
    const [updatedUser] = await db
      .update(users)
      .set(allowedUpdates)
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }

  // Challenge methods
  async getChallenges(userId: number): Promise<Challenge[]> {
    return db.select().from(challenges).where(eq(challenges.userId, userId));
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge || undefined;
  }

  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const [challenge] = await db
      .insert(challenges)
      .values(insertChallenge)
      .returning();
      
    return challenge;
  }
  
  async updateChallengeProgress(id: number, progress: number): Promise<Challenge | undefined> {
    const [updatedChallenge] = await db
      .update(challenges)
      .set({ progress })
      .where(eq(challenges.id, id))
      .returning();
      
    return updatedChallenge;
  }
  
  async completeChallenge(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    if (!challenge) return undefined;
    
    const [updatedChallenge] = await db
      .update(challenges)
      .set({ 
        isComplete: true,
        progress: 100
      })
      .where(eq(challenges.id, id))
      .returning();
    
    // Add points to user
    await this.updateUserPoints(challenge.userId, challenge.points);
    
    return updatedChallenge;
  }

  // Workout methods
  async getWorkouts(userId: number): Promise<Workout[]> {
    return db.select().from(workouts).where(eq(workouts.userId, userId));
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout || undefined;
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const [workout] = await db
      .insert(workouts)
      .values(insertWorkout)
      .returning();
      
    return workout;
  }
  
  async completeWorkout(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    if (!workout) return undefined;
    
    const now = new Date();
    const [updatedWorkout] = await db
      .update(workouts)
      .set({ completedDate: now })
      .where(eq(workouts.id, id))
      .returning();
    
    // Add basic points for completing a workout (30 points)
    await this.updateUserPoints(workout.userId, 30);
    
    return updatedWorkout;
  }

  // Achievement methods
  async getAchievements(userId: number): Promise<Achievement[]> {
    return db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values(insertAchievement)
      .returning();
      
    return achievement;
  }

  // Reward methods
  async getRewards(): Promise<Reward[]> {
    return db.select().from(rewards);
  }
  
  async getRewardById(id: number): Promise<Reward[]> {
    return db.select().from(rewards).where(eq(rewards.id, id));
  }
  
  async getUserRewards(userId: number): Promise<Reward[]> {
    return db
      .select({
        id: rewards.id,
        title: rewards.title,
        description: rewards.description,
        category: rewards.category,
        icon: rewards.icon,
        pointsCost: rewards.pointsCost,
        isAvailable: rewards.isAvailable
      })
      .from(userRewards)
      .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
      .where(eq(userRewards.userId, userId));
  }
  
  async redeemReward(userId: number, rewardId: number): Promise<UserReward | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
    
    if (!user || !reward) return undefined;
    
    // Check if user has enough points
    if (user.points < reward.pointsCost) return undefined;
    
    // Deduct points from user
    await this.updateUserPoints(userId, -reward.pointsCost);
    
    // Add reward to user
    const [userReward] = await db
      .insert(userRewards)
      .values({ userId, rewardId })
      .returning();
      
    return userReward;
  }

  // Spin Wheel methods
  async getSpinHistory(userId: number): Promise<SpinResult[]> {
    return db.select().from(spinResults).where(eq(spinResults.userId, userId));
  }
  
  async createSpinResult(insertSpinResult: InsertSpinResult): Promise<SpinResult> {
    const [spinResult] = await db
      .insert(spinResults)
      .values(insertSpinResult)
      .returning();
      
    // If points were awarded, update user points
    if (spinResult.points && spinResult.points > 0) {
      await this.updateUserPoints(spinResult.userId, spinResult.points);
    }
    
    return spinResult;
  }

  // Leaderboard
  async getLeaderboard(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.points));
  }
  
  // Helper methods
  private async createInitialChallenges(userId: number) {
    const challenges: InsertChallenge[] = [
      {
        title: "Morning Workout",
        description: "Complete a quick morning workout routine",
        category: "Fitness",
        icon: "dumbbell",
        points: 20,
        duration: 15,
        reps: null,
        userId
      },
      {
        title: "Hydration Goal",
        description: "Drink 8 cups of water today",
        category: "Hydration",
        icon: "glass-water",
        points: 15,
        duration: null,
        reps: 8,
        userId
      },
      {
        title: "Mindfulness Break",
        description: "Take 5 minutes for mindfulness meditation",
        category: "Mindfulness",
        icon: "brain",
        points: 10,
        duration: 5,
        reps: null,
        userId
      },
      {
        title: "Healthy Meal",
        description: "Log a healthy meal with protein and vegetables",
        category: "Nutrition",
        icon: "utensils",
        points: 15,
        duration: null,
        reps: null,
        userId
      }
    ];
    
    for (const challenge of challenges) {
      await this.createChallenge(challenge);
    }
  }
  
  // Initialize rewards
  async initializeRewards() {
    // Check if rewards exist
    const existingRewards = await db.select().from(rewards);
    if (existingRewards.length > 0) return;
    
    const defaultRewards: InsertReward[] = [
      {
        title: "Premium Avatar",
        description: "Unlock a premium avatar for your profile",
        category: "Digital",
        icon: "user-astronaut",
        pointsCost: 200,
        isAvailable: true
      },
      {
        title: "App Wallpaper",
        description: "Exclusive app wallpaper pack",
        category: "Digital",
        icon: "image",
        pointsCost: 100,
        isAvailable: true
      },
      {
        title: "$5 Gift Card",
        description: "Redeem for a $5 digital gift card",
        category: "Real World",
        icon: "gift",
        pointsCost: 500,
        isAvailable: true
      },
      {
        title: "Exclusive Badge",
        description: "Showcase a rare achievement badge on your profile",
        category: "Digital",
        icon: "medal",
        pointsCost: 150,
        isAvailable: true
      },
      {
        title: "Wireless Earbuds",
        description: "Perfect for your workouts",
        category: "Real World",
        icon: "headphones",
        pointsCost: 750,
        isAvailable: true
      }
    ];
    
    await db.insert(rewards).values(defaultRewards);
  }
}

// Initialize the storage
export const storage = new DatabaseStorage();

// Initialize rewards
(async () => {
  try {
    const dbStorage = storage as DatabaseStorage;
    await dbStorage.initializeRewards();
  } catch (error) {
    console.error("Error initializing rewards:", error);
  }
})();
