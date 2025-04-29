import { pgTable, text, serial, integer, boolean, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  avatarId: integer("avatar_id").notNull().default(1),
  level: integer("level").notNull().default(1),
  points: integer("points").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  fitnessGoal: text("fitness_goal"),
  workoutDaysPerWeek: integer("workout_days_per_week").notNull().default(3),
  themeColor: integer("theme_color").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull(),
  points: integer("points").notNull(),
  duration: integer("duration"), // in minutes
  reps: integer("reps"),
  isComplete: boolean("is_complete").notNull().default(false),
  progress: integer("progress").notNull().default(0),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" })
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  exercises: text("exercises").notNull(), // JSON stringified array of exercises
  duration: integer("duration").notNull(), // in minutes
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  completedDate: timestamp("completed_date")
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievedDate: timestamp("achieved_date").notNull().defaultNow()
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull(),
  pointsCost: integer("points_cost").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rewardId: integer("reward_id").notNull().references(() => rewards.id, { onDelete: "cascade" }),
  acquiredDate: timestamp("acquired_date").notNull().defaultNow()
});

export const spinResults = pgTable("spin_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reward: text("reward").notNull(),
  points: integer("points"),
  spinDate: timestamp("spin_date").notNull().defaultNow()
});

export const workoutHistory = pgTable("workout_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workoutId: integer("workout_id").references(() => workouts.id, { onDelete: "set null" }),
  challengeId: integer("challenge_id").references(() => challenges.id, { onDelete: "set null" }),
  caloriesBurned: integer("calories_burned").notNull().default(0),
  duration: integer("duration").notNull().default(0), // in seconds
  exerciseCount: integer("exercise_count").notNull().default(0),
  completedExercises: text("completed_exercises").notNull().default("[]"), // JSON stringified array
  notes: text("notes"),
  dateCompleted: timestamp("date_completed").notNull().defaultNow()
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  avatarId: true,
  fitnessGoal: true,
  workoutDaysPerWeek: true,
  themeColor: true
});

export const insertChallengeSchema = createInsertSchema(challenges).pick({
  title: true,
  description: true,
  category: true,
  icon: true,
  points: true,
  duration: true,
  reps: true,
  userId: true
});

export const insertWorkoutSchema = createInsertSchema(workouts).pick({
  title: true,
  description: true,
  exercises: true,
  duration: true,
  userId: true
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  title: true,
  description: true,
  icon: true,
  userId: true
});

export const insertRewardSchema = createInsertSchema(rewards).pick({
  title: true,
  description: true,
  category: true,
  icon: true,
  pointsCost: true,
  isAvailable: true
});

export const insertUserRewardSchema = createInsertSchema(userRewards).pick({
  userId: true,
  rewardId: true
});

export const insertSpinResultSchema = createInsertSchema(spinResults).pick({
  userId: true,
  reward: true,
  points: true
});

export const insertWorkoutHistorySchema = createInsertSchema(workoutHistory).pick({
  userId: true,
  workoutId: true,
  challengeId: true,
  caloriesBurned: true,
  duration: true,
  exerciseCount: true,
  completedExercises: true,
  notes: true
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

// Types for insert/select
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;

export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewards.$inferSelect;

export type InsertUserReward = z.infer<typeof insertUserRewardSchema>;
export type UserReward = typeof userRewards.$inferSelect;

export type InsertSpinResult = z.infer<typeof insertSpinResultSchema>;
export type SpinResult = typeof spinResults.$inferSelect;

export type Login = z.infer<typeof loginSchema>;

// Avatar types
export interface Avatar {
  id: number;
  imageUrl: string;
}

// Exercise type
export interface Exercise {
  id: number;
  name: string;
  description: string;
  instructions: string[];
  duration?: number; // in seconds
  reps?: number;
  imageUrl: string;
}

// Define relationships between tables
export const usersRelations = relations(users, ({ many }) => ({
  challenges: many(challenges),
  workouts: many(workouts),
  achievements: many(achievements),
  userRewards: many(userRewards),
  spinResults: many(spinResults)
}));

export const challengesRelations = relations(challenges, ({ one }) => ({
  user: one(users, {
    fields: [challenges.userId],
    references: [users.id]
  })
}));

export const workoutsRelations = relations(workouts, ({ one }) => ({
  user: one(users, {
    fields: [workouts.userId],
    references: [users.id]
  })
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id]
  })
}));

export const userRewardsRelations = relations(userRewards, ({ one }) => ({
  user: one(users, {
    fields: [userRewards.userId],
    references: [users.id]
  }),
  reward: one(rewards, {
    fields: [userRewards.rewardId],
    references: [rewards.id]
  })
}));

export const rewardsRelations = relations(rewards, ({ many }) => ({
  userRewards: many(userRewards)
}));

export const spinResultsRelations = relations(spinResults, ({ one }) => ({
  user: one(users, {
    fields: [spinResults.userId],
    references: [users.id]
  })
}));
