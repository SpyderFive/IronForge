import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Vibration,
  Modal,
  Animated,
  Easing,
  Switch,
  Appearance,
  Image,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  completed?: boolean;
}

interface ExerciseItem {
  id: string;
  name: string;
  targetMuscle: string;
  sets: ExerciseSet[];
}

interface Routine {
  id: string;
  name: string;
  createdAt: string;
  exercises: ExerciseItem[];
}

interface WorkoutSessionLog {
  id: string;
  routineName: string;
  completedAt: string;
  timestamp?: number;
  totalVolumeLbs: number;
  totalSetsCompleted: number;
  bestEstimated1RM: {
    exerciseName: string;
    value: number;
  } | null;
  exercises: ExerciseItem[];
}

interface PrebuiltTemplateExercise {
  name: string;
  muscle: string;
  defaultSets: number;
  reps: number;
}

interface PrebuiltTemplate {
  name: string;
  description: string;
  goal: string;
  exercises: PrebuiltTemplateExercise[];
}

interface PersonalRecord {
  exerciseName: string;
  targetMuscle: string;
  max1RM: number;
  achievedAt: string;
  hasData: boolean;
  historyEntries: {
    date: string;
    weight: number;
    reps: number;
    est1RM: number;
  }[];
}

interface ProgressPhoto {
  id: string;
  date: string;
  uri: string;
  weight: number;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  nickname: string;
  birthDate: string;
  age: number;
  heightInches: number;
  bodyWeightLbs: number;
  waistInches: number;
  targetWeightLbs: number;
  fitnessGoal: string;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFats: number;
  whtr: number;
  whtrStatus: string;
  avatarUrl: string;
  progressPhotos: ProgressPhoto[];
}

interface ThemePalette {
  id: string;
  name: string;
  primary: string;
  primaryLight: string;
  primaryGlow: string;
}

const THEME_OPTIONS: ThemePalette[] = [
  { id: 'amber', name: 'Molten Amber', primary: '#FF6B00', primaryLight: '#FF8533', primaryGlow: 'rgba(255, 107, 0, 0.25)' },
  { id: 'crimson', name: 'Crimson Blaze', primary: '#FF3B30', primaryLight: '#FF6961', primaryGlow: 'rgba(255, 59, 48, 0.25)' },
  { id: 'cyan', name: 'Electric Cyan', primary: '#00C7FF', primaryLight: '#54D6FF', primaryGlow: 'rgba(0, 199, 255, 0.25)' },
  { id: 'lime', name: 'Toxic Lime', primary: '#30D158', primaryLight: '#63E685', primaryGlow: 'rgba(48, 209, 88, 0.25)' },
  { id: 'gold', name: 'Solar Gold', primary: '#FFD60A', primaryLight: '#FFE147', primaryGlow: 'rgba(255, 214, 10, 0.25)' },
  { id: 'violet', name: 'Violet Flame', primary: '#BF5AF2', primaryLight: '#D383F7', primaryGlow: 'rgba(191, 90, 242, 0.25)' },
];

interface AppTheme {
  isDark: boolean;
  background: string;
  cardBg: string;
  cardBgAlt: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryLight: string;
  tabBarBg: string;
  inputBg: string;
}

const DARK_THEME: AppTheme = {
  isDark: true,
  background: '#09090D',
  cardBg: '#16161C',
  cardBgAlt: '#1B1B22',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E98',
  border: '#262634',
  primary: '#FF6B00',
  primaryLight: '#FF8533',
  tabBarBg: '#121217',
  inputBg: '#18181D',
};

const LIGHT_THEME: AppTheme = {
  isDark: false,
  background: '#F4F4F6',
  cardBg: '#FFFFFF',
  cardBgAlt: '#EBEBF0',
  textPrimary: '#1C1C1E',
  textSecondary: '#6C6C70',
  border: '#D1D1D6',
  primary: '#FF6B00',
  primaryLight: '#D95A00',
  tabBarBg: '#FFFFFF',
  inputBg: '#E5E5EA',
};

const FITNESS_GOALS = [
  'Hypertrophy & Muscle Building',
  'Strength & Powerlifting',
  'Fat Loss & Conditioning',
  'Bodyweight & Calisthenics',
  'General Fitness & Endurance',
];

const BIRTH_YEARS = Array.from({ length: 70 }, (_, i) => ({ label: (2026 - 10 - i).toString(), value: (2026 - 10 - i).toString() }));
const BIRTH_MONTHS = [
  { label: 'January (01)', value: '01' }, { label: 'February (02)', value: '02' }, { label: 'March (03)', value: '03' },
  { label: 'April (04)', value: '04' }, { label: 'May (05)', value: '05' }, { label: 'June (06)', value: '06' },
  { label: 'July (07)', value: '07' }, { label: 'August (08)', value: '08' }, { label: 'September (09)', value: '09' },
  { label: 'October (10)', value: '10' }, { label: 'November (11)', value: '11' }, { label: 'December (12)', value: '12' },
];
const BIRTH_DAYS = Array.from({ length: 31 }, (_, i) => ({ label: (i + 1).toString().padStart(2, '0'), value: (i + 1).toString().padStart(2, '0') }));

const DEFAULT_EXERCISES = [
  { id: 'c1', name: 'Barbell Bench Press', muscle: 'Chest' }, { id: 'c2', name: 'Incline Dumbbell Press', muscle: 'Chest' }, { id: 'c3', name: 'Chest Dips', muscle: 'Chest' }, { id: 'c6', name: 'Dumbbell Bench Press', muscle: 'Chest' }, { id: 'c7', name: 'Push-Ups', muscle: 'Chest' }, { id: 'c8', name: 'Cable Flyes', muscle: 'Chest' },
  { id: 'b1', name: 'Conventional Deadlift', muscle: 'Back' }, { id: 'b2', name: 'Barbell Bent-Over Row', muscle: 'Back' }, { id: 'b3', name: 'Lat Pulldown', muscle: 'Back' }, { id: 'b4', name: 'Pull-Ups / Chin-Ups', muscle: 'Back' }, { id: 'b5', name: 'Seated Cable Row', muscle: 'Back' }, { id: 'b6', name: 'Face Pulls', muscle: 'Back' },
  { id: 'l1', name: 'Barbell Back Squat', muscle: 'Legs' }, { id: 'l2', name: 'Romanian Deadlift (RDL)', muscle: 'Legs' }, { id: 'l3', name: 'Leg Press', muscle: 'Legs' }, { id: 'l9', name: 'Goblet Squat', muscle: 'Legs' }, { id: 'l10', name: 'Hamstring Leg Curls', muscle: 'Legs' }, { id: 'l11', name: 'Leg Extensions', muscle: 'Legs' }, { id: 'l12', name: 'Standing Calf Raises', muscle: 'Legs' },
  { id: 's1', name: 'Overhead Press (OHP)', muscle: 'Shoulders' }, { id: 's2', name: 'Dumbbell Lateral Raises', muscle: 'Shoulders' }, { id: 's3', name: 'Seated Dumbbell Shoulder Press', muscle: 'Shoulders' },
  { id: 'a1', name: 'Dumbbell Bicep Curl', muscle: 'Arms' }, { id: 'a4', name: 'Tricep Rope Pushdown', muscle: 'Arms' }, { id: 'a5', name: 'Skull Crushers', muscle: 'Arms' }, { id: 'a6', name: 'Hammer Curls', muscle: 'Arms' }, { id: 'a7', name: 'Barbell EZ-Bar Curl', muscle: 'Arms' },
  { id: 'co1', name: 'Hanging Leg Raises', muscle: 'Core' }, { id: 'co4', name: 'Plank', muscle: 'Core' }, { id: 'co5', name: 'Ab Wheel Rollouts', muscle: 'Core' }, { id: 'co6', name: 'Cable Woodchoppers', muscle: 'Core' }
];

const PREBUILT_ROUTINES: PrebuiltTemplate[] = [
  // HYPERTROPHY & MUSCLE BUILDING (10)
  { name: 'PPL: Push Day (Hypertrophy)', goal: 'Hypertrophy & Muscle Building', description: 'Volume-focused chest, shoulders, and triceps.', exercises: [{ name: 'Barbell Bench Press', muscle: 'Chest', defaultSets: 4, reps: 8 }, { name: 'Incline Dumbbell Press', muscle: 'Chest', defaultSets: 3, reps: 10 }, { name: 'Overhead Press (OHP)', muscle: 'Shoulders', defaultSets: 3, reps: 10 }, { name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', defaultSets: 4, reps: 15 }, { name: 'Tricep Rope Pushdown', muscle: 'Arms', defaultSets: 3, reps: 12 }] },
  { name: 'PPL: Pull Day (Hypertrophy)', goal: 'Hypertrophy & Muscle Building', description: 'Volume-focused back, rear delts, and biceps.', exercises: [{ name: 'Lat Pulldown', muscle: 'Back', defaultSets: 4, reps: 10 }, { name: 'Barbell Bent-Over Row', muscle: 'Back', defaultSets: 4, reps: 10 }, { name: 'Pull-Ups / Chin-Ups', muscle: 'Back', defaultSets: 3, reps: 12 }, { name: 'Dumbbell Bicep Curl', muscle: 'Arms', defaultSets: 4, reps: 12 }] },
  { name: 'PPL: Leg Day (Hypertrophy)', goal: 'Hypertrophy & Muscle Building', description: 'Volume-focused quads, hamstrings, and calves.', exercises: [{ name: 'Barbell Back Squat', muscle: 'Legs', defaultSets: 4, reps: 8 }, { name: 'Romanian Deadlift (RDL)', muscle: 'Legs', defaultSets: 4, reps: 10 }, { name: 'Leg Press', muscle: 'Legs', defaultSets: 3, reps: 12 }, { name: 'Standing Calf Raises', muscle: 'Legs', defaultSets: 4, reps: 15 }] },
  { name: 'Arnold Split: Chest & Back', goal: 'Hypertrophy & Muscle Building', description: 'Classic Arnold agonist/antagonist mass builder.', exercises: [{ name: 'Barbell Bench Press', muscle: 'Chest', defaultSets: 4, reps: 8 }, { name: 'Pull-Ups / Chin-Ups', muscle: 'Back', defaultSets: 4, reps: 8 }, { name: 'Incline Dumbbell Press', muscle: 'Chest', defaultSets: 3, reps: 10 }, { name: 'Barbell Bent-Over Row', muscle: 'Back', defaultSets: 3, reps: 10 }] },
  { name: 'Arnold Split: Shoulders & Arms', goal: 'Hypertrophy & Muscle Building', description: 'Massive arm and delt pump session.', exercises: [{ name: 'Overhead Press (OHP)', muscle: 'Shoulders', defaultSets: 4, reps: 8 }, { name: 'Skull Crushers', muscle: 'Arms', defaultSets: 4, reps: 10 }, { name: 'Barbell EZ-Bar Curl', muscle: 'Arms', defaultSets: 4, reps: 10 }, { name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', defaultSets: 4, reps: 15 }] },
  { name: 'Arnold Split: Legs & Calves', goal: 'Hypertrophy & Muscle Building', description: 'High volume quad and hamstring decimation.', exercises: [{ name: 'Barbell Back Squat', muscle: 'Legs', defaultSets: 4, reps: 8 }, { name: 'Leg Press', muscle: 'Legs', defaultSets: 4, reps: 12 }, { name: 'Hamstring Leg Curls', muscle: 'Legs', defaultSets: 4, reps: 12 }, { name: 'Standing Calf Raises', muscle: 'Legs', defaultSets: 5, reps: 20 }] },
  { name: 'Bro Split: Chest Day', goal: 'Hypertrophy & Muscle Building', description: 'Maximum chest isolation and volume.', exercises: [{ name: 'Barbell Bench Press', muscle: 'Chest', defaultSets: 4, reps: 8 }, { name: 'Incline Dumbbell Press', muscle: 'Chest', defaultSets: 4, reps: 10 }, { name: 'Chest Dips', muscle: 'Chest', defaultSets: 3, reps: 12 }, { name: 'Cable Flyes', muscle: 'Chest', defaultSets: 4, reps: 15 }] },
  { name: 'Bro Split: Back Day', goal: 'Hypertrophy & Muscle Building', description: 'Maximum back width and thickness.', exercises: [{ name: 'Conventional Deadlift', muscle: 'Back', defaultSets: 4, reps: 5 }, { name: 'Pull-Ups / Chin-Ups', muscle: 'Back', defaultSets: 4, reps: 8 }, { name: 'Barbell Bent-Over Row', muscle: 'Back', defaultSets: 4, reps: 10 }, { name: 'Seated Cable Row', muscle: 'Back', defaultSets: 3, reps: 12 }] },
  { name: 'Bro Split: Arms Day', goal: 'Hypertrophy & Muscle Building', description: 'Bicep and tricep superset pump.', exercises: [{ name: 'Barbell EZ-Bar Curl', muscle: 'Arms', defaultSets: 4, reps: 10 }, { name: 'Skull Crushers', muscle: 'Arms', defaultSets: 4, reps: 10 }, { name: 'Hammer Curls', muscle: 'Arms', defaultSets: 3, reps: 12 }, { name: 'Tricep Rope Pushdown', muscle: 'Arms', defaultSets: 3, reps: 12 }] },
  { name: 'Bro Split: Shoulders Day', goal: 'Hypertrophy & Muscle Building', description: 'Boulder shoulders isolation routine.', exercises: [{ name: 'Overhead Press (OHP)', muscle: 'Shoulders', defaultSets: 4, reps: 8 }, { name: 'Seated Dumbbell Shoulder Press', muscle: 'Shoulders', defaultSets: 3, reps: 10 }, { name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', defaultSets: 4, reps: 15 }, { name: 'Face Pulls', muscle: 'Back', defaultSets: 4, reps: 15 }] },

  // STRENGTH & POWERLIFTING (10)
  { name: '5x5: Workout A', goal: 'Strength & Powerlifting', description: 'Classic 5x5 strength builder. Focus on progressive overload.', exercises: [{ name: 'Barbell Back Squat', muscle: 'Legs', defaultSets: 5, reps: 5 }, { name: 'Barbell Bench Press', muscle: 'Chest', defaultSets: 5, reps: 5 }, { name: 'Barbell Bent-Over Row', muscle: 'Back', defaultSets: 5, reps: 5 }] },
  { name: '5x5: Workout B', goal: 'Strength & Powerlifting', description: 'Alternating 5x5 day for raw overhead & deadlift strength.', exercises: [{ name: 'Barbell Back Squat', muscle: 'Legs', defaultSets: 5, reps: 5 }, { name: 'Overhead Press (OHP)', muscle: 'Shoulders', defaultSets: 5, reps: 5 }, { name: 'Conventional Deadlift', muscle: 'Back', defaultSets: 1, reps: 5 }] },
  { name: 'Powerlifting: Squat Focus', goal: 'Strength & Powerlifting', description: 'Heavy squat focus with accessory work.', exercises: [{ name: 'Barbell Back Squat', muscle: 'Legs', defaultSets: 5, reps: 3 }, { name: 'Leg Press', muscle: 'Legs', defaultSets: 3, reps: 8 }, { name: 'Romanian Deadlift (RDL)', muscle: 'Legs', defaultSets: 3, reps: 8 }, { name: 'Plank', muscle: 'Core', defaultSets: 3, reps: 60 }] },
  { name: 'Powerlifting: Bench Focus', goal: 'Strength & Powerlifting', description: 'Heavy bench focus with tricep accessories.', exercises: [{ name: 'Barbell Bench Press', muscle: 'Chest', defaultSets: 5, reps: 3 }, { name: 'Incline Dumbbell Press', muscle: 'Chest', defaultSets: 3, reps: 8 }, { name: 'Skull Crushers', muscle: 'Arms', defaultSets: 3, reps: 10 }, { name: 'Barbell Bent-Over Row', muscle: 'Back', defaultSets: 3, reps: 8 }] },
  { name: 'Powerlifting: Deadlift Focus', goal: 'Strength & Powerlifting', description: 'Heavy pulls to build a massive posterior chain.', exercises: [{ name: 'Conventional Deadlift', muscle: 'Back', defaultSets: 5, reps: 3 }, { name: 'Pull-Ups / Chin-Ups', muscle: 'Back', defaultSets: 3, reps: 6 }, { name: 'Hamstring Leg Curls', muscle: 'Legs', defaultSets: 3, reps: 10 }, { name: 'Hanging Leg Raises', muscle: 'Core', defaultSets: 3, reps: 12 }] },
  { name: 'The Big 3 Builder', goal: 'Strength & Powerlifting', description: 'Squat, Bench, and Deadlift in one brutal strength session.', exercises: [{ name: 'Barbell Back Squat', muscle: 'Legs', defaultSets: 3, reps: 5 }, { name: 'Barbell Bench Press', muscle: 'Chest', defaultSets: 3, reps: 5 }, { name: 'Conventional Deadlift', muscle: 'Back', defaultSets: 3, reps: 5 }] },
  { name: 'Upper Body Power (P.H.U.L.)', goal: 'Strength & Powerlifting', description: 'Low rep upper body strength day.', exercises: [{ name: 'Barbell Bench Press', muscle: 'Chest', defaultSets: 4, reps: 5 }, { name: 'Barbell Bent-Over Row', muscle: 'Back', defaultSets: 4, reps: 5 }, { name: 'Overhead Press (OHP)', muscle: 'Shoulders', defaultSets: 3, reps: 6 }, { name: 'Skull Crushers', muscle: 'Arms', defaultSets: 3, reps: 8 }] },
  { name: 'Lower Body Power (P.H.U.L.)', goal: 'Strength & Powerlifting', description: 'Low rep lower body strength day.', exercises: [{ name: 'Barbell Back Squat', muscle: 'Legs', defaultSets: 4, reps: 5 }, { name: 'Conventional Deadlift', muscle: 'Back', defaultSets: 4, reps: 5 }, { name: 'Leg Press', muscle: 'Legs', defaultSets: 3, reps: 8 }, { name: 'Standing Calf Raises', muscle: 'Legs', defaultSets: 4, reps: 10 }] },
  { name: 'Push Press Power', goal: 'Strength & Powerlifting', description: 'Shoulder and tricep absolute strength.', exercises: [{ name: 'Overhead Press (OHP)', muscle: 'Shoulders', defaultSets: 5, reps: 3 }, { name: 'Chest Dips', muscle: 'Chest', defaultSets: 4, reps: 6 }, { name: 'Seated Dumbbell Shoulder Press', muscle: 'Shoulders', defaultSets: 3, reps: 8 }] },
  { name: 'Deadlift Grip & Lockout', goal: 'Strength & Powerlifting', description: 'Focus on heavy pulls and upper back rigidity.', exercises: [{ name: 'Conventional Deadlift', muscle: 'Back', defaultSets: 5, reps: 2 }, { name: 'Romanian Deadlift (RDL)', muscle: 'Legs', defaultSets: 3, reps: 8 }, { name: 'Barbell Bent-Over Row', muscle: 'Back', defaultSets: 4, reps: 6 }] },

  // FAT LOSS & CONDITIONING (10)
  { name: 'Full Body Fat Burner A', goal: 'Fat Loss & Conditioning', description: 'High intensity compound lifts with minimal rest.', exercises: [{ name: 'Goblet Squat', muscle: 'Legs', defaultSets: 4, reps: 15 }, { name: 'Push-Ups', muscle: 'Chest', defaultSets: 4, reps: 15 }, { name: 'Plank', muscle: 'Core', defaultSets: 4, reps: 60 }] },
  { name: 'Full Body Fat Burner B', goal: 'Fat Loss & Conditioning', description: 'Dumbbell-focused high heart rate circuit.', exercises: [{ name: 'Dumbbell Bench Press', muscle: 'Chest', defaultSets: 4, reps: 15 }, { name: 'Lat Pulldown', muscle: 'Back', defaultSets: 4, reps: 15 }, { name: 'Ab Wheel Rollouts', muscle: 'Core', defaultSets: 3, reps: 12 }] },
  { name: 'Metabolic Leg Crusher', goal: 'Fat Loss & Conditioning', description: 'Keep the heart rate up through massive lower body volume.', exercises: [{ name: 'Barbell Back Squat', muscle: 'Legs', defaultSets: 3, reps: 15 }, { name: 'Leg Press', muscle: 'Legs', defaultSets: 3, reps: 20 }, { name: 'Standing Calf Raises', muscle: 'Legs', defaultSets: 3, reps: 20 }] },
  { name: 'Upper Body Shred Circuit', goal: 'Fat Loss & Conditioning', description: 'Fast-paced upper body toning and definition.', exercises: [{ name: 'Dumbbell Bench Press', muscle: 'Chest', defaultSets: 3, reps: 15 }, { name: 'Lat Pulldown', muscle: 'Back', defaultSets: 3, reps: 15 }, { name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', defaultSets: 3, reps: 15 }, { name: 'Tricep Rope Pushdown', muscle: 'Arms', defaultSets: 3, reps: 15 }] },
  { name: 'Core Shredder', goal: 'Fat Loss & Conditioning', description: 'High-volume abdominal and core circuit.', exercises: [{ name: 'Hanging Leg Raises', muscle: 'Core', defaultSets: 4, reps: 15 }, { name: 'Cable Woodchoppers', muscle: 'Core', defaultSets: 4, reps: 15 }, { name: 'Plank', muscle: 'Core', defaultSets: 4, reps: 60 }] },
  { name: 'Barbell Complex Conditioning', goal: 'Fat Loss & Conditioning', description: 'Use one barbell for the whole routine with minimal rest.', exercises: [{ name: 'Conventional Deadlift', muscle: 'Back', defaultSets: 3, reps: 12 }, { name: 'Barbell Bent-Over Row', muscle: 'Back', defaultSets: 3, reps: 12 }, { name: 'Overhead Press (OHP)', muscle: 'Shoulders', defaultSets: 3, reps: 12 }, { name: 'Barbell Back Squat', muscle: 'Legs', defaultSets: 3, reps: 12 }] },
  { name: 'Dumbbell HIIT Complex', goal: 'Fat Loss & Conditioning', description: 'HIIT style interval workout using dumbbells.', exercises: [{ name: 'Goblet Squat', muscle: 'Legs', defaultSets: 4, reps: 20 }, { name: 'Dumbbell Bench Press', muscle: 'Chest', defaultSets: 4, reps: 20 }, { name: 'Seated Dumbbell Shoulder Press', muscle: 'Shoulders', defaultSets: 3, reps: 15 }] },
  { name: 'Legs & Lungs Burner', goal: 'Fat Loss & Conditioning', description: 'Squats and presses to burn maximum calories.', exercises: [{ name: 'Leg Press', muscle: 'Legs', defaultSets: 4, reps: 20 }, { name: 'Goblet Squat', muscle: 'Legs', defaultSets: 4, reps: 15 }, { name: 'Standing Calf Raises', muscle: 'Legs', defaultSets: 4, reps: 25 }] },
  { name: 'Conditioning & Core Stability', goal: 'Fat Loss & Conditioning', description: 'Mix of cardio pacing and midsection stabilization.', exercises: [{ name: 'Ab Wheel Rollouts', muscle: 'Core', defaultSets: 4, reps: 15 }, { name: 'Hanging Leg Raises', muscle: 'Core', defaultSets: 4, reps: 15 }, { name: 'Plank', muscle: 'Core', defaultSets: 4, reps: 60 }] },
  { name: 'Hotel Gym Cut Protocol', goal: 'Fat Loss & Conditioning', description: 'Quick calorie burner when only light dumbbells are available.', exercises: [{ name: 'Goblet Squat', muscle: 'Legs', defaultSets: 4, reps: 20 }, { name: 'Dumbbell Bench Press', muscle: 'Chest', defaultSets: 4, reps: 20 }, { name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', defaultSets: 4, reps: 20 }] },

  // BODYWEIGHT & CALISTHENICS (10)
  { name: 'Calisthenics: Push Day', goal: 'Bodyweight & Calisthenics', description: 'Master your bodyweight for pushing muscles.', exercises: [{ name: 'Push-Ups', muscle: 'Chest', defaultSets: 4, reps: 20 }, { name: 'Chest Dips', muscle: 'Chest', defaultSets: 4, reps: 12 }, { name: 'Plank', muscle: 'Core', defaultSets: 3, reps: 60 }] },
  { name: 'Calisthenics: Pull Day', goal: 'Bodyweight & Calisthenics', description: 'Build a massive back with zero weights.', exercises: [{ name: 'Pull-Ups / Chin-Ups', muscle: 'Back', defaultSets: 5, reps: 10 }, { name: 'Hanging Leg Raises', muscle: 'Core', defaultSets: 4, reps: 12 }] },
  { name: 'Calisthenics: Legs & Core', goal: 'Bodyweight & Calisthenics', description: 'Bodyweight leg endurance and abdominal stability.', exercises: [{ name: 'Hanging Leg Raises', muscle: 'Core', defaultSets: 4, reps: 15 }, { name: 'Plank', muscle: 'Core', defaultSets: 4, reps: 60 }, { name: 'Standing Calf Raises', muscle: 'Legs', defaultSets: 4, reps: 30 }] },
  { name: 'Street Workout Basics', goal: 'Bodyweight & Calisthenics', description: 'Hit everything on the outdoor bars.', exercises: [{ name: 'Pull-Ups / Chin-Ups', muscle: 'Back', defaultSets: 4, reps: 10 }, { name: 'Chest Dips', muscle: 'Chest', defaultSets: 4, reps: 10 }, { name: 'Push-Ups', muscle: 'Chest', defaultSets: 4, reps: 15 }] },
  { name: 'Advanced Core Balance', goal: 'Bodyweight & Calisthenics', description: 'Develop incredible core strength.', exercises: [{ name: 'Hanging Leg Raises', muscle: 'Core', defaultSets: 4, reps: 15 }, { name: 'Ab Wheel Rollouts', muscle: 'Core', defaultSets: 4, reps: 10 }, { name: 'Plank', muscle: 'Core', defaultSets: 5, reps: 60 }] },
  { name: '100 Rep Push-Up Challenge', goal: 'Bodyweight & Calisthenics', description: 'Break 100 reps into manageable sets.', exercises: [{ name: 'Push-Ups', muscle: 'Chest', defaultSets: 5, reps: 20 }] },
  { name: '50 Rep Pull-Up Challenge', goal: 'Bodyweight & Calisthenics', description: 'Build your pulling endurance.', exercises: [{ name: 'Pull-Ups / Chin-Ups', muscle: 'Back', defaultSets: 5, reps: 10 }] },
  { name: 'Upper Body Isometric Flow', goal: 'Bodyweight & Calisthenics', description: 'Focus on slow, controlled bodyweight movements.', exercises: [{ name: 'Push-Ups', muscle: 'Chest', defaultSets: 4, reps: 10 }, { name: 'Pull-Ups / Chin-Ups', muscle: 'Back', defaultSets: 4, reps: 5 }, { name: 'Chest Dips', muscle: 'Chest', defaultSets: 3, reps: 8 }] },
  { name: 'Bodyweight Bar Circuit', goal: 'Bodyweight & Calisthenics', description: 'Continuous calisthenic superset.', exercises: [{ name: 'Pull-Ups / Chin-Ups', muscle: 'Back', defaultSets: 3, reps: 8 }, { name: 'Push-Ups', muscle: 'Chest', defaultSets: 3, reps: 15 }, { name: 'Hanging Leg Raises', muscle: 'Core', defaultSets: 3, reps: 10 }] },
  { name: 'Ab Wheel & Plank Mastery', goal: 'Bodyweight & Calisthenics', description: 'Pure rolling core destruction.', exercises: [{ name: 'Ab Wheel Rollouts', muscle: 'Core', defaultSets: 5, reps: 10 }, { name: 'Plank', muscle: 'Core', defaultSets: 4, reps: 60 }] },

  // GENERAL FITNESS & ENDURANCE (10)
  { name: 'Functional Full Body A', goal: 'General Fitness & Endurance', description: 'Balanced routine for overall health.', exercises: [{ name: 'Goblet Squat', muscle: 'Legs', defaultSets: 3, reps: 12 }, { name: 'Push-Ups', muscle: 'Chest', defaultSets: 3, reps: 15 }, { name: 'Lat Pulldown', muscle: 'Back', defaultSets: 3, reps: 12 }, { name: 'Plank', muscle: 'Core', defaultSets: 3, reps: 60 }] },
  { name: 'Functional Full Body B', goal: 'General Fitness & Endurance', description: 'Balanced routine for overall health.', exercises: [{ name: 'Romanian Deadlift (RDL)', muscle: 'Legs', defaultSets: 3, reps: 12 }, { name: 'Seated Dumbbell Shoulder Press', muscle: 'Shoulders', defaultSets: 3, reps: 12 }, { name: 'Cable Woodchoppers', muscle: 'Core', defaultSets: 3, reps: 12 }] },
  { name: 'Endurance: Light Lifts', goal: 'General Fitness & Endurance', description: 'Build muscular endurance with high reps.', exercises: [{ name: 'Leg Press', muscle: 'Legs', defaultSets: 3, reps: 20 }, { name: 'Dumbbell Bench Press', muscle: 'Chest', defaultSets: 3, reps: 20 }, { name: 'Seated Cable Row', muscle: 'Back', defaultSets: 3, reps: 20 }] },
  { name: 'The Quick 30-Min Visit', goal: 'General Fitness & Endurance', description: 'In and out fast with full body benefits.', exercises: [{ name: 'Leg Press', muscle: 'Legs', defaultSets: 3, reps: 12 }, { name: 'Chest Dips', muscle: 'Chest', defaultSets: 3, reps: 10 }, { name: 'Lat Pulldown', muscle: 'Back', defaultSets: 3, reps: 12 }] },
  { name: 'Healthy Lower Back Focus', goal: 'General Fitness & Endurance', description: 'Build resilience in the lumbar spine.', exercises: [{ name: 'Romanian Deadlift (RDL)', muscle: 'Legs', defaultSets: 4, reps: 12 }, { name: 'Plank', muscle: 'Core', defaultSets: 4, reps: 60 }, { name: 'Hanging Leg Raises', muscle: 'Core', defaultSets: 3, reps: 12 }] },
  { name: 'Machine-Only Full Body', goal: 'General Fitness & Endurance', description: 'No free weights, purely guided movements.', exercises: [{ name: 'Leg Press', muscle: 'Legs', defaultSets: 3, reps: 12 }, { name: 'Lat Pulldown', muscle: 'Back', defaultSets: 3, reps: 12 }, { name: 'Tricep Rope Pushdown', muscle: 'Arms', defaultSets: 3, reps: 15 }] },
  { name: 'Posture Corrector Routine', goal: 'General Fitness & Endurance', description: 'Strengthen the back and rear delts to fix slouching.', exercises: [{ name: 'Face Pulls', muscle: 'Back', defaultSets: 4, reps: 15 }, { name: 'Seated Cable Row', muscle: 'Back', defaultSets: 4, reps: 12 }, { name: 'Plank', muscle: 'Core', defaultSets: 3, reps: 60 }] },
  { name: 'Light Upper Body Pump', goal: 'General Fitness & Endurance', description: 'Feel-good recovery and tone workout.', exercises: [{ name: 'Cable Flyes', muscle: 'Chest', defaultSets: 3, reps: 15 }, { name: 'Dumbbell Bicep Curl', muscle: 'Arms', defaultSets: 3, reps: 15 }, { name: 'Tricep Rope Pushdown', muscle: 'Arms', defaultSets: 3, reps: 15 }, { name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', defaultSets: 3, reps: 15 }] },
  { name: 'Light Lower Body Pump', goal: 'General Fitness & Endurance', description: 'Blood flow and joint movement for leg recovery.', exercises: [{ name: 'Leg Extensions', muscle: 'Legs', defaultSets: 3, reps: 15 }, { name: 'Hamstring Leg Curls', muscle: 'Legs', defaultSets: 3, reps: 15 }, { name: 'Standing Calf Raises', muscle: 'Legs', defaultSets: 3, reps: 20 }] },
  { name: 'Joint Mobility & Full ROM', goal: 'General Fitness & Endurance', description: 'Light weight focus on full range of motion.', exercises: [{ name: 'Goblet Squat', muscle: 'Legs', defaultSets: 3, reps: 15 }, { name: 'Face Pulls', muscle: 'Back', defaultSets: 3, reps: 15 }, { name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', defaultSets: 3, reps: 15 }] },
];

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
const REST_OPTIONS = [60, 90, 120, 150];

const calculate1RM = (weight: number, reps: number): number => {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
};

const calculatePlatesPerSide = (totalWeight: number) => {
  if (totalWeight <= 45) return [];
  let remainingPerSide = (totalWeight - 45) / 2;
  const plateTypes = [45, 25, 10, 5, 2.5];
  const plates: { plate: number; count: number }[] = [];
  for (const p of plateTypes) {
    if (remainingPerSide >= p) {
      const count = Math.floor(remainingPerSide / p);
      plates.push({ plate: p, count });
      remainingPerSide -= count * p;
    }
  }
  return plates;
};

const triggerRestFinishedAlert = () => {
  try { Vibration.vibrate([0, 500, 200, 500]); } catch (e) { console.log('Vibration not supported', e); }
  try {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const playBeep = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + startTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(audioCtx.currentTime + startTime); osc.stop(audioCtx.currentTime + startTime + duration);
      };
      playBeep(880, 0, 0.15); playBeep(880, 0.2, 0.15); playBeep(1174.66, 0.4, 0.35);
    }
  } catch (e) { console.log('Web audio beep not supported', e); }
};

// Reusable Custom Dropdown Picker Component
const DropdownPicker = ({ label, value, options, onSelect, theme }: { label?: string, value: string, options: { label: string, value: string }[], onSelect: (val: string) => void, theme: AppTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || value;
  return (
    <View style={{ marginBottom: 12 }}>
      {label && <Text style={[styles.modalLabel, { color: theme.textSecondary, marginBottom: 6, marginTop: 0 }]}>{label}</Text>}
      <TouchableOpacity 
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, backgroundColor: theme.cardBgAlt, borderColor: theme.border }} 
        onPress={() => setIsOpen(true)} 
        activeOpacity={0.8}
      >
        <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '500' }}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
      </TouchableOpacity>
      <Modal visible={isOpen} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <View style={{ width: '100%', maxHeight: 300, borderRadius: 12, borderWidth: 1, overflow: 'hidden', backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <FlatList data={options} keyExtractor={(item) => item.value} showsVerticalScrollIndicator={true} renderItem={({ item }) => (
              <TouchableOpacity style={{ padding: 16, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', borderBottomColor: theme.cardBgAlt }} onPress={() => { onSelect(item.value); setIsOpen(false); }}>
                <Text style={{ color: item.value === value ? theme.primaryLight : theme.textPrimary, fontWeight: item.value === value ? 'bold' : 'normal', fontSize: 16 }}>{item.label}</Text>
                {item.value === value && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
              </TouchableOpacity>
            )} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Pulsing Forge Logo Component
function ForgeLogo({ size = 140, themeColor = '#FF6B00' }: { size?: number; themeColor?: string }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, [pulseAnim]);

  const glowScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] });
  const glowOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.95] });
  const moltenPulse = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={[styles.logoContainer, { width: size, height: size, borderRadius: size / 2, borderColor: themeColor + '55' }]}>
      <Animated.View style={[styles.logoBreathingAura, { width: size * 1.08, height: size * 1.08, borderRadius: (size * 1.08) / 2, backgroundColor: themeColor + '44', shadowColor: themeColor, transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
      <View style={[styles.logoHalo, { width: size * 0.94, height: size * 0.94, borderRadius: (size * 0.94) / 2, borderColor: themeColor + '88' }]} />
      <View style={styles.hammerContainer}>
        <View style={styles.hammerHandle} />
        <View style={styles.hammerHead}><View style={styles.hammerBevelLeft} /><View style={styles.hammerFace} /><View style={styles.hammerBevelRight} /></View>
      </View>
      <Animated.View style={[styles.sparksContainer, { opacity: moltenPulse }]}>
        <View style={[styles.sparkDot, { top: -6, left: 14, width: 4, height: 4, backgroundColor: themeColor }]} />
        <View style={[styles.sparkDot, { top: -14, left: 32, width: 3, height: 3, backgroundColor: themeColor }]} />
        <View style={[styles.sparkDot, { top: -8, right: 18, width: 4, height: 4, backgroundColor: themeColor }]} />
        <View style={[styles.sparkDot, { top: -16, right: 34, width: 2.5, height: 2.5, backgroundColor: themeColor }]} />
      </Animated.View>
      <View style={styles.moltenBarWrapper}>
        <Animated.View style={[styles.moltenGlowBackdrop, { backgroundColor: themeColor, shadowColor: themeColor, opacity: moltenPulse }]} />
        <View style={styles.moltenSteelCore} />
      </View>
      <View style={styles.anvilComplete}>
        <View style={styles.anvilFaceRow}><View style={styles.anvilHornPoint} /><View style={styles.anvilStep} /><View style={styles.anvilFaceTop} /><View style={styles.anvilHeelRight} /></View>
        <View style={styles.anvilWaist} />
        <View style={styles.anvilFeetBase} />
      </View>
    </View>
  );
}

// Function declarations that were missing in previous iteration
const handleAddNewCustomExerciseHelper = (name: string, muscle: string, catalog: typeof DEFAULT_EXERCISES, setCatalog: React.Dispatch<React.SetStateAction<typeof DEFAULT_EXERCISES>>, setName: React.Dispatch<React.SetStateAction<string>>) => {
  if (!name.trim()) return;
  const newEx = {
    id: Date.now().toString(),
    name: name.trim(),
    muscle,
  };
  setCatalog([newEx, ...catalog]);
  setName('');
  alert(`Custom movement "${newEx.name}" forged into catalog!`);
};

export default function App() {
  const [view, setView] = useState<'welcome' | 'welcomeBack' | 'onboarding' | 'postOnboarding' | 'dashboard' | 'create' | 'active'>('welcome');
  const [activeTab, setActiveTab] = useState<'home' | 'routines' | 'templates' | 'history' | 'profile'>('home');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [history, setHistory] = useState<WorkoutSessionLog[]>([]);
  const [routineName, setRoutineName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<ExerciseItem[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<Routine | null>(null);

  const globalFadeAnim = useRef(new Animated.Value(0)).current;
  const globalScaleAnim = useRef(new Animated.Value(0.96)).current;

  const navigateToView = useCallback((nextView: any, nextTab?: any) => {
    Animated.parallel([
      Animated.timing(globalFadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(globalScaleAnim, { toValue: 0.96, duration: 150, useNativeDriver: true })
    ]).start(() => {
      setView(nextView);
      if (nextTab) setActiveTab(nextTab);
      Animated.parallel([
        Animated.timing(globalFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(globalScaleAnim, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true })
      ]).start();
    });
  }, [globalFadeAnim, globalScaleAnim]);

  const [onboardStep, setOnboardStep] = useState<number>(1);
  const [onboardFirstName, setOnboardFirstName] = useState('');
  const [onboardLastName, setOnboardLastName] = useState('');
  const [onboardNickname, setOnboardNickname] = useState('');
  const [birthYear, setBirthYear] = useState('1995');
  const [birthMonth, setBirthMonth] = useState('06');
  const [birthDay, setBirthDay] = useState('15');
  const [onboardHeight, setOnboardHeight] = useState<number>(70);
  const [onboardWeight, setOnboardWeight] = useState<number>(175);
  const [onboardWaist, setOnboardWaist] = useState<number>(32);
  const [onboardTargetWeight, setOnboardTargetWeight] = useState<number>(180);
  const [onboardGoal, setOnboardGoal] = useState('Hypertrophy & Muscle Building');

  const stepFadeAnim = useRef(new Animated.Value(1)).current;
  const triggerStepTransition = (nextStep: number) => {
    Animated.timing(stepFadeAnim, { toValue: 0, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }).start(() => {
      setOnboardStep(nextStep);
      Animated.timing(stepFadeAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    });
  };

  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: 'Iron', lastName: 'Forger', nickname: 'ForgeMaster', birthDate: '1995-06-15', age: 31,
    heightInches: 70, bodyWeightLbs: 175, waistInches: 32, targetWeightLbs: 180, fitnessGoal: 'Hypertrophy & Muscle Building',
    dailyCalories: 2800, dailyProtein: 180, dailyCarbs: 310, dailyFats: 78, whtr: 0.45, whtrStatus: 'Normal (Low Risk)', avatarUrl: '', progressPhotos: [],
  });
  
  const [biometricsEditModalVisible, setBiometricsEditModalVisible] = useState(false);
  const [identityEditModalVisible, setIdentityEditModalVisible] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(userProfile);
  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(Appearance.getColorScheme() !== 'light');
  const [activeTheme, setActiveTheme] = useState<ThemePalette>(THEME_OPTIONS[0]);
  const currentTheme: AppTheme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  const [showMicroStats, setShowMicroStats] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTrophyVault, setShowTrophyVault] = useState(true);
  const [showHeroCard, setShowHeroCard] = useState(true);
  const [healthSyncEnabled, setHealthSyncEnabled] = useState(false);
  
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [historyViewMode, setHistoryViewMode] = useState<'list' | 'chart'>('list');
  const [templateFilter, setTemplateFilter] = useState<string>('Recommended');

  const [selectedPRToInspect, setSelectedPRToInspect] = useState<PersonalRecord | null>(null);

  const [exerciseCatalog, setExerciseCatalog] = useState(DEFAULT_EXERCISES);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customExerciseMuscle, setCustomExerciseMuscle] = useState('Chest');

  const [configuringExercise, setConfiguringExercise] = useState<{ name: string; muscle: string } | null>(null);
  const [configSets, setConfigSets] = useState('3');
  const [configReps, setConfigReps] = useState('10');

  const [activeAddExerciseModalVisible, setActiveAddExerciseModalVisible] = useState(false);
  const [activeExerciseSearchQuery, setActiveExerciseSearchQuery] = useState('');
  const [activeExerciseCategory, setActiveExerciseCategory] = useState('All');
  const [activeCustomExName, setActiveCustomExName] = useState('');
  const [activeCustomExMuscle, setActiveCustomExMuscle] = useState('Chest');

  const [selectedRestDuration, setSelectedRestDuration] = useState<number>(90);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [isTimerModalVisible, setIsTimerModalVisible] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [calcModalVisible, setCalcModalVisible] = useState(false);
  const [calcExerciseName, setCalcExerciseName] = useState('');
  const [calcTargetWeight, setCalcTargetWeight] = useState<number>(135);

  const handleAddNewCustomExercise = () => {
    handleAddNewCustomExerciseHelper(customExerciseName, customExerciseMuscle, exerciseCatalog, setExerciseCatalog, setCustomExerciseName);
  };

  const loadInitialData = useCallback(async () => {
    try {
      const storedRoutines = await AsyncStorage.getItem('@workout_routines');
      if (storedRoutines) setRoutines(JSON.parse(storedRoutines));

      const storedHistory = await AsyncStorage.getItem('@workout_history');
      if (storedHistory) setHistory(JSON.parse(storedHistory));

      const storedProfile = await AsyncStorage.getItem('@user_profile_data');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setUserProfile(parsed); setTempProfile(parsed); setView('welcomeBack');
      } else { setView('welcome'); }

      const storedDarkMode = await AsyncStorage.getItem('@is_dark_mode');
      if (storedDarkMode !== null) setIsDarkMode(storedDarkMode === 'true');

      const storedThemeId = await AsyncStorage.getItem('@theme_id');
      if (storedThemeId) { const found = THEME_OPTIONS.find((t) => t.id === storedThemeId); if (found) setActiveTheme(found); }

      const storedWidgets = await AsyncStorage.getItem('@dashboard_widgets');
      if (storedWidgets) {
        const parsed = JSON.parse(storedWidgets);
        if (parsed.showMicroStats !== undefined) setShowMicroStats(parsed.showMicroStats);
        if (parsed.showHeatmap !== undefined) setShowHeatmap(parsed.showHeatmap);
        if (parsed.showTrophyVault !== undefined) setShowTrophyVault(parsed.showTrophyVault);
        if (parsed.showHeroCard !== undefined) setShowHeroCard(parsed.showHeroCard);
        if (parsed.healthSyncEnabled !== undefined) setHealthSyncEnabled(parsed.healthSyncEnabled);
      }

      Animated.parallel([
        Animated.timing(globalFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(globalScaleAnim, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true })
      ]).start();

    } catch (e) { console.error(e); }
  }, [globalFadeAnim, globalScaleAnim]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  useEffect(() => {
    if (view === 'postOnboarding') {
      const timeout = setTimeout(() => { navigateToView('dashboard', 'home'); }, 3000);
      return () => clearTimeout(timeout);
    }
    if (view === 'welcomeBack') {
      const timeout = setTimeout(() => { navigateToView('dashboard', 'home'); }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [view, navigateToView]);

  useEffect(() => {
    if (restSecondsLeft !== null && restSecondsLeft > 0) {
      timerIntervalRef.current = setTimeout(() => {
        setRestSecondsLeft((prev) => {
          if (prev === null) return null;
          if (prev <= 1) { triggerRestFinishedAlert(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerIntervalRef.current) clearTimeout(timerIntervalRef.current); };
  }, [restSecondsLeft]);

  const calculateAgeAndBiometrics = (birthDateStr: string, heightIn: number, weightLbs: number, waistIn: number, goal: string) => {
    const birthDate = new Date(birthDateStr); const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    if (isNaN(age) || age < 10) age = 25;

    const whtr = parseFloat((waistIn / heightIn).toFixed(2));
    let whtrStatus = 'Normal (Low Risk)';
    if (whtr >= 0.6) whtrStatus = 'High Risk (Action Needed)'; else if (whtr >= 0.5) whtrStatus = 'Increased Risk';

    const weightKg = weightLbs / 2.20462; const heightCm = heightIn * 2.54;
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    let tdee = Math.round(bmr * 1.55);

    if (goal.toLowerCase().includes('cut') || goal.toLowerCase().includes('fat loss')) tdee -= 400;
    else if (goal.toLowerCase().includes('hypertrophy') || goal.toLowerCase().includes('strength') || goal.toLowerCase().includes('powerlifting') || goal.toLowerCase().includes('muscle')) tdee += 300;

    const proteinGrams = Math.round(weightLbs * 0.9);
    const fatCals = tdee * 0.25;
    const fatGrams = Math.round(fatCals / 9);
    const carbCals = tdee - (proteinGrams * 4) - fatCals;
    const carbGrams = Math.max(0, Math.round(carbCals / 4));

    return { age, whtr, whtrStatus, dailyCalories: tdee, dailyProtein: proteinGrams, dailyCarbs: carbGrams, dailyFats: fatGrams };
  };

  const handleCompleteOnboarding = async () => {
    if (!onboardFirstName.trim()) { alert('Please enter your first name.'); return; }
    const formattedBirthDate = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
    const bio = calculateAgeAndBiometrics(formattedBirthDate, onboardHeight, onboardWeight, onboardWaist, onboardGoal);

    const newProfile: UserProfile = {
      firstName: onboardFirstName.trim(), lastName: onboardLastName.trim(), nickname: onboardNickname.trim(),
      birthDate: formattedBirthDate, age: bio.age, heightInches: onboardHeight, bodyWeightLbs: onboardWeight,
      waistInches: onboardWaist, targetWeightLbs: onboardTargetWeight, fitnessGoal: onboardGoal,
      dailyCalories: bio.dailyCalories, dailyProtein: bio.dailyProtein, dailyCarbs: bio.dailyCarbs, dailyFats: bio.dailyFats,
      whtr: bio.whtr, whtrStatus: bio.whtrStatus, avatarUrl: '', progressPhotos: [],
    };

    setUserProfile(newProfile); setTempProfile(newProfile);
    await AsyncStorage.setItem('@user_profile_data', JSON.stringify(newProfile));
    navigateToView('postOnboarding');
  };

  const handleSaveBiometrics = async () => {
    const bio = calculateAgeAndBiometrics(userProfile.birthDate, tempProfile.heightInches, tempProfile.bodyWeightLbs, tempProfile.waistInches, userProfile.fitnessGoal);
    const updated: UserProfile = { ...userProfile, heightInches: tempProfile.heightInches, bodyWeightLbs: tempProfile.bodyWeightLbs, waistInches: tempProfile.waistInches, targetWeightLbs: tempProfile.targetWeightLbs, age: bio.age, dailyCalories: bio.dailyCalories, dailyProtein: bio.dailyProtein, dailyCarbs: bio.dailyCarbs, dailyFats: bio.dailyFats, whtr: bio.whtr, whtrStatus: bio.whtrStatus };
    setUserProfile(updated); setTempProfile(updated);
    await AsyncStorage.setItem('@user_profile_data', JSON.stringify(updated));
    setBiometricsEditModalVisible(false);
  };

  const handleGoalInlineChange = async (newGoal: string) => {
    const bio = calculateAgeAndBiometrics(userProfile.birthDate, userProfile.heightInches, userProfile.bodyWeightLbs, userProfile.waistInches, newGoal);
    const updated = { ...userProfile, fitnessGoal: newGoal, dailyCalories: bio.dailyCalories, dailyProtein: bio.dailyProtein, dailyCarbs: bio.dailyCarbs, dailyFats: bio.dailyFats };
    setUserProfile(updated); setTempProfile(updated);
    await AsyncStorage.setItem('@user_profile_data', JSON.stringify(updated));
  };

  const handleSaveIdentityAndGoals = async () => {
    const updated: UserProfile = { ...userProfile, nickname: tempProfile.nickname, avatarUrl: tempProfile.avatarUrl };
    setUserProfile(updated); setTempProfile(updated);
    await AsyncStorage.setItem('@user_profile_data', JSON.stringify(updated));
    setIdentityEditModalVisible(false);
  };

  const executeDeleteProfile = async () => {
    await AsyncStorage.multiRemove(['@user_profile_data', '@workout_routines', '@workout_history', '@theme_id', '@is_dark_mode', '@dashboard_widgets']);
    setUserProfile({ firstName: '', lastName: '', nickname: '', birthDate: '1995-06-15', age: 30, heightInches: 70, bodyWeightLbs: 175, waistInches: 32, targetWeightLbs: 180, fitnessGoal: 'Strength & Powerlifting', dailyCalories: 2500, dailyProtein: 160, dailyCarbs: 250, dailyFats: 70, whtr: 0.45, whtrStatus: 'Normal (Low Risk)', avatarUrl: '', progressPhotos: [] });
    setRoutines([]); setHistory([]); setDeleteConfirmModalVisible(false); setOnboardStep(1);
    navigateToView('welcome');
  };

  const handleAddProgressPhoto = async () => {
    const url = prompt ? prompt('Enter image URL for progress photo:', '') : '';
    if (url) {
      const newPhoto: ProgressPhoto = { id: Date.now().toString(), date: new Date().toLocaleDateString(), uri: url, weight: userProfile.bodyWeightLbs };
      const updatedProfile = { ...userProfile, progressPhotos: [newPhoto, ...userProfile.progressPhotos] };
      setUserProfile(updatedProfile); setTempProfile(updatedProfile);
      await AsyncStorage.setItem('@user_profile_data', JSON.stringify(updatedProfile));
    }
  };

  const handleExportCSV = async () => {
    if (history.length === 0) { alert('No workout history to export.'); return; }
    let csv = 'Date,Routine Name,Total Volume (lbs),Sets Completed,Best 1RM Est\n';
    history.forEach(log => {
      const best1RMText = log.bestEstimated1RM ? `${log.bestEstimated1RM.value} lbs (${log.bestEstimated1RM.exerciseName})` : 'N/A';
      csv += `"${log.completedAt}","${log.routineName}",${log.totalVolumeLbs},${log.totalSetsCompleted},"${best1RMText}"\n`;
    });
    try { await Share.share({ title: 'IronForge Workout History', message: csv }); } catch (e) { console.error(e); }
  };

  const handleToggleDarkMode = async (value: boolean) => { setIsDarkMode(value); await AsyncStorage.setItem('@is_dark_mode', value.toString()); };
  const handleSelectTheme = async (theme: ThemePalette) => { setActiveTheme(theme); await AsyncStorage.setItem('@theme_id', theme.id); };
  const handleSaveWidgetSettings = async (key: string, value: boolean) => {
    if (key === 'healthSyncEnabled' && value) {
      alert("Native HealthKit/Google Fit integration requires an ejected app environment. This setting is mocked for UI preview only.");
    }
    const updated = { showMicroStats, showHeatmap, showTrophyVault, showHeroCard, healthSyncEnabled: key === 'healthSyncEnabled' ? value : healthSyncEnabled, [key]: value };
    if (key === 'healthSyncEnabled') setHealthSyncEnabled(value);
    await AsyncStorage.setItem('@dashboard_widgets', JSON.stringify(updated));
  };

  const handleClearAllRoutines = async () => { if (window.confirm ? window.confirm('Delete all routines?') : true) { await AsyncStorage.removeItem('@workout_routines'); setRoutines([]); } };
  const handleClearHistory = async () => { if (window.confirm ? window.confirm('Clear workout history?') : true) { await AsyncStorage.removeItem('@workout_history'); setHistory([]); } };
  const handleDeleteSingleRoutine = async (id: string) => { const updated = routines.filter((r) => r.id !== id); await AsyncStorage.setItem('@workout_routines', JSON.stringify(updated)); setRoutines(updated); };

  const importPrebuiltRoutine = async (template: PrebuiltTemplate) => {
    const formattedExercises: ExerciseItem[] = template.exercises.map((ex, exIdx) => ({ id: `${Date.now()}_${exIdx}`, name: ex.name, targetMuscle: ex.muscle, sets: Array.from({ length: ex.defaultSets }, (_, sIdx) => ({ id: `s_${sIdx + 1}`, setNumber: sIdx + 1, weight: 0, reps: ex.reps, completed: false })) }));
    const newRoutine: Routine = { id: Date.now().toString(), name: template.name, createdAt: new Date().toLocaleDateString(), exercises: formattedExercises };
    const updated = [...routines, newRoutine];
    await AsyncStorage.setItem('@workout_routines', JSON.stringify(updated)); setRoutines(updated);
    navigateToView('dashboard', 'routines'); alert(`Forged routine: "${template.name}" added!`);
  };

  const handleSelectExerciseForBuilder = (name: string, muscle: string) => { setConfiguringExercise({ name, muscle }); setConfigSets('3'); setConfigReps('10'); };
  const confirmAddExerciseToRoutineBuilder = () => {
    if (!configuringExercise) return;
    const numSets = Math.max(1, parseInt(configSets, 10) || 3); const numReps = Math.max(1, parseInt(configReps, 10) || 10);
    const newEx: ExerciseItem = { id: Date.now().toString() + Math.random(), name: configuringExercise.name, targetMuscle: configuringExercise.muscle, sets: Array.from({ length: numSets }, (_, sIdx) => ({ id: `s_${sIdx + 1}`, setNumber: sIdx + 1, weight: 0, reps: numReps, completed: false })) };
    setSelectedExercises([...selectedExercises, newEx]); setConfiguringExercise(null);
  };
  const addSetToBuilder = (exerciseId: string) => { setSelectedExercises((prev) => prev.map((ex) => { if (ex.id === exerciseId) { const nextSet = ex.sets.length + 1; const lastReps = ex.sets[ex.sets.length - 1]?.reps || 10; return { ...ex, sets: [...ex.sets, { id: `s${nextSet}`, setNumber: nextSet, weight: 0, reps: lastReps, completed: false }] }; } return ex; })); };
  const removeExerciseFromBuilder = (exerciseId: string) => { setSelectedExercises(selectedExercises.filter((ex) => ex.id !== exerciseId)); };

  const handleSaveRoutine = async () => {
    if (!routineName.trim() || selectedExercises.length === 0) { alert('Please enter a routine name and add at least one exercise.'); return; }
    const newRoutine: Routine = { id: Date.now().toString(), name: routineName, createdAt: new Date().toLocaleDateString(), exercises: selectedExercises };
    const updated = [...routines, newRoutine];
    await AsyncStorage.setItem('@workout_routines', JSON.stringify(updated)); setRoutines(updated); setRoutineName(''); setSelectedExercises([]); navigateToView('dashboard', 'routines');
  };

  const getPreviousExerciseData = (exerciseName: string) => {
    for (const session of history) {
      const found = session.exercises.find((ex) => ex.name.toLowerCase() === exerciseName.toLowerCase());
      if (found) { const completedSets = found.sets.filter((s) => s.completed || (s.weight > 0 && s.reps > 0)); if (completedSets.length > 0) return completedSets; }
    }
    return null;
  };

  const startWorkout = (routine: Routine) => {
    const clonedRoutine: Routine = JSON.parse(JSON.stringify(routine));
    clonedRoutine.exercises.forEach((ex) => {
      const prevSets = getPreviousExerciseData(ex.name);
      if (prevSets) { ex.sets.forEach((set, sIdx) => { if (prevSets[sIdx]) { set.weight = prevSets[sIdx].weight; set.reps = prevSets[sIdx].reps; } else if (prevSets.length > 0) { set.weight = prevSets[prevSets.length - 1].weight; set.reps = prevSets[prevSets.length - 1].reps; } }); }
    });
    setActiveWorkout(clonedRoutine); setRestSecondsLeft(null); setIsTimerModalVisible(false); navigateToView('active');
  };

  const startFreestyleWorkout = () => {
    const freestyleRoutine: Routine = { id: Date.now().toString(), name: 'Freestyle Lift Session', createdAt: new Date().toLocaleDateString(), exercises: [{ id: 'ex_1', name: 'Barbell Bench Press', targetMuscle: 'Chest', sets: [{ id: 's1', setNumber: 1, weight: 135, reps: 10, completed: false }] }] };
    startWorkout(freestyleRoutine);
  };

  const addExerciseToActiveWorkout = (exerciseName: string, targetMuscle: string) => {
    if (!activeWorkout) return;
    const prevSets = getPreviousExerciseData(exerciseName);
    const initialWeight = prevSets && prevSets[0] ? prevSets[0].weight : 135;
    const initialReps = prevSets && prevSets[0] ? prevSets[0].reps : 10;
    const newExercise: ExerciseItem = { id: Date.now().toString() + Math.random(), name: exerciseName, targetMuscle, sets: [{ id: `s_${Date.now()}_1`, setNumber: 1, weight: initialWeight, reps: initialReps, completed: false }] };
    setActiveWorkout({ ...activeWorkout, exercises: [...activeWorkout.exercises, newExercise] }); setActiveAddExerciseModalVisible(false);
  };

  const addCustomExerciseToActiveWorkout = () => {
    if (!activeCustomExName.trim() || !activeWorkout) return;
    const newCatalogEx = { id: Date.now().toString(), name: activeCustomExName.trim(), muscle: activeCustomExMuscle };
    setExerciseCatalog([newCatalogEx, ...exerciseCatalog]); addExerciseToActiveWorkout(newCatalogEx.name, newCatalogEx.muscle); setActiveCustomExName('');
  };

  const addSetToActiveExercise = (exerciseIndex: number) => {
    if (!activeWorkout) return;
    const updatedExercises = [...activeWorkout.exercises]; const targetEx = updatedExercises[exerciseIndex];
    const nextSetNumber = targetEx.sets.length + 1; const lastSet = targetEx.sets[targetEx.sets.length - 1];
    targetEx.sets.push({ id: `s_${Date.now()}_${nextSetNumber}`, setNumber: nextSetNumber, weight: lastSet ? lastSet.weight : 135, reps: lastSet ? lastSet.reps : 10, completed: false });
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const removeExerciseFromActiveWorkout = (exerciseIndex: number) => {
    if (!activeWorkout) return;
    const updatedExercises = activeWorkout.exercises.filter((_, idx) => idx !== exerciseIndex);
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const updateActiveSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps' | 'rpe', value: string) => {
    if (!activeWorkout) return;
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exerciseIndex].sets[setIndex][field] = parseInt(value, 10) || 0;
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    const currentStatus = activeWorkout.exercises[exerciseIndex].sets[setIndex].completed;
    if (!currentStatus && restSecondsLeft !== null && restSecondsLeft > 0) { alert(`Rest cycle in progress! Wait ${restSecondsLeft}s or skip rest.`); return; }
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exerciseIndex].sets[setIndex].completed = !currentStatus;
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
    if (!currentStatus) { setRestSecondsLeft(selectedRestDuration); setIsTimerModalVisible(true); }
  };

  const cancelRestTimer = () => { setRestSecondsLeft(null); setIsTimerModalVisible(false); };

  const finishWorkout = async () => {
    if (!activeWorkout) return;
    let totalVolume = 0; let totalCompletedSets = 0; let best1RMRecord: { exerciseName: string; value: number } | null = null;
    activeWorkout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        if (set.completed && set.weight > 0 && set.reps > 0) {
          totalVolume += set.weight * set.reps; totalCompletedSets += 1;
          const est1RM = calculate1RM(set.weight, set.reps);
          if (!best1RMRecord || est1RM > best1RMRecord.value) best1RMRecord = { exerciseName: exercise.name, value: est1RM };
        }
      });
    });
    const now = new Date();
    const newLog: WorkoutSessionLog = { id: Date.now().toString(), routineName: activeWorkout.name, completedAt: now.toLocaleDateString() + ' • ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), timestamp: Date.now(), totalVolumeLbs: totalVolume, totalSetsCompleted: totalCompletedSets, bestEstimated1RM: best1RMRecord, exercises: activeWorkout.exercises };
    const updatedHistory = [newLog, ...history];
    await AsyncStorage.setItem('@workout_history', JSON.stringify(updatedHistory));
    setHistory(updatedHistory); setRestSecondsLeft(null); setIsTimerModalVisible(false);
    alert(`Iron Forged!\nTotal Tonnage: ${totalVolume.toLocaleString()} lbs\nSets Completed: ${totalCompletedSets}`);
    setActiveWorkout(null); navigateToView('dashboard', 'home');
  };

  const openCalculatorModal = (exerciseName: string, currentWeight: number) => { setCalcExerciseName(exerciseName); setCalcTargetWeight(currentWeight > 45 ? currentWeight : 135); setCalcModalVisible(true); };
  const formatTimerDisplay = (seconds: number) => { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins}:${secs < 10 ? '0' : ''}${secs}`; };

  const activeFilteredExercises = exerciseCatalog.filter((ex) => { const matchesCategory = activeExerciseCategory === 'All' || ex.muscle === activeExerciseCategory; const matchesSearch = ex.name.toLowerCase().includes(activeExerciseSearchQuery.toLowerCase()); return matchesCategory && matchesSearch; });
  const filteredExercises = exerciseCatalog.filter((ex) => { const matchesCategory = selectedCategory === 'All' || ex.muscle === selectedCategory; const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()); return matchesCategory && matchesSearch; });

  const isRestingActive = restSecondsLeft !== null && restSecondsLeft > 0;

  const getNextUpRoutine = (): { routine: Routine; lastLoggedText: string } | null => {
    if (routines.length === 0) return null;
    if (history.length === 0) return { routine: routines[0], lastLoggedText: 'Not logged yet' };
    const lastSession = history[0]; const currentIndex = routines.findIndex((r) => r.name === lastSession.routineName);
    let nextRoutine = (currentIndex !== -1 && currentIndex < routines.length - 1) ? routines[currentIndex + 1] : routines[0];
    const lastLogForNext = history.find((h) => h.routineName === nextRoutine.name);
    return { routine: nextRoutine, lastLoggedText: lastLogForNext ? `Last: ${lastLogForNext.completedAt.split('•')[0]?.trim()}` : 'Ready to forge' };
  };
  const nextUpData = getNextUpRoutine();

  const getWeeklyMetrics = () => {
    const now = new Date(); const currentDayOfWeek = now.getDay(); const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(now); monday.setDate(now.getDate() + mondayOffset); monday.setHours(0, 0, 0, 0);
    const daysLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday); dayDate.setDate(monday.getDate() + i); const dayDateString = dayDate.toLocaleDateString(); const isToday = dayDate.toDateString() === now.toDateString();
      let hasWorkout = false;
      history.forEach((log) => {
        const matchesDay = (log.completedAt && log.completedAt.includes(dayDateString)) || (log.timestamp && new Date(log.timestamp).toLocaleDateString() === dayDateString);
        if (matchesDay) hasWorkout = true;
      });
      weekDays.push({ label: daysLabels[i], dayNum: dayDate.getDate(), isToday, hasWorkout });
    }
    return { weekDays };
  };

  const { weekDays: weeklyHeatmap } = getWeeklyMetrics();
  const completedThisWeekCount = weeklyHeatmap.filter((d) => d.hasWorkout).length;
  const totalLifetimeSets = history.reduce((sum, h) => sum + (h.totalSetsCompleted || 0), 0);
  const currentStreak = completedThisWeekCount;

  const calculatePersonalRecords = (): PersonalRecord[] => {
    const defaultTargets: { name: string; muscle: string }[] = [{ name: 'Barbell Bench Press', muscle: 'Chest' }, { name: 'Barbell Back Squat', muscle: 'Legs' }, { name: 'Conventional Deadlift', muscle: 'Back' }, { name: 'Overhead Press (OHP)', muscle: 'Shoulders' }];
    const prMap: { [exerciseName: string]: PersonalRecord } = {};
    history.forEach((session) => {
      const dateString = session.completedAt ? session.completedAt.split('•')[0].trim() : 'Logged';
      session.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          if (set.completed && set.weight > 0 && set.reps > 0) {
            const est1RM = calculate1RM(set.weight, set.reps);
            if (!prMap[ex.name]) prMap[ex.name] = { exerciseName: ex.name, targetMuscle: ex.targetMuscle || 'Forge', max1RM: est1RM, achievedAt: dateString, hasData: true, historyEntries: [{ date: dateString, weight: set.weight, reps: set.reps, est1RM }] };
            else { prMap[ex.name].historyEntries.push({ date: dateString, weight: set.weight, reps: set.reps, est1RM }); if (est1RM > prMap[ex.name].max1RM) { prMap[ex.name].max1RM = est1RM; prMap[ex.name].achievedAt = dateString; } }
          }
        });
      });
    });
    const activeRecords = Object.values(prMap).sort((a, b) => b.max1RM - a.max1RM);
    if (activeRecords.length === 0) return defaultTargets.map((target) => ({ exerciseName: target.name, targetMuscle: target.muscle, max1RM: 0, achievedAt: 'No data in history', hasData: false, historyEntries: [] }));
    return activeRecords;
  };
  const personalRecordsList = calculatePersonalRecords();
  const hasAnyPRData = personalRecordsList.some((pr) => pr.hasData);

  const displayedTemplates = PREBUILT_ROUTINES.filter(t => {
    if (templateFilter === 'Recommended') return t.goal === userProfile.fitnessGoal;
    if (templateFilter === 'All') return true;
    return t.goal === templateFilter;
  });

  const renderVolumeChart = () => {
    if (history.length === 0) return <Text style={{ color: currentTheme.textSecondary, textAlign: 'center', marginTop: 20 }}>No data to chart yet.</Text>;
    const chartData = [...history].slice(0, 10).reverse();
    const maxVol = Math.max(...chartData.map(h => h.totalVolumeLbs), 1);
    return (
      <View style={{ height: 180, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 20, paddingTop: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: currentTheme.border }}>
        {chartData.map((session, idx) => {
          const heightPct = (session.totalVolumeLbs / maxVol) * 100;
          return (
            <View key={idx} style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 9, color: currentTheme.textSecondary, marginBottom: 4, transform: [{ rotate: '-45deg' }] }} numberOfLines={1}>{session.totalVolumeLbs}</Text>
              <View style={{ width: '60%', height: `${heightPct}%`, backgroundColor: activeTheme.primary, borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 4 }} />
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Curved Vignette */}
      {view !== 'welcome' && view !== 'welcomeBack' && view !== 'onboarding' && view !== 'postOnboarding' && (
        <>
          <View pointerEvents="none" style={[styles.vignetteLayer1, { borderColor: activeTheme.primary + (currentTheme.isDark ? '18' : '0C') }]} />
          <View pointerEvents="none" style={[styles.vignetteLayer2, { borderColor: activeTheme.primary + (currentTheme.isDark ? '0E' : '08') }]} />
          <View pointerEvents="none" style={[styles.vignetteLayer3, { borderColor: activeTheme.primary + (currentTheme.isDark ? '06' : '04') }]} />
          <View pointerEvents="none" style={[styles.vignetteLayer4, { borderColor: activeTheme.primary + (currentTheme.isDark ? '02' : '02') }]} />
        </>
      )}

      <Animated.View style={{ flex: 1, opacity: globalFadeAnim, transform: [{ scale: globalScaleAnim }] }}>
        
        {/* WELCOME / SPLASH SCREEN */}
        {view === 'welcome' && (
          <View style={[styles.homeMinimalContainer, { backgroundColor: currentTheme.background }]}>
            <View style={styles.homeMinimalContent}>
              <ForgeLogo size={135} themeColor={activeTheme.primary} />
              <Text style={[styles.homeBrandMain, { color: currentTheme.textPrimary }]}>IRONFORGE</Text>
              <Text style={[styles.homeBrandSub, { color: activeTheme.primary }]}>LIFT TRACKER</Text>
              <Text style={[styles.homeQuoteText, { color: currentTheme.textSecondary }]}>"Welcome to the Forge. Let's lift some Iron."</Text>
            </View>
            <View style={styles.homeBottomBtnContainer}>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: activeTheme.primary, paddingVertical: 18, justifyContent: 'center' }]} onPress={() => navigateToView('onboarding')} activeOpacity={0.85}>
                <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 }}>Begin Profile Setup</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* WELCOME BACK SCREEN */}
        {view === 'welcomeBack' && (
          <View style={[styles.homeMinimalContainer, { backgroundColor: currentTheme.background }]}>
            <View style={styles.homeMinimalContent}>
              <ForgeLogo size={135} themeColor={activeTheme.primary} />
              <Text style={[styles.homeBrandMain, { color: currentTheme.textPrimary }]}>WELCOME BACK,</Text>
              <Text style={[styles.homeBrandSub, { color: activeTheme.primary }]}>{userProfile.nickname || userProfile.firstName}</Text>
              <Text style={[styles.homeQuoteText, { color: currentTheme.textSecondary }]}>"The anvil is waiting. Time to forge greatness."</Text>
            </View>
            <View style={styles.homeBottomBtnContainer}>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: activeTheme.primary, paddingVertical: 18, justifyContent: 'center' }]} onPress={() => navigateToView('dashboard', 'home')} activeOpacity={0.85}>
                <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 }}>Enter My Home</Text>
                <Ionicons name="flame" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* POST-ONBOARDING WELCOME CELEBRATION */}
        {view === 'postOnboarding' && (
          <View style={[styles.homeMinimalContainer, { backgroundColor: currentTheme.background, justifyContent: 'center' }]}>
            <View style={styles.homeMinimalContent}>
              <ForgeLogo size={145} themeColor={activeTheme.primary} />
              <Text style={[styles.homeBrandMain, { color: currentTheme.textPrimary, marginTop: 30 }]}>WELCOME TO THE FORGE,</Text>
              <Text style={[styles.homeBrandSub, { color: activeTheme.primary, fontSize: 18, marginTop: 8 }]}>{userProfile.nickname || userProfile.firstName}</Text>
              <Text style={[styles.homeQuoteText, { color: currentTheme.textSecondary, marginTop: 20 }]}>Your targets have been locked. Preparing your dashboard...</Text>
            </View>
          </View>
        )}

        {/* LOCKED MULTI-STEP INTRO PROFILE BUILDER */}
        {view === 'onboarding' && (
          <View style={styles.centeredOnboardingWrapper}>
            <ScrollView contentContainerStyle={styles.centeredOnboardingScroll} showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
              <Animated.View style={[styles.profileCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, opacity: stepFadeAnim, width: '100%', maxWidth: 420 }]}>
                
                <Text style={[styles.headerDashboardSub, { color: activeTheme.primaryLight, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }]}>
                  Step {onboardStep} of 4
                </Text>

                {/* STEP 1 */}
                {onboardStep === 1 && (
                  <>
                    <Text style={[styles.modalTitle, { color: currentTheme.textPrimary, marginBottom: 4 }]}>Personal Identity</Text>
                    <Text style={[styles.modalSub, { color: currentTheme.textSecondary, marginBottom: 16 }]}>What should we call you in the Forge?</Text>

                    <Text style={styles.modalLabel}>First Name:</Text>
                    <TextInput style={[styles.input, { backgroundColor: currentTheme.cardBgAlt, color: currentTheme.textPrimary, borderColor: currentTheme.border, marginHorizontal: 0 }]} placeholder="First Name" placeholderTextColor="#777" value={onboardFirstName} onChangeText={setOnboardFirstName} />

                    <Text style={styles.modalLabel}>Last Name:</Text>
                    <TextInput style={[styles.input, { backgroundColor: currentTheme.cardBgAlt, color: currentTheme.textPrimary, borderColor: currentTheme.border, marginHorizontal: 0 }]} placeholder="Last Name" placeholderTextColor="#777" value={onboardLastName} onChangeText={setOnboardLastName} />

                    <Text style={styles.modalLabel}>Nickname (Optional):</Text>
                    <TextInput style={[styles.input, { backgroundColor: currentTheme.cardBgAlt, color: currentTheme.textPrimary, borderColor: currentTheme.border, marginHorizontal: 0 }]} placeholder="Nickname" placeholderTextColor="#777" value={onboardNickname} onChangeText={setOnboardNickname} />

                    <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: activeTheme.primary, shadowColor: activeTheme.primary, marginTop: 24 }]} onPress={() => { if (!onboardFirstName.trim()) { alert('First name required.'); return; } triggerStepTransition(2); }}>
                      <Text style={styles.modalCloseBtnText}>Next: Birth Date</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* STEP 2 */}
                {onboardStep === 2 && (
                  <>
                    <Text style={[styles.modalTitle, { color: currentTheme.textPrimary, marginBottom: 4 }]}>Birth Date</Text>
                    <Text style={[styles.modalSub, { color: currentTheme.textSecondary, marginBottom: 16 }]}>Select your birth year, month, and day.</Text>

                    <DropdownPicker label="Birth Year" value={birthYear} options={BIRTH_YEARS} onSelect={setBirthYear} theme={currentTheme} />
                    <DropdownPicker label="Birth Month" value={birthMonth} options={BIRTH_MONTHS} onSelect={setBirthMonth} theme={currentTheme} />
                    <DropdownPicker label="Birth Day" value={birthDay} options={BIRTH_DAYS} onSelect={setBirthDay} theme={currentTheme} />

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                      <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: currentTheme.cardBgAlt, flex: 1, borderWidth: 1, borderColor: currentTheme.border }]} onPress={() => triggerStepTransition(1)}>
                        <Text style={{ color: currentTheme.textPrimary, fontWeight: 'bold', textAlign: 'center' }}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: activeTheme.primary, flex: 2, shadowColor: activeTheme.primary, marginTop: 0 }]} onPress={() => triggerStepTransition(3)}>
                        <Text style={styles.modalCloseBtnText}>Next: Biometrics</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* STEP 3 */}
                {onboardStep === 3 && (
                  <>
                    <Text style={[styles.modalTitle, { color: currentTheme.textPrimary, marginBottom: 4 }]}>Physical Measurements</Text>
                    <Text style={[styles.modalSub, { color: currentTheme.textSecondary, marginBottom: 16 }]}>Used to calculate health & calorie ratios.</Text>

                    <View style={{ alignItems: 'center', backgroundColor: currentTheme.cardBgAlt, padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: currentTheme.border }}>
                      <Text style={[styles.modalLabel, { marginTop: 0 }]}>Height</Text>
                      <Text style={{ color: activeTheme.primaryLight, fontSize: 22, fontWeight: '900', marginVertical: 2 }}>{Math.floor(onboardHeight / 12)}' {onboardHeight % 12}" <Text style={{ fontSize: 12, color: currentTheme.textSecondary }}>({onboardHeight} in)</Text></Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                        <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setOnboardHeight(Math.max(48, onboardHeight - 1))}><Ionicons name="remove" size={16} color="#FFF" /></TouchableOpacity>
                        <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setOnboardHeight(Math.min(96, onboardHeight + 1))}><Ionicons name="add" size={16} color="#FFF" /></TouchableOpacity>
                      </View>
                    </View>

                    <View style={{ alignItems: 'center', backgroundColor: currentTheme.cardBgAlt, padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: currentTheme.border }}>
                      <Text style={[styles.modalLabel, { marginTop: 0 }]}>Current Body Weight</Text>
                      <Text style={{ color: activeTheme.primaryLight, fontSize: 22, fontWeight: '900', marginVertical: 2 }}>{onboardWeight} lbs</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                        <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setOnboardWeight(Math.max(80, onboardWeight - 1))}><Ionicons name="remove" size={16} color="#FFF" /></TouchableOpacity>
                        <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setOnboardWeight(onboardWeight + 1)}><Ionicons name="add" size={16} color="#FFF" /></TouchableOpacity>
                      </View>
                    </View>

                    <View style={{ alignItems: 'center', backgroundColor: currentTheme.cardBgAlt, padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: currentTheme.border }}>
                      <Text style={[styles.modalLabel, { marginTop: 0 }]}>Waist Measurement</Text>
                      <Text style={{ color: activeTheme.primaryLight, fontSize: 22, fontWeight: '900', marginVertical: 2 }}>{onboardWaist} inches</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                        <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setOnboardWaist(Math.max(20, onboardWaist - 1))}><Ionicons name="remove" size={16} color="#FFF" /></TouchableOpacity>
                        <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setOnboardWaist(onboardWaist + 1)}><Ionicons name="add" size={16} color="#FFF" /></TouchableOpacity>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                      <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: currentTheme.cardBgAlt, flex: 1, borderWidth: 1, borderColor: currentTheme.border }]} onPress={() => triggerStepTransition(2)}>
                        <Text style={{ color: currentTheme.textPrimary, fontWeight: 'bold', textAlign: 'center' }}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: activeTheme.primary, flex: 2, shadowColor: activeTheme.primary, marginTop: 0 }]} onPress={() => triggerStepTransition(4)}>
                        <Text style={styles.modalCloseBtnText}>Next: Goals</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* STEP 4 */}
                {onboardStep === 4 && (
                  <>
                    <Text style={[styles.modalTitle, { color: currentTheme.textPrimary, marginBottom: 4 }]}>Fitness Goals</Text>
                    <Text style={[styles.modalSub, { color: currentTheme.textSecondary, marginBottom: 16 }]}>Set your target weight and training objective.</Text>

                    <View style={{ alignItems: 'center', backgroundColor: currentTheme.cardBgAlt, padding: 12, borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: currentTheme.border }}>
                      <Text style={[styles.modalLabel, { marginTop: 0 }]}>Target Body Weight</Text>
                      <Text style={{ color: activeTheme.primaryLight, fontSize: 22, fontWeight: '900', marginVertical: 2 }}>{onboardTargetWeight} lbs</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                        <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setOnboardTargetWeight(Math.max(80, onboardTargetWeight - 1))}><Ionicons name="remove" size={16} color="#FFF" /></TouchableOpacity>
                        <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setOnboardTargetWeight(onboardTargetWeight + 1)}><Ionicons name="add" size={16} color="#FFF" /></TouchableOpacity>
                      </View>
                    </View>

                    <DropdownPicker label="Primary Fitness Goal" value={onboardGoal} options={FITNESS_GOALS.map(g => ({ label: g, value: g }))} onSelect={setOnboardGoal} theme={currentTheme} />

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                      <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: currentTheme.cardBgAlt, flex: 1, borderWidth: 1, borderColor: currentTheme.border }]} onPress={() => triggerStepTransition(3)}>
                        <Text style={{ color: currentTheme.textPrimary, fontWeight: 'bold', textAlign: 'center' }}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: activeTheme.primary, flex: 2, shadowColor: activeTheme.primary, marginTop: 0 }]} onPress={handleCompleteOnboarding}>
                        <Text style={styles.modalCloseBtnText}>Complete & Enter</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

              </Animated.View>
            </ScrollView>
          </View>
        )}

        {/* DASHBOARD CONTAINER WITH 5 TABS */}
        {view === 'dashboard' && (
          <View style={styles.inner}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.headerDashboardTitle, { color: currentTheme.textPrimary }]}>
                  {activeTab === 'home' && 'My Home'}
                  {activeTab === 'routines' && 'My Routines'}
                  {activeTab === 'templates' && 'Pre-Built Splits'}
                  {activeTab === 'history' && 'Session History'}
                  {activeTab === 'profile' && 'User Profile'}
                </Text>
                <Text style={[styles.headerDashboardSub, { color: activeTheme.primaryLight }]}>
                  {activeTab === 'home' && (currentStreak > 0 ? 'Forge Burns Bright • Ready to train' : 'Iron Awaits • Start a session')}
                  {activeTab === 'routines' && `${routines.length} Saved Splits`}
                  {activeTab === 'templates' && 'Curated Programs'}
                  {activeTab === 'history' && `${history.length} Workouts Logged`}
                  {activeTab === 'profile' && `${userProfile.firstName} ${userProfile.lastName} • Biometrics`}
                </Text>
              </View>

              <View style={styles.headerRightButtons}>
                <TouchableOpacity style={[styles.settingsHeaderBtn, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }]} onPress={() => setSettingsModalVisible(true)}>
                  <Ionicons name="settings-outline" size={20} color={currentTheme.textPrimary} />
                </TouchableOpacity>

                {activeTab === 'home' && (
                  <View style={[styles.headerStreakBadge, { backgroundColor: currentTheme.cardBgAlt, borderColor: activeTheme.primary + '44' }]}>
                    <Ionicons name="flame" size={15} color={activeTheme.primary} style={{ marginRight: 4 }} />
                    <Text style={[styles.headerStreakBadgeText, { color: activeTheme.primaryLight }]}>{currentStreak}d</Text>
                  </View>
                )}
                {activeTab === 'routines' && routines.length > 0 && (
                  <TouchableOpacity style={styles.clearBtn} onPress={handleClearAllRoutines}><Ionicons name="trash-outline" size={16} color="#FF453A" /><Text style={styles.clearBtnText}>Clear</Text></TouchableOpacity>
                )}
                {activeTab === 'history' && history.length > 0 && (
                  <TouchableOpacity style={styles.clearBtn} onPress={handleClearHistory}><Ionicons name="trash-outline" size={16} color="#FF453A" /><Text style={styles.clearBtnText}>Clear</Text></TouchableOpacity>
                )}
                {activeTab === 'routines' && (
                  <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: activeTheme.primary, shadowColor: activeTheme.primary }]} onPress={() => navigateToView('create')}>
                    <Ionicons name="add" size={20} color="#FFF" />
                    <Text style={styles.btnText}>New</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* TAB 1: MY HOME */}
            {activeTab === 'home' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {showMicroStats && (
                  <View style={styles.microStatsRow}>
                    <View style={[styles.microStatPill, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                      <Ionicons name="barbell-outline" size={14} color={activeTheme.primaryLight} style={{ marginRight: 6 }} />
                      <Text style={[styles.microStatLabel, { color: currentTheme.textSecondary }]}>WORKOUTS: </Text>
                      <Text style={[styles.microStatValue, { color: currentTheme.textPrimary }]}>{history.length}</Text>
                    </View>
                    <View style={[styles.microStatPill, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                      <Ionicons name="flame-outline" size={14} color={activeTheme.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.microStatLabel, { color: currentTheme.textSecondary }]}>STREAK: </Text>
                      <Text style={[styles.microStatValue, { color: currentTheme.textPrimary }]}>{currentStreak}d</Text>
                    </View>
                    <View style={[styles.microStatPill, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                      <Ionicons name="layers-outline" size={14} color={activeTheme.primaryLight} style={{ marginRight: 6 }} />
                      <Text style={[styles.microStatLabel, { color: currentTheme.textSecondary }]}>SETS: </Text>
                      <Text style={[styles.microStatValue, { color: currentTheme.textPrimary }]}>{totalLifetimeSets}</Text>
                    </View>
                  </View>
                )}

                {/* Health & Nutrition Status Card on Home */}
                <View style={[styles.profileCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, marginBottom: 14, padding: 14 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="pulse" size={16} color={activeTheme.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.profileSectionHeader, { color: currentTheme.textSecondary, marginBottom: 0 }]}>HEALTH & NUTRITION STATUS</Text>
                    </View>
                    <TouchableOpacity onPress={() => setActiveTab('profile')}>
                      <Text style={{ color: activeTheme.primaryLight, fontSize: 11, fontWeight: 'bold' }}>View Profile →</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={[styles.profileStatBox, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border, flex: 1, padding: 10 }]}><Text style={[styles.profileStatLbl, { color: currentTheme.textSecondary }]}>WHtR RATIO</Text><Text style={[styles.profileStatVal, { color: currentTheme.textPrimary, fontSize: 15 }]}>{userProfile.whtr}</Text><Text style={{ color: activeTheme.primaryLight, fontSize: 10, fontWeight: 'bold', marginTop: 2 }} numberOfLines={1}>{userProfile.whtrStatus}</Text></View>
                    <View style={[styles.profileStatBox, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border, flex: 1, padding: 10 }]}><Text style={[styles.profileStatLbl, { color: currentTheme.textSecondary }]}>DAILY CALORIES</Text><Text style={[styles.profileStatVal, { color: currentTheme.textPrimary, fontSize: 15 }]}>{userProfile.dailyCalories}</Text><Text style={{ color: currentTheme.textSecondary, fontSize: 10, marginTop: 2 }}>kcal / day</Text></View>
                    <View style={[styles.profileStatBox, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border, flex: 1, padding: 10 }]}><Text style={[styles.profileStatLbl, { color: currentTheme.textSecondary }]}>PROTEIN GOAL</Text><Text style={[styles.profileStatVal, { color: currentTheme.textPrimary, fontSize: 15 }]}>{userProfile.dailyProtein}g</Text><Text style={{ color: currentTheme.textSecondary, fontSize: 10, marginTop: 2 }}>per day</Text></View>
                  </View>
                </View>

                {showHeatmap && (
                  <View style={[styles.heatmapCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                    <View style={styles.heatmapHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="flame" size={16} color={activeTheme.primary} style={{ marginRight: 6 }} />
                        <Text style={[styles.heatmapTitle, { color: currentTheme.textSecondary }]}>WEEKLY CONSISTENCY</Text>
                      </View>
                      <Text style={[styles.heatmapStreakText, { color: activeTheme.primaryLight }]}>{completedThisWeekCount} / 7 Days Active</Text>
                    </View>
                    <View style={styles.heatmapDaysRow}>
                      {weeklyHeatmap.map((day, idx) => (
                        <View key={idx} style={[styles.heatmapDayBox, day.isToday && [styles.heatmapDayBoxToday, { borderColor: activeTheme.primary + '44', backgroundColor: currentTheme.cardBgAlt }]]}>
                          <Text style={[styles.heatmapDayLabel, { color: currentTheme.textSecondary }, day.isToday && { color: activeTheme.primaryLight }]}>{day.label}</Text>
                          <View style={[styles.heatmapIndicatorCircle, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }, day.hasWorkout && [styles.heatmapIndicatorActive, { backgroundColor: activeTheme.primary, borderColor: activeTheme.primaryLight, shadowColor: activeTheme.primary }], day.isToday && !day.hasWorkout && { borderColor: activeTheme.primaryLight }]}>
                            {day.hasWorkout ? <Ionicons name="flame" size={16} color="#FFF" /> : <Text style={[styles.heatmapDayNumText, { color: currentTheme.textSecondary }]}>{day.dayNum}</Text>}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {showTrophyVault && (
                  <View style={styles.prShowcaseSection}>
                    <View style={styles.prShowcaseHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="trophy" size={16} color={activeTheme.primaryLight} style={{ marginRight: 6 }} />
                        <Text style={[styles.prShowcaseTitle, { color: currentTheme.textSecondary }]}>FORGE TROPHY VAULT (EST. 1RM)</Text>
                      </View>
                      <Text style={[styles.prShowcaseCountText, { color: activeTheme.primaryLight }]}>{!hasAnyPRData ? 'Tap to Inspect' : `${personalRecordsList.length} PRs • Inspect`}</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prScrollContent}>
                      {personalRecordsList.map((record, idx) => (
                        <TouchableOpacity key={idx} style={[styles.prTrophyCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }, !record.hasData && [styles.prTrophyCardEmpty, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }]]} onPress={() => setSelectedPRToInspect(record)} activeOpacity={0.8}>
                          <View style={styles.prCardTopRow}>
                            <View style={[styles.trophyIconCircle, { backgroundColor: currentTheme.cardBgAlt, borderColor: activeTheme.primary + '55' }, !record.hasData && styles.trophyIconCircleEmpty]}>
                              <Ionicons name={record.hasData ? 'trophy-outline' : 'lock-closed-outline'} size={14} color={record.hasData ? activeTheme.primaryLight : '#666'} />
                            </View>
                            <Text style={[styles.prMuscleTag, !record.hasData && { color: '#555' }]}>{record.targetMuscle}</Text>
                          </View>
                          <Text style={[styles.prWeightText, { color: currentTheme.textPrimary }, !record.hasData && { color: '#555' }]}>
                            {record.hasData ? record.max1RM : '--'} <Text style={[styles.prWeightUnit, !record.hasData && { color: '#444' }, { color: activeTheme.primaryLight }]}>LBS</Text>
                          </Text>
                          <Text style={[styles.prExerciseName, { color: currentTheme.textSecondary }, !record.hasData && { color: '#888' }]} numberOfLines={1}>{record.exerciseName}</Text>
                          <View style={[styles.prFooterRow, { borderTopColor: currentTheme.border }]}>
                            <Ionicons name={record.hasData ? 'sparkles' : 'time-outline'} size={11} color={record.hasData ? activeTheme.primary : '#555'} style={{ marginRight: 4 }} />
                            <Text style={[styles.prDateText, { color: currentTheme.textSecondary }, !record.hasData && { color: '#666', fontStyle: 'italic' }]}>{record.achievedAt}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {showHeroCard && (
                  nextUpData ? (
                    <View style={[styles.heroLaunchCard, { backgroundColor: currentTheme.cardBgAlt, borderColor: activeTheme.primary + '55', shadowColor: activeTheme.primary }]}>
                      <View style={styles.heroLaunchTopRow}>
                        <View style={[styles.heroTagBadge, { backgroundColor: currentTheme.cardBg, borderColor: activeTheme.primary + '44' }]}>
                          <Ionicons name="play" size={11} color={activeTheme.primaryLight} style={{ marginRight: 4 }} />
                          <Text style={[styles.heroTagBadgeText, { color: activeTheme.primaryLight }]}>NEXT IN ROTATION</Text>
                        </View>
                        <Text style={[styles.heroLastLoggedText, { color: currentTheme.textSecondary }]}>{nextUpData.lastLoggedText}</Text>
                      </View>
                      <Text style={[styles.heroRoutineTitle, { color: currentTheme.textPrimary }]}>{nextUpData.routine.name}</Text>
                      <Text style={[styles.heroRoutineSubtitle, { color: currentTheme.textSecondary }]}>{nextUpData.routine.exercises.length} Movements • {nextUpData.routine.exercises.reduce((sum, e) => sum + e.sets.length, 0)} Total Sets</Text>
                      <View style={styles.heroActionBtnRow}>
                        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: activeTheme.primary, flex: 1, paddingVertical: 12, justifyContent: 'center' }]} onPress={() => startWorkout(nextUpData.routine)} activeOpacity={0.85}><Ionicons name="flame" size={18} color="#FFF" style={{ marginRight: 6 }} /><Text style={{ color: '#FFF', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.3 }}>Ignite Workout</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.heroFreestyleBtn, { backgroundColor: currentTheme.cardBg, borderColor: activeTheme.primary + '55' }]} onPress={startFreestyleWorkout} activeOpacity={0.85}><Ionicons name="add" size={18} color={activeTheme.primaryLight} style={{ marginRight: 4 }} /><Text style={[styles.heroFreestyleBtnText, { color: activeTheme.primaryLight }]}>Freestyle</Text></TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.heroLaunchCardEmpty, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                      <Text style={[styles.emptyHeroText, { color: currentTheme.textSecondary }]}>No routines created yet.</Text>
                      <View style={{ flexDirection: 'row', marginTop: 6 }}>
                        <TouchableOpacity style={[styles.heroCreateBtn, { backgroundColor: currentTheme.cardBgAlt, borderColor: activeTheme.primary + '44' }]} onPress={() => setActiveTab('templates')}><Text style={[styles.heroCreateBtnText, { color: activeTheme.primaryLight }]}>Explore Pre-Built</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.heroCreateBtn, { marginLeft: 10, backgroundColor: activeTheme.primary, borderColor: activeTheme.primary }]} onPress={startFreestyleWorkout}><Text style={[styles.heroCreateBtnText, { color: '#FFF' }]}>Quick Free Lift</Text></TouchableOpacity>
                      </View>
                    </View>
                  )
                )}
              </ScrollView>
            )}

            {/* TAB 2: ROUTINES */}
            {activeTab === 'routines' && (
              <FlatList
                data={routines}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', marginTop: 40, paddingVertical: 20 }}>
                    <Ionicons name="barbell-outline" size={44} color="#555" style={{ marginBottom: 12 }} />
                    <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>No routines forged yet.</Text>
                    <TouchableOpacity style={[styles.exploreTemplatesBtn, { backgroundColor: currentTheme.cardBg, borderColor: activeTheme.primary + '44' }]} onPress={() => setActiveTab('templates')}><Ionicons name="flame" size={16} color={activeTheme.primary} style={{ marginRight: 6 }} /><Text style={[styles.exploreTemplatesBtnText, { color: activeTheme.primaryLight }]}>Explore Pre-Built Splits</Text></TouchableOpacity>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={[styles.routineCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.cardTitle, { color: currentTheme.textPrimary }]}>{item.name}</Text>
                        <Text style={[styles.cardSubtitle, { color: currentTheme.textSecondary }]}>{item.exercises.length} Movements • Created {item.createdAt}</Text>
                      </View>
                      <View style={styles.cardActionGroup}>
                        <TouchableOpacity style={[styles.startWorkoutBtn, { backgroundColor: activeTheme.primary }]} onPress={() => startWorkout(item)}><Ionicons name="play" size={15} color="#FFF" /><Text style={styles.startWorkoutBtnText}>Start</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.deleteSingleBtn, { backgroundColor: currentTheme.cardBgAlt }]} onPress={() => handleDeleteSingleRoutine(item.id)}><Ionicons name="trash" size={15} color="#888" /></TouchableOpacity>
                      </View>
                    </View>
                    {item.exercises.map((ex) => (<Text key={ex.id} style={{ fontSize: 14, marginLeft: 6, marginVertical: 2, color: currentTheme.textSecondary }}>• {ex.name} <Text style={{ color: '#777' }}>({ex.sets.length} sets)</Text></Text>))}
                  </View>
                )}
              />
            )}

            {/* TAB 3: TEMPLATES */}
            {activeTab === 'templates' && (
              <View style={{ flex: 1 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40, marginBottom: 12 }}>
                  {['Recommended', 'All', ...FITNESS_GOALS].map(fGoal => (
                    <TouchableOpacity
                      key={fGoal}
                      style={[{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, marginRight: 8, borderWidth: 1 }, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }, templateFilter === fGoal && { backgroundColor: activeTheme.primary, borderColor: activeTheme.primary }]}
                      onPress={() => setTemplateFilter(fGoal)}
                    >
                      <Text style={{ color: templateFilter === fGoal ? '#FFF' : currentTheme.textSecondary, fontWeight: 'bold' }}>{fGoal}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <FlatList
                  data={displayedTemplates}
                  keyExtractor={(item) => item.name}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  ListEmptyComponent={<Text style={{ color: currentTheme.textSecondary, textAlign: 'center', marginTop: 20 }}>No routines match this goal yet.</Text>}
                  renderItem={({ item }) => (
                    <View style={[styles.templateCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Ionicons name="flag" size={12} color={activeTheme.primaryLight} />
                        <Text style={{ fontSize: 10, color: activeTheme.primaryLight, marginLeft: 4, textTransform: 'uppercase', fontWeight: 'bold' }}>{item.goal}</Text>
                      </View>
                      <View style={styles.cardHeaderRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={[styles.cardTitle, { color: currentTheme.textPrimary }]}>{item.name}</Text>
                          <Text style={[styles.templateDescription, { color: currentTheme.textSecondary }]}>{item.description}</Text>
                        </View>
                        <TouchableOpacity style={[styles.importBtn, { backgroundColor: activeTheme.primary }]} onPress={() => importPrebuiltRoutine(item)}><Ionicons name="download-outline" size={16} color="#FFF" /><Text style={styles.importBtnText}>Forge</Text></TouchableOpacity>
                      </View>
                      <View style={[styles.templateExerciseList, { borderTopColor: currentTheme.border }]}>
                        {item.exercises.map((ex, idx) => (<Text key={idx} style={[styles.templateExerciseText, { color: currentTheme.textSecondary }]}>• {ex.name} <Text style={{ color: '#777' }}>({ex.defaultSets} sets × {ex.reps} reps)</Text></Text>))}
                      </View>
                    </View>
                  )}
                />
              </View>
            )}

            {/* TAB 4: HISTORY */}
            {activeTab === 'history' && (
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', backgroundColor: currentTheme.cardBgAlt, borderRadius: 8, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: currentTheme.border }}>
                  <TouchableOpacity style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 }, historyViewMode === 'list' && { backgroundColor: currentTheme.cardBg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 }]} onPress={() => setHistoryViewMode('list')}>
                    <Text style={{ color: historyViewMode === 'list' ? currentTheme.textPrimary : currentTheme.textSecondary, fontWeight: 'bold', fontSize: 13 }}>List View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 }, historyViewMode === 'chart' && { backgroundColor: currentTheme.cardBg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 }]} onPress={() => setHistoryViewMode('chart')}>
                    <Text style={{ color: historyViewMode === 'chart' ? currentTheme.textPrimary : currentTheme.textSecondary, fontWeight: 'bold', fontSize: 13 }}>Volume Chart</Text>
                  </TouchableOpacity>
                </View>

                {historyViewMode === 'chart' ? (
                  <View style={[styles.profileCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                    <Text style={[styles.profileSectionHeader, { color: currentTheme.textSecondary, marginBottom: 4 }]}>Recent Volume Progression (Lbs)</Text>
                    <Text style={{ color: currentTheme.textSecondary, fontSize: 11, marginBottom: 10 }}>Last 10 workouts plotted chronologically.</Text>
                    {renderVolumeChart()}
                  </View>
                ) : (
                  <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    ListEmptyComponent={<Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>No workout logs yet. Finish a session to see history here.</Text>}
                    renderItem={({ item }) => (
                      <View style={[styles.historyCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                        <View style={styles.cardHeaderRow}>
                          <View>
                            <Text style={[styles.historyCardTitle, { color: currentTheme.textPrimary }]}>{item.routineName}</Text>
                            <Text style={[styles.historyCardSubtitle, { color: currentTheme.textSecondary }]}>{item.completedAt}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }}>
                            <Ionicons name="flame" size={14} color={activeTheme.primary} style={{ marginRight: 4 }} />
                            <Text style={{ fontWeight: 'bold', fontSize: 13, color: activeTheme.primaryLight }}>{item.totalVolumeLbs.toLocaleString()} lbs</Text>
                          </View>
                        </View>
                        <View style={[styles.historyStatsRow, { backgroundColor: currentTheme.cardBgAlt }]}>
                          <View style={styles.statBox}>
                            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>COMPLETED SETS</Text>
                            <Text style={[styles.statVal, { color: currentTheme.textPrimary }]}>{item.totalSetsCompleted}</Text>
                          </View>
                          {item.bestEstimated1RM && (
                            <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: currentTheme.border, paddingLeft: 12 }]}>
                              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>TOP EST. 1RM</Text>
                              <Text style={[styles.statVal, { color: activeTheme.primaryLight }]}>{item.bestEstimated1RM.value} lbs ({item.bestEstimated1RM.exerciseName})</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.historyExerciseList}>
                          {item.exercises.map((ex) => {
                            const completedCount = ex.sets.filter((s) => s.completed).length;
                            if (completedCount === 0) return null;
                            return (<Text key={ex.id} style={{ fontSize: 13, marginVertical: 2, color: currentTheme.textSecondary }}>✔ {ex.name} — {completedCount} set{completedCount > 1 ? 's' : ''} logged</Text>);
                          })}
                        </View>
                      </View>
                    )}
                  />
                )}
              </View>
            )}

            {/* TAB 5: PROFILE HUB */}
            {activeTab === 'profile' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Identity Header Card */}
                <View style={[styles.profileCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, marginBottom: 14 }]}>
                  <View style={styles.profileAvatarRow}>
                    <TouchableOpacity
                      style={{ width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, backgroundColor: activeTheme.primary + '22', borderColor: activeTheme.primary, overflow: 'hidden' }}
                      onPress={() => {
                        const url = prompt ? prompt('Enter profile image URL or emoji/icon tag:', userProfile.avatarUrl) : '';
                        if (url !== null) {
                          const updated = { ...userProfile, avatarUrl: url };
                          setUserProfile(updated);
                          AsyncStorage.setItem('@user_profile_data', JSON.stringify(updated));
                        }
                      }}
                    >
                      {userProfile.avatarUrl && userProfile.avatarUrl.startsWith('http') ? (
                        <Image source={{ uri: userProfile.avatarUrl }} style={{ width: 64, height: 64 }} />
                      ) : userProfile.avatarUrl ? (
                        <Text style={{ fontSize: 28 }}>{userProfile.avatarUrl}</Text>
                      ) : (
                        <Ionicons name="person" size={28} color={activeTheme.primary} />
                      )}
                    </TouchableOpacity>

                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={[styles.profileNameText, { color: currentTheme.textPrimary }]}>
                        {userProfile.firstName} {userProfile.lastName}
                      </Text>
                      <Text style={[styles.profileRoleText, { color: currentTheme.textSecondary, fontSize: 11 }]}>
                        {userProfile.nickname ? `"${userProfile.nickname}"` : 'Tap avatar to add picture'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: activeTheme.primary, paddingVertical: 6, paddingHorizontal: 12 }]}
                      onPress={() => {
                        setTempProfile(userProfile);
                        setIdentityEditModalVisible(true);
                      }}
                    >
                      <Ionicons name="create-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={[styles.btnText, { fontSize: 12 }]}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Primary Fitness Goal Card */}
                <View style={[styles.profileCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, marginBottom: 14, padding: 14 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="flag" size={16} color={activeTheme.primaryLight} style={{ marginRight: 6 }} />
                    <Text style={[styles.profileSectionHeader, { color: currentTheme.textSecondary, marginBottom: 0 }]}>PRIMARY FITNESS GOAL</Text>
                  </View>
                  <DropdownPicker value={userProfile.fitnessGoal} options={FITNESS_GOALS.map(g => ({ label: g, value: g }))} onSelect={handleGoalInlineChange} theme={currentTheme} />
                </View>

                {/* Biometric & Health Card */}
                <View style={[styles.profileCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, marginBottom: 14 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.profileSectionHeader, { color: currentTheme.textSecondary, marginBottom: 0 }]}>Biometric Baseline</Text>
                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: currentTheme.cardBgAlt, borderWidth: 1, borderColor: activeTheme.primary + '55', paddingVertical: 4, paddingHorizontal: 10 }]} onPress={() => { setTempProfile(userProfile); setBiometricsEditModalVisible(true); }}>
                      <Text style={[styles.btnText, { fontSize: 11, color: activeTheme.primaryLight }]}>Edit Biometrics</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.profileInfoRow, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }]}>
                    <Text style={[styles.profileInfoLbl, { color: currentTheme.textPrimary }]}>Age</Text>
                    <Text style={[styles.profileInfoVal, { color: currentTheme.textSecondary }]}>{userProfile.age} yrs</Text>
                  </View>
                  <View style={[styles.profileInfoRow, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }]}>
                    <Text style={[styles.profileInfoLbl, { color: currentTheme.textPrimary }]}>Height</Text>
                    <Text style={[styles.profileInfoVal, { color: currentTheme.textSecondary }]}>{Math.floor(userProfile.heightInches / 12)}' {userProfile.heightInches % 12}" ({userProfile.heightInches} in)</Text>
                  </View>
                  <View style={[styles.profileInfoRow, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }]}>
                    <Text style={[styles.profileInfoLbl, { color: currentTheme.textPrimary }]}>Current Body Weight</Text>
                    <Text style={[styles.profileInfoVal, { color: currentTheme.textSecondary }]}>{userProfile.bodyWeightLbs} lbs</Text>
                  </View>
                  <View style={[styles.profileInfoRow, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }]}>
                    <Text style={[styles.profileInfoLbl, { color: currentTheme.textPrimary }]}>Target Body Weight</Text>
                    <Text style={[styles.profileInfoVal, { color: currentTheme.textSecondary }]}>{userProfile.targetWeightLbs} lbs</Text>
                  </View>
                  <View style={[styles.profileInfoRow, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }]}>
                    <Text style={[styles.profileInfoLbl, { color: currentTheme.textPrimary }]}>Waist-to-Height Ratio</Text>
                    <Text style={[styles.profileInfoVal, { color: activeTheme.primaryLight }]}>{userProfile.whtr} — {userProfile.whtrStatus}</Text>
                  </View>
                </View>

                {/* EXPANDED NUTRITION SPLIT */}
                <View style={[styles.profileCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, marginBottom: 14 }]}>
                  <Text style={[styles.profileSectionHeader, { color: currentTheme.textSecondary }]}>Daily Macro Split</Text>
                  <View style={styles.profileStatsGrid}>
                    <View style={[styles.profileStatBox, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border, width: '48%' }]}><Ionicons name="flame" size={18} color={activeTheme.primary} style={{ marginBottom: 4 }} /><Text style={[styles.profileStatVal, { color: currentTheme.textPrimary }]}>{userProfile.dailyCalories}</Text><Text style={[styles.profileStatLbl, { color: currentTheme.textSecondary }]}>Calories (kcal)</Text></View>
                    <View style={[styles.profileStatBox, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border, width: '48%' }]}><Ionicons name="nutrition" size={18} color={activeTheme.primary} style={{ marginBottom: 4 }} /><Text style={[styles.profileStatVal, { color: currentTheme.textPrimary }]}>{userProfile.dailyProtein}g</Text><Text style={[styles.profileStatLbl, { color: currentTheme.textSecondary }]}>Protein Target</Text></View>
                    <View style={[styles.profileStatBox, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border, width: '48%' }]}><Ionicons name="pizza" size={18} color={activeTheme.primary} style={{ marginBottom: 4 }} /><Text style={[styles.profileStatVal, { color: currentTheme.textPrimary }]}>{userProfile.dailyCarbs}g</Text><Text style={[styles.profileStatLbl, { color: currentTheme.textSecondary }]}>Carbohydrates</Text></View>
                    <View style={[styles.profileStatBox, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border, width: '48%' }]}><Ionicons name="water" size={18} color={activeTheme.primary} style={{ marginBottom: 4 }} /><Text style={[styles.profileStatVal, { color: currentTheme.textPrimary }]}>{userProfile.dailyFats}g</Text><Text style={[styles.profileStatLbl, { color: currentTheme.textSecondary }]}>Dietary Fats</Text></View>
                  </View>
                </View>

                {/* PROGRESS PHOTO VAULT */}
                <View style={[styles.profileCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, marginBottom: 14 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.profileSectionHeader, { color: currentTheme.textSecondary, marginBottom: 0 }]}>Physique Vault</Text>
                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: currentTheme.cardBgAlt, borderWidth: 1, borderColor: activeTheme.primary + '55', paddingVertical: 4, paddingHorizontal: 10 }]} onPress={handleAddProgressPhoto}>
                      <Text style={[styles.btnText, { fontSize: 11, color: activeTheme.primaryLight }]}>+ Add Photo URL</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {userProfile.progressPhotos && userProfile.progressPhotos.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                      {userProfile.progressPhotos.map((photo) => (
                        <View key={photo.id} style={{ marginHorizontal: 4, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: currentTheme.border }}>
                          <Image source={{ uri: photo.uri }} style={{ width: 140, height: 180, backgroundColor: currentTheme.cardBgAlt }} />
                          <View style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', padding: 6 }}>
                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{photo.date}</Text>
                            <Text style={{ color: activeTheme.primaryLight, fontSize: 10 }}>{photo.weight} lbs</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={{ alignItems: 'center', padding: 20, backgroundColor: currentTheme.cardBgAlt, borderRadius: 10, borderWidth: 1, borderColor: currentTheme.border, borderStyle: 'dashed' }}>
                      <Ionicons name="camera-outline" size={32} color={currentTheme.textSecondary} style={{ marginBottom: 8 }} />
                      <Text style={{ color: currentTheme.textSecondary, fontSize: 12 }}>No physique updates logged.</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.profileCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                  <Text style={[styles.profileSectionHeader, { color: currentTheme.textSecondary }]}>Account Control</Text>
                  <TouchableOpacity style={styles.deleteProfileBtn} onPress={() => setDeleteConfirmModalVisible(true)} activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={16} color="#FF453A" style={{ marginRight: 6 }} />
                    <Text style={styles.deleteProfileBtnText}>Delete Profile & Reset Data</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {/* 5-Tab Bottom Navigator on Dashboard */}
            <View style={[styles.tabBar, { backgroundColor: currentTheme.tabBarBg, borderTopColor: currentTheme.border }]}>
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'home' && styles.tabBtnActive]} onPress={() => setActiveTab('home')}>
                <Ionicons name={activeTab === 'home' ? 'grid' : 'grid-outline'} size={22} color={activeTab === 'home' ? activeTheme.primary : '#777'} />
                <Text style={[styles.tabBtnText, { color: activeTab === 'home' ? activeTheme.primary : currentTheme.textSecondary }]}>My Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'routines' && styles.tabBtnActive]} onPress={() => setActiveTab('routines')}>
                <Ionicons name={activeTab === 'routines' ? 'barbell' : 'barbell-outline'} size={22} color={activeTab === 'routines' ? activeTheme.primary : '#777'} />
                <Text style={[styles.tabBtnText, { color: activeTab === 'routines' ? activeTheme.primary : currentTheme.textSecondary }]}>Routines</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'templates' && styles.tabBtnActive]} onPress={() => setActiveTab('templates')}>
                <Ionicons name={activeTab === 'templates' ? 'flame' : 'flame-outline'} size={22} color={activeTab === 'templates' ? activeTheme.primary : '#777'} />
                <Text style={[styles.tabBtnText, { color: activeTab === 'templates' ? activeTheme.primary : currentTheme.textSecondary }]}>Pre-Built</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]} onPress={() => setActiveTab('history')}>
                <Ionicons name={activeTab === 'history' ? 'time' : 'time-outline'} size={22} color={activeTab === 'history' ? activeTheme.primary : '#777'} />
                <Text style={[styles.tabBtnText, { color: activeTab === 'history' ? activeTheme.primary : currentTheme.textSecondary }]}>History</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]} onPress={() => setActiveTab('profile')}>
                <Ionicons name={activeTab === 'profile' ? 'person' : 'person-outline'} size={22} color={activeTab === 'profile' ? activeTheme.primary : '#777'} />
                <Text style={[styles.tabBtnText, { color: activeTab === 'profile' ? activeTheme.primary : currentTheme.textSecondary }]}>Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ROUTINE BUILDER SCREEN */}
        {view === 'create' && (
          <View style={styles.inner}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigateToView('dashboard', 'routines')} style={styles.headerBackBtn}>
                <Ionicons name="close" size={24} color={currentTheme.textPrimary} />
              </TouchableOpacity>
              <TextInput style={[styles.input, { backgroundColor: currentTheme.inputBg, color: currentTheme.textPrimary, borderColor: currentTheme.border }]} placeholder="Routine Name (e.g., Heavy Push)" placeholderTextColor="#777" value={routineName} onChangeText={setRoutineName} />
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: activeTheme.primary }]} onPress={handleSaveRoutine}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedExercises.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.sectionHeader}>Current Movements ({selectedExercises.length}):</Text>
                  {selectedExercises.map((item, idx) => (
                    <View key={item.id} style={[styles.exerciseCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                      <View style={styles.exerciseCardHeader}>
                        <Text style={[styles.cardTitle, { color: currentTheme.textPrimary }]}>{idx + 1}. {item.name} <Text style={{ color: activeTheme.primaryLight, fontSize: 13 }}>({item.targetMuscle})</Text></Text>
                        <TouchableOpacity onPress={() => removeExerciseFromBuilder(item.id)}><Ionicons name="close-circle-outline" size={20} color="#FF453A" /></TouchableOpacity>
                      </View>
                      {item.sets.map((s) => (<Text key={s.id} style={{ fontSize: 13, marginVertical: 2, color: currentTheme.textSecondary }}>Set {s.setNumber}: {s.reps} target reps</Text>))}
                      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }} onPress={() => addSetToBuilder(item.id)}><Ionicons name="add" size={16} color={activeTheme.primary} /><Text style={{ marginLeft: 4, fontWeight: '600', fontSize: 12, color: activeTheme.primaryLight }}>Add Set</Text></TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.sectionHeader}>Exercise Forge</Text>
              <View style={[styles.customCreationBox, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                <Text style={[styles.customCreationTitle, { color: currentTheme.textPrimary }]}>+ Forge Custom Movement</Text>
                <View style={styles.customCreationInputRow}>
                  <TextInput style={{ flex: 1, padding: 8, borderRadius: 8, fontSize: 13, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, color: currentTheme.textPrimary, borderColor: currentTheme.border }} placeholder="Movement Name (e.g., Z-Press)" placeholderTextColor="#777" value={customExerciseName} onChangeText={setCustomExerciseName} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                  {MUSCLE_GROUPS.filter(g => g !== 'All').map((muscle) => (
                    <TouchableOpacity key={muscle} style={[styles.filterChip, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }, customExerciseMuscle === muscle && { backgroundColor: activeTheme.primary, borderColor: activeTheme.primary }]} onPress={() => setCustomExerciseMuscle(muscle)}>
                      <Text style={[styles.filterChipText, { color: customExerciseMuscle === muscle ? '#FFF' : currentTheme.textSecondary }]}>{muscle}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={[styles.customCreationSubmitBtn, { backgroundColor: activeTheme.primary }]} onPress={handleAddNewCustomExercise}><Text style={styles.customCreationSubmitText}>Save to Exercise Catalog</Text></TouchableOpacity>
              </View>
              <View style={[styles.searchBar, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                <Ionicons name="search" size={18} color="#777" style={{ marginRight: 8 }} />
                <TextInput style={[styles.searchInput, { color: currentTheme.textPrimary }]} placeholder="Search movements..." placeholderTextColor="#777" value={searchQuery} onChangeText={setSearchQuery} />
                {searchQuery.length > 0 && (<TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={18} color="#777" /></TouchableOpacity>)}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                {MUSCLE_GROUPS.map((group) => (
                  <TouchableOpacity key={group} style={[styles.filterChip, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }, selectedCategory === group && [styles.filterChipActive, { backgroundColor: activeTheme.primary, borderColor: activeTheme.primary }]]} onPress={() => setSelectedCategory(group)}>
                    <Text style={[styles.filterChipText, { color: currentTheme.textSecondary }, selectedCategory === group && styles.filterChipTextActive]}>{group}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {filteredExercises.map((ex) => (
                <TouchableOpacity key={ex.id} style={[styles.pickerItem, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]} onPress={() => handleSelectExerciseForBuilder(ex.name, ex.muscle)}>
                  <View><Text style={[styles.pickerText, { color: currentTheme.textPrimary }]}>{ex.name}</Text><Text style={[styles.pickerSubtext, { color: currentTheme.textSecondary }]}>{ex.muscle}</Text></View>
                  <Ionicons name="add-circle-outline" size={22} color={activeTheme.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ACTIVE WORKOUT LOGGER SCREEN */}
        {view === 'active' && activeWorkout && (
          <View style={styles.inner}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigateToView('dashboard', 'home')} style={styles.headerBackBtn}>
                <Ionicons name="chevron-down" size={26} color={currentTheme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.activeHeaderTitle, { color: currentTheme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{activeWorkout.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout}><Text style={styles.finishBtnText}>Finish</Text></TouchableOpacity>
              </View>
            </View>

            <View style={[styles.restSelectorContainer, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="timer-outline" size={16} color={activeTheme.primary} style={{ marginRight: 6 }} /><Text style={[styles.restSelectorTitle, { color: currentTheme.textSecondary }]}>Auto-Rest:</Text></View>
              <View style={styles.restOptionsRow}>
                {REST_OPTIONS.map((sec) => (
                  <TouchableOpacity key={sec} style={[styles.restOptionBtn, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }, selectedRestDuration === sec && [styles.restOptionBtnActive, { backgroundColor: activeTheme.primary, borderColor: activeTheme.primary }]]} onPress={() => { setSelectedRestDuration(sec); if (restSecondsLeft !== null) { setRestSecondsLeft(sec); } }}>
                    <Text style={[styles.restOptionBtnText, selectedRestDuration === sec && styles.restOptionBtnTextActive]}>{sec}s</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
              {activeWorkout.exercises.map((exercise, exIdx) => {
                const prevData = getPreviousExerciseData(exercise.name);
                const completed1RMs = exercise.sets.filter((s) => s.completed && s.weight > 0 && s.reps > 0).map((s) => calculate1RM(s.weight, s.reps));
                const best1RM = completed1RMs.length > 0 ? Math.max(...completed1RMs) : 0;
                const firstSetWeight = exercise.sets[0]?.weight || 135;

                return (
                  <View key={exercise.id} style={[styles.activeExerciseCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                    <View style={styles.exerciseCardHeader}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.activeExerciseTitle, { color: currentTheme.textPrimary }]}>{exercise.name}</Text>
                        {prevData && (<Text style={[styles.prevSessionHint, { color: activeTheme.primaryLight }]}>Last: {prevData[0]?.weight} lbs × {prevData[0]?.reps} reps</Text>)}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 6, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: activeTheme.primary + '55' }} onPress={() => openCalculatorModal(exercise.name, firstSetWeight)}><Ionicons name="calculator-outline" size={15} color={activeTheme.primaryLight} /><Text style={{ fontSize: 11, fontWeight: 'bold', marginLeft: 3, color: activeTheme.primaryLight }}>Plates</Text></TouchableOpacity>
                        {best1RM > 0 && (<View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }}><Ionicons name="flame" size={12} color={activeTheme.primaryLight} style={{ marginRight: 3 }} /><Text style={{ fontSize: 11, fontWeight: '600', color: activeTheme.primaryLight }}>{best1RM} lbs</Text></View>)}
                        <TouchableOpacity style={{ padding: 4, marginLeft: 6 }} onPress={() => removeExerciseFromActiveWorkout(exIdx)}><Ionicons name="trash-outline" size={15} color="#888" /></TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.colHeader, { color: currentTheme.textSecondary, width: 30 }]}>SET</Text>
                      <Text style={[styles.colHeader, { color: currentTheme.textSecondary, flex: 1 }]}>LBS</Text>
                      <Text style={[styles.colHeader, { color: currentTheme.textSecondary, flex: 1 }]}>REPS</Text>
                      <Text style={[styles.colHeader, { color: currentTheme.textSecondary, width: 45, textAlign: 'center' }]}>RPE</Text>
                      <Text style={[styles.colHeader, { color: currentTheme.textSecondary, width: 50, textAlign: 'center' }]}>1RM</Text>
                      <Text style={[styles.colHeader, { color: currentTheme.textSecondary, width: 40, textAlign: 'center' }]}>DONE</Text>
                    </View>

                    {exercise.sets.map((set, sIdx) => {
                      const estimated1RM = calculate1RM(set.weight || 0, set.reps || 0);
                      const isLocked = isRestingActive && !set.completed;

                      return (
                        <View key={set.id} style={[styles.setRowInteractive, set.completed && styles.setRowCompleted, isLocked && { opacity: 0.6 }]}>
                          <Text style={{ textAlign: 'center', fontWeight: 'bold', color: currentTheme.textPrimary, width: 30 }}>{set.setNumber}</Text>
                          <TextInput style={{ flex: 1, textAlign: 'center', padding: 8, borderRadius: 6, marginHorizontal: 3, fontSize: 15, backgroundColor: currentTheme.cardBgAlt, color: currentTheme.textPrimary }} keyboardType="numeric" placeholder={prevData && prevData[sIdx] ? String(prevData[sIdx].weight ?? '') : '0'} placeholderTextColor="#555" defaultValue={String(set.weight ?? '')} onChangeText={(val) => updateActiveSet(exIdx, sIdx, 'weight', val)} />
                          <TextInput style={{ flex: 1, textAlign: 'center', padding: 8, borderRadius: 6, marginHorizontal: 3, fontSize: 15, backgroundColor: currentTheme.cardBgAlt, color: currentTheme.textPrimary }} keyboardType="numeric" placeholder={prevData && prevData[sIdx] ? String(prevData[sIdx].reps ?? '') : '0'} placeholderTextColor="#555" defaultValue={String(set.reps ?? '')} onChangeText={(val) => updateActiveSet(exIdx, sIdx, 'reps', val)} />
                          <TextInput style={{ textAlign: 'center', padding: 8, borderRadius: 6, marginHorizontal: 3, fontSize: 15, backgroundColor: currentTheme.cardBgAlt, color: activeTheme.primaryLight, width: 45 }} keyboardType="numeric" placeholder="-" placeholderTextColor="#555" defaultValue={set.rpe ? String(set.rpe) : ''} onChangeText={(val) => updateActiveSet(exIdx, sIdx, 'rpe', val)} />
                          
                          <View style={{ alignItems: 'center', justifyContent: 'center', width: 50 }}><Text style={{ fontSize: 13, fontWeight: 'bold', color: currentTheme.textSecondary }}>{estimated1RM > 0 ? String(estimated1RM ?? '') : '—'}</Text></View>
                          <TouchableOpacity style={[{ height: 36, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginHorizontal: 3, backgroundColor: currentTheme.cardBgAlt, width: 40 }, set.completed && styles.checkBtnActive, isLocked && [styles.checkBtnLocked, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }]]} onPress={() => toggleSetComplete(exIdx, sIdx)}><Ionicons name={set.completed ? 'checkmark' : isLocked ? 'lock-closed' : 'checkmark'} size={isLocked ? 14 : 18} color={set.completed ? '#FFF' : isLocked ? '#666' : '#444'} /></TouchableOpacity>
                        </View>
                      );
                    })}
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 8, paddingVertical: 8, marginTop: 8, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }} onPress={() => addSetToActiveExercise(exIdx)}>
                      <Ionicons name="add" size={15} color={activeTheme.primaryLight} style={{ marginRight: 4 }} /><Text style={{ fontSize: 12, fontWeight: 'bold', color: activeTheme.primaryLight }}>Add Set</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, marginTop: 6, marginBottom: 20, backgroundColor: currentTheme.cardBgAlt, borderColor: activeTheme.primary + '66' }} onPress={() => setActiveAddExerciseModalVisible(true)} activeOpacity={0.8}>
                <Ionicons name="add-circle" size={20} color={activeTheme.primary} style={{ marginRight: 6 }} /><Text style={{ fontSize: 15, fontWeight: 'bold', color: currentTheme.textPrimary }}>Add Movement to Session</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Animated.View>

      {/* ============================================================ */}
      {/* 4. ROOT-MOUNTED MODALS */}
      {/* ============================================================ */}

      {/* Rest Timer Modal */}
      <Modal visible={isTimerModalVisible && restSecondsLeft !== null} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(5, 5, 8, 0.92)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={[{ width: '100%', maxWidth: 340, borderRadius: 24, paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', borderWidth: 1.5, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 22, elevation: 12, backgroundColor: currentTheme.cardBg, borderColor: activeTheme.primary, shadowColor: activeTheme.primary }, restSecondsLeft === 0 && { borderColor: '#34C759', shadowColor: '#34C759' }]}>
            <View style={{ width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: activeTheme.primary + '44' }}><Ionicons name={restSecondsLeft === 0 ? 'checkmark-circle' : 'flame'} size={46} color={restSecondsLeft === 0 ? '#34C759' : activeTheme.primary} /></View>
            <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 2, marginBottom: 8, color: activeTheme.primaryLight }}>{restSecondsLeft === 0 ? 'FORGE READY' : 'REST INTERVAL'}</Text>
            <Text style={[{ fontSize: 54, fontWeight: '900', letterSpacing: 1, marginVertical: 4, textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10, color: currentTheme.textPrimary, textShadowColor: activeTheme.primary + '80' }, restSecondsLeft === 0 && { color: '#34C759' }]}>{restSecondsLeft === 0 ? 'GO!' : formatTimerDisplay(restSecondsLeft ?? 0)}</Text>
            <Text style={{ fontSize: 13, textAlign: 'center', lineHeight: 18, marginTop: 4, marginBottom: 24, color: currentTheme.textSecondary }}>{restSecondsLeft === 0 ? 'Rest cycle complete. Begin your next set!' : 'Upcoming sets are locked until countdown finishes.'}</Text>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              {restSecondsLeft !== 0 && (<TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginRight: 10, backgroundColor: currentTheme.cardBgAlt, borderColor: activeTheme.primary + '66' }} onPress={() => setRestSecondsLeft((prev) => (prev ? prev + 30 : 30))}><Ionicons name="add" size={18} color={activeTheme.primaryLight} style={{ marginRight: 4 }} /><Text style={{ fontWeight: 'bold', fontSize: 14, color: activeTheme.primaryLight }}>+30s</Text></TouchableOpacity>)}
              <TouchableOpacity style={[{ flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }, restSecondsLeft === 0 && { backgroundColor: '#34C759', borderColor: '#34C759' }]} onPress={cancelRestTimer}><Text style={restSecondsLeft === 0 ? { color: '#FFF', fontWeight: 'bold', fontSize: 14 } : { color: currentTheme.textPrimary, fontWeight: 'bold', fontSize: 14 }}>{restSecondsLeft === 0 ? 'Continue Workout' : 'Skip Rest (Unlock)'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Plate Calculator Modal */}
      <Modal visible={calcModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 }}>
          <View style={{ borderRadius: 16, padding: 20, borderWidth: 1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 14, backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ flex: 1, marginRight: 10 }}><Text style={{ fontSize: 18, fontWeight: 'bold', color: currentTheme.textPrimary }}>Plate & Warm-Up</Text><Text style={{ fontSize: 13, marginTop: 2, color: activeTheme.primaryLight }}>{calcExerciseName}</Text></View>
              <TouchableOpacity onPress={() => setCalcModalVisible(false)}><Ionicons name="close-circle" size={24} color="#888" /></TouchableOpacity>
            </View>
            <Text style={[styles.modalLabel, { color: currentTheme.textPrimary }]}>Target Load (lbs):</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10, backgroundColor: currentTheme.cardBgAlt }}>
              <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setCalcTargetWeight((w) => Math.max(45, w - 5))}><Ionicons name="remove" size={18} color="#FFF" /></TouchableOpacity>
              <Text style={{ fontSize: 22, fontWeight: 'bold', marginHorizontal: 24, color: currentTheme.textPrimary }}>{calcTargetWeight} lbs</Text>
              <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setCalcTargetWeight((w) => w + 5)}><Ionicons name="add" size={18} color="#FFF" /></TouchableOpacity>
            </View>
            <Text style={[styles.modalLabel, { color: currentTheme.textPrimary }]}>Plates on Each Side (45 lb Bar):</Text>
            <View style={{ padding: 12, borderRadius: 10, backgroundColor: currentTheme.cardBgAlt }}>
              {calculatePlatesPerSide(calcTargetWeight).length === 0 ? (
                <Text style={{ color: '#888', fontStyle: 'italic' }}>Bar only (45 lbs) — no plates needed.</Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {calculatePlatesPerSide(calcTargetWeight).map((p, idx) => (
                    <View key={idx} style={{ borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 8, marginBottom: 6, backgroundColor: currentTheme.cardBg, borderColor: activeTheme.primary + '55' }}><Text style={{ fontWeight: 'bold', fontSize: 13, color: currentTheme.textPrimary }}>{p.count} × <Text style={{ color: activeTheme.primaryLight }}>{p.plate} lb</Text></Text></View>
                  ))}
                </View>
              )}
            </View>
            <Text style={[styles.modalLabel, { color: currentTheme.textPrimary }]}>Recommended Warm-Up Protocol:</Text>
            <View style={{ padding: 10, borderRadius: 10, backgroundColor: currentTheme.cardBgAlt }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: currentTheme.border }}><Text style={{ fontSize: 13, color: currentTheme.textSecondary }}>Set 1 (Bar Only)</Text><Text style={{ fontWeight: 'bold', fontSize: 13, color: currentTheme.textPrimary }}>45 lbs × 10 reps</Text></View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: currentTheme.border }}><Text style={{ fontSize: 13, color: currentTheme.textSecondary }}>Set 2 (50%)</Text><Text style={{ fontWeight: 'bold', fontSize: 13, color: currentTheme.textPrimary }}>{Math.max(45, Math.round((calcTargetWeight * 0.5) / 5) * 5)} lbs × 6 reps</Text></View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: currentTheme.border }}><Text style={{ fontSize: 13, color: currentTheme.textSecondary }}>Set 3 (70%)</Text><Text style={{ fontWeight: 'bold', fontSize: 13, color: currentTheme.textPrimary }}>{Math.max(45, Math.round((calcTargetWeight * 0.7) / 5) * 5)} lbs × 3 reps</Text></View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: currentTheme.border }}><Text style={{ fontSize: 13, color: currentTheme.textSecondary }}>Set 4 (85%)</Text><Text style={{ fontWeight: 'bold', fontSize: 13, color: currentTheme.textPrimary }}>{Math.max(45, Math.round((calcTargetWeight * 0.85) / 5) * 5)} lbs × 1 rep</Text></View>
            </View>
            <TouchableOpacity style={{ paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 18, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, backgroundColor: activeTheme.primary, shadowColor: activeTheme.primary }} onPress={() => setCalcModalVisible(false)}><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Done</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal visible={activeAddExerciseModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 }}>
          <View style={{ borderRadius: 16, padding: 20, borderWidth: 1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 14, backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.modalTitle, { color: currentTheme.textPrimary }]}>Add Movement to Session</Text>
                <Text style={[styles.modalSub, { color: activeTheme.primaryLight }]}>Select or forge a new lift</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveAddExerciseModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={[styles.customCreationBox, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border, marginBottom: 10 }]}>
              <Text style={[styles.customCreationTitle, { color: currentTheme.textPrimary }]}>+ Quick Forge Custom</Text>
              <TextInput style={[styles.input, { backgroundColor: currentTheme.cardBg, color: currentTheme.textPrimary, borderColor: currentTheme.border, marginHorizontal: 0, height: 40 }]} placeholder="Movement Name..." placeholderTextColor="#777" value={activeCustomExName} onChangeText={setActiveCustomExName} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                {MUSCLE_GROUPS.filter(g => g !== 'All').map((muscle) => (
                  <TouchableOpacity key={muscle} style={[styles.filterChip, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }, activeCustomExMuscle === muscle && { backgroundColor: activeTheme.primary, borderColor: activeTheme.primary }]} onPress={() => setActiveCustomExMuscle(muscle)}>
                    <Text style={[styles.filterChipText, { color: activeCustomExMuscle === muscle ? '#FFF' : currentTheme.textSecondary }]}>{muscle}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.customCreationSubmitBtn, { backgroundColor: activeTheme.primary }]} onPress={addCustomExerciseToActiveWorkout}><Text style={styles.customCreationSubmitText}>Add & Insert</Text></TouchableOpacity>
            </View>

            <View style={[styles.searchBar, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }]}>
              <Ionicons name="search" size={18} color="#777" style={{ marginRight: 8 }} />
              <TextInput style={[styles.searchInput, { color: currentTheme.textPrimary }]} placeholder="Search movement..." placeholderTextColor="#777" value={activeExerciseSearchQuery} onChangeText={setActiveExerciseSearchQuery} />
              {activeExerciseSearchQuery.length > 0 && (<TouchableOpacity onPress={() => setActiveExerciseSearchQuery('')}><Ionicons name="close-circle" size={18} color="#777" /></TouchableOpacity>)}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
              {MUSCLE_GROUPS.map((group) => (
                <TouchableOpacity key={group} style={[styles.filterChip, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }, activeExerciseCategory === group && [styles.filterChipActive, { backgroundColor: activeTheme.primary, borderColor: activeTheme.primary }]]} onPress={() => setActiveExerciseCategory(group)}>
                  <Text style={[styles.filterChipText, { color: currentTheme.textSecondary }, activeExerciseCategory === group && styles.filterChipTextActive]}>{group}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {activeFilteredExercises.map((ex) => (
                <TouchableOpacity key={ex.id} style={[styles.pickerItem, { backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }]} onPress={() => addExerciseToActiveWorkout(ex.name, ex.muscle)}>
                  <View><Text style={[styles.pickerText, { color: currentTheme.textPrimary }]}>{ex.name}</Text><Text style={[styles.pickerSubtext, { color: currentTheme.textSecondary }]}>{ex.muscle}</Text></View>
                  <Ionicons name="add-circle-outline" size={22} color={activeTheme.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={{ paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12, backgroundColor: activeTheme.primary }} onPress={() => setActiveAddExerciseModalVisible(false)}><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Set/Rep Configuration Modal */}
      <Modal visible={configuringExercise !== null} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 }}>
          <View style={{ borderRadius: 16, padding: 20, borderWidth: 1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 14, backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, maxWidth: 320, alignSelf: 'center' }}>
            {configuringExercise && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={[styles.modalTitle, { color: currentTheme.textPrimary }]}>{configuringExercise.name}</Text>
                    <Text style={[styles.modalSub, { color: activeTheme.primaryLight }]}>Configure Starting Sets & Reps</Text>
                  </View>
                  <TouchableOpacity onPress={() => setConfiguringExercise(null)}><Ionicons name="close-circle" size={24} color="#888" /></TouchableOpacity>
                </View>
                <Text style={[styles.modalLabel, { color: currentTheme.textSecondary }]}>Number of Working Sets:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10, backgroundColor: currentTheme.cardBgAlt }}>
                  <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setConfigSets(String(Math.max(1, parseInt(configSets, 10) - 1)))}><Ionicons name="remove" size={18} color="#FFF" /></TouchableOpacity>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', marginHorizontal: 24, color: currentTheme.textPrimary }}>{configSets} Sets</Text>
                  <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setConfigSets(String(parseInt(configSets, 10) + 1))}><Ionicons name="add" size={18} color="#FFF" /></TouchableOpacity>
                </View>
                <Text style={[styles.modalLabel, { color: currentTheme.textSecondary }]}>Target Reps per Set:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10, backgroundColor: currentTheme.cardBgAlt }}>
                  <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setConfigReps(String(Math.max(1, parseInt(configReps, 10) - 1)))}><Ionicons name="remove" size={18} color="#FFF" /></TouchableOpacity>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', marginHorizontal: 24, color: currentTheme.textPrimary }}>{configReps} Reps</Text>
                  <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setConfigReps(String(parseInt(configReps, 10) + 1))}><Ionicons name="add" size={18} color="#FFF" /></TouchableOpacity>
                </View>
                <TouchableOpacity style={{ paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, backgroundColor: activeTheme.primary, shadowColor: activeTheme.primary }} onPress={confirmAddExerciseToRoutineBuilder}><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Add to Routine</Text></TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Biometrics Editor Modal */}
      <Modal visible={biometricsEditModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 }}>
          <View style={{ borderRadius: 16, padding: 20, borderWidth: 1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 14, backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.modalTitle, { color: currentTheme.textPrimary }]}>Edit Biometrics</Text>
                <Text style={[styles.modalSub, { color: activeTheme.primaryLight }]}>Update height, weight, and waist</Text>
              </View>
              <TouchableOpacity onPress={() => setBiometricsEditModalVisible(false)}><Ionicons name="close-circle" size={24} color="#888" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', backgroundColor: currentTheme.cardBgAlt, padding: 12, borderRadius: 12, marginVertical: 8, borderWidth: 1, borderColor: currentTheme.border }}>
                <Text style={[styles.modalLabel, { marginTop: 0, color: currentTheme.textSecondary }]}>Height</Text>
                <Text style={{ color: activeTheme.primaryLight, fontSize: 22, fontWeight: '900', marginVertical: 2 }}>{Math.floor(tempProfile.heightInches / 12)}' {tempProfile.heightInches % 12}" <Text style={{ fontSize: 12, color: currentTheme.textSecondary }}>({tempProfile.heightInches} in)</Text></Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setTempProfile({ ...tempProfile, heightInches: Math.max(48, tempProfile.heightInches - 1) })}><Ionicons name="remove" size={16} color="#FFF" /></TouchableOpacity>
                  <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setTempProfile({ ...tempProfile, heightInches: Math.min(96, tempProfile.heightInches + 1) })}><Ionicons name="add" size={16} color="#FFF" /></TouchableOpacity>
                </View>
              </View>
              <View style={{ alignItems: 'center', backgroundColor: currentTheme.cardBgAlt, padding: 12, borderRadius: 12, marginVertical: 8, borderWidth: 1, borderColor: currentTheme.border }}>
                <Text style={[styles.modalLabel, { marginTop: 0, color: currentTheme.textSecondary }]}>Current Body Weight</Text>
                <Text style={{ color: activeTheme.primaryLight, fontSize: 22, fontWeight: '900', marginVertical: 2 }}>{tempProfile.bodyWeightLbs} lbs</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setTempProfile({ ...tempProfile, bodyWeightLbs: Math.max(80, tempProfile.bodyWeightLbs - 1) })}><Ionicons name="remove" size={16} color="#FFF" /></TouchableOpacity>
                  <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setTempProfile({ ...tempProfile, bodyWeightLbs: tempProfile.bodyWeightLbs + 1 })}><Ionicons name="add" size={16} color="#FFF" /></TouchableOpacity>
                </View>
              </View>
              <View style={{ alignItems: 'center', backgroundColor: currentTheme.cardBgAlt, padding: 12, borderRadius: 12, marginVertical: 8, borderWidth: 1, borderColor: currentTheme.border }}>
                <Text style={[styles.modalLabel, { marginTop: 0, color: currentTheme.textSecondary }]}>Waist Measurement</Text>
                <Text style={{ color: activeTheme.primaryLight, fontSize: 22, fontWeight: '900', marginVertical: 2 }}>{tempProfile.waistInches} inches</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setTempProfile({ ...tempProfile, waistInches: Math.max(20, tempProfile.waistInches - 1) })}><Ionicons name="remove" size={16} color="#FFF" /></TouchableOpacity>
                  <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setTempProfile({ ...tempProfile, waistInches: tempProfile.waistInches + 1 })}><Ionicons name="add" size={16} color="#FFF" /></TouchableOpacity>
                </View>
              </View>
              <View style={{ alignItems: 'center', backgroundColor: currentTheme.cardBgAlt, padding: 12, borderRadius: 12, marginVertical: 8, borderWidth: 1, borderColor: currentTheme.border }}>
                <Text style={[styles.modalLabel, { marginTop: 0, color: currentTheme.textSecondary }]}>Target Weight</Text>
                <Text style={{ color: activeTheme.primaryLight, fontSize: 22, fontWeight: '900', marginVertical: 2 }}>{tempProfile.targetWeightLbs} lbs</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setTempProfile({ ...tempProfile, targetWeightLbs: Math.max(80, tempProfile.targetWeightLbs - 1) })}><Ionicons name="remove" size={16} color="#FFF" /></TouchableOpacity>
                  <TouchableOpacity style={{ padding: 10, borderRadius: 8, backgroundColor: currentTheme.border }} onPress={() => setTempProfile({ ...tempProfile, targetWeightLbs: tempProfile.targetWeightLbs + 1 })}><Ionicons name="add" size={16} color="#FFF" /></TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity style={{ paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 14, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, backgroundColor: activeTheme.primary, shadowColor: activeTheme.primary }} onPress={handleSaveBiometrics}><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Save & Recalculate</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Identity Edit Modal */}
      <Modal visible={identityEditModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 }}>
          <View style={{ borderRadius: 16, padding: 20, borderWidth: 1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 14, backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.modalTitle, { color: currentTheme.textPrimary }]}>Edit Identity</Text>
                <Text style={[styles.modalSub, { color: activeTheme.primaryLight }]}>Update your nickname</Text>
              </View>
              <TouchableOpacity onPress={() => setIdentityEditModalVisible(false)}><Ionicons name="close-circle" size={24} color="#888" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalLabel, { color: currentTheme.textSecondary }]}>First Name (Locked):</Text>
              <TextInput style={[styles.input, { backgroundColor: currentTheme.cardBgAlt, color: currentTheme.textSecondary, borderColor: currentTheme.border, marginHorizontal: 0 }]} value={userProfile.firstName} editable={false} />
              <Text style={[styles.modalLabel, { color: currentTheme.textSecondary }]}>Last Name (Locked):</Text>
              <TextInput style={[styles.input, { backgroundColor: currentTheme.cardBgAlt, color: currentTheme.textSecondary, borderColor: currentTheme.border, marginHorizontal: 0 }]} value={userProfile.lastName} editable={false} />
              <Text style={[styles.modalLabel, { color: currentTheme.textSecondary }]}>Nickname:</Text>
              <TextInput style={[styles.input, { backgroundColor: currentTheme.cardBgAlt, color: currentTheme.textPrimary, borderColor: currentTheme.border, marginHorizontal: 0 }]} value={tempProfile.nickname} onChangeText={(val) => setTempProfile({ ...tempProfile, nickname: val })} placeholder="Nickname" placeholderTextColor="#777" />
            </ScrollView>
            <TouchableOpacity style={{ paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 14, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, backgroundColor: activeTheme.primary, shadowColor: activeTheme.primary }} onPress={handleSaveIdentityAndGoals}><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Save Identity</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={settingsModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 }}>
          <View style={{ borderRadius: 16, padding: 20, borderWidth: 1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 14, backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ flex: 1, marginRight: 10 }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="settings" size={20} color={activeTheme.primaryLight} style={{ marginRight: 6 }} /><Text style={[styles.modalTitle, { color: currentTheme.textPrimary }]}>Forge Settings</Text></View><Text style={[styles.modalSub, { color: currentTheme.textSecondary }]}>Customize appearance & data exports</Text></View>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}><Ionicons name="close-circle" size={24} color="#888" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 14, marginBottom: 10, textTransform: 'uppercase', color: currentTheme.textSecondary }}>APPEARANCE MODE</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}><Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={activeTheme.primary} style={{ marginRight: 10 }} /><View><Text style={{ fontSize: 13, fontWeight: 'bold', color: currentTheme.textPrimary }}>{isDarkMode ? 'Dark Forge Mode' : 'Light Forge Mode'}</Text><Text style={{ fontSize: 11, marginTop: 2, color: currentTheme.textSecondary }}>{isDarkMode ? 'Deep charcoal & ember lighting' : 'Clean crisp daylight theme'}</Text></View></View><Switch value={isDarkMode} onValueChange={handleToggleDarkMode} trackColor={{ false: '#D1D1D6', true: activeTheme.primary }} thumbColor="#FFF" />
              </View>
              
              <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 14, marginBottom: 10, textTransform: 'uppercase', color: currentTheme.textSecondary }}>FORGE ACCENT THEME</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {THEME_OPTIONS.map((theme) => {
                  const isSelected = activeTheme.id === theme.id;
                  return (
                    <TouchableOpacity key={theme.id} style={[{ width: '48%', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }, isSelected && { borderWidth: 1.5, borderColor: theme.primary }]} onPress={() => handleSelectTheme(theme)} activeOpacity={0.8}>
                      <View style={{ width: 18, height: 18, borderRadius: 9, marginRight: 8, backgroundColor: theme.primary }} /><Text style={[{ flex: 1, fontSize: 12, color: currentTheme.textSecondary }, isSelected && { color: currentTheme.textPrimary, fontWeight: 'bold' }]}>{theme.name}</Text>{isSelected && <Ionicons name="checkmark-circle" size={16} color={theme.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 14, marginBottom: 10, textTransform: 'uppercase', color: currentTheme.textSecondary }}>MY HOME DASHBOARD MODULES</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }}><View style={{ flex: 1, marginRight: 10 }}><Text style={{ fontSize: 13, fontWeight: 'bold', color: currentTheme.textPrimary }}>Quick Micro-Stats Bar</Text><Text style={{ fontSize: 11, marginTop: 2, color: currentTheme.textSecondary }}>Show workouts, streak, and total sets pills</Text></View><Switch value={showMicroStats} onValueChange={(val) => { setShowMicroStats(val); handleSaveWidgetSettings('showMicroStats', val); }} trackColor={{ false: '#D1D1D6', true: activeTheme.primary }} thumbColor="#FFF" /></View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }}><View style={{ flex: 1, marginRight: 10 }}><Text style={{ fontSize: 13, fontWeight: 'bold', color: currentTheme.textPrimary }}>7-Day Weekly Heatmap</Text><Text style={{ fontSize: 11, marginTop: 2, color: currentTheme.textSecondary }}>Show weekly active workout consistency flames</Text></View><Switch value={showHeatmap} onValueChange={(val) => { setShowHeatmap(val); handleSaveWidgetSettings('showHeatmap', val); }} trackColor={{ false: '#D1D1D6', true: activeTheme.primary }} thumbColor="#FFF" /></View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }}><View style={{ flex: 1, marginRight: 10 }}><Text style={{ fontSize: 13, fontWeight: 'bold', color: currentTheme.textPrimary }}>Forge Trophy Vault (PRs)</Text><Text style={{ fontSize: 11, marginTop: 2, color: currentTheme.textSecondary }}>Show horizontal estimated 1RM trophy showcase</Text></View><Switch value={showTrophyVault} onValueChange={(val) => { setShowTrophyVault(val); handleSaveWidgetSettings('showTrophyVault', val); }} trackColor={{ false: '#D1D1D6', true: activeTheme.primary }} thumbColor="#FFF" /></View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }}><View style={{ flex: 1, marginRight: 10 }}><Text style={{ fontSize: 13, fontWeight: 'bold', color: currentTheme.textPrimary }}>Next In Rotation Hero Card</Text><Text style={{ fontSize: 11, marginTop: 2, color: currentTheme.textSecondary }}>Show one-tap launch card for your next split</Text></View><Switch value={showHeroCard} onValueChange={(val) => { setShowHeroCard(val); handleSaveWidgetSettings('showHeroCard', val); }} trackColor={{ false: '#D1D1D6', true: activeTheme.primary }} thumbColor="#FFF" /></View>
              
              <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 14, marginBottom: 10, textTransform: 'uppercase', color: currentTheme.textSecondary }}>DATA & INTEGRATIONS</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }}><View style={{ flex: 1, marginRight: 10 }}><Text style={{ fontSize: 13, fontWeight: 'bold', color: currentTheme.textPrimary }}>Sync with Apple Health / Fit</Text><Text style={{ fontSize: 11, marginTop: 2, color: currentTheme.textSecondary }}>Push bodyweight and active calories to device</Text></View><Switch value={healthSyncEnabled} onValueChange={(val) => handleSaveWidgetSettings('healthSyncEnabled', val)} trackColor={{ false: '#D1D1D6', true: activeTheme.primary }} thumbColor="#FFF" /></View>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: currentTheme.cardBgAlt, borderColor: activeTheme.primary, borderWidth: 1, justifyContent: 'center', marginTop: 10, paddingVertical: 14 }]} onPress={handleExportCSV}>
                <Ionicons name="download-outline" size={18} color={activeTheme.primaryLight} style={{ marginRight: 8 }} />
                <Text style={{ color: activeTheme.primaryLight, fontWeight: 'bold' }}>Export Workout History (CSV)</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={{ paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, backgroundColor: activeTheme.primary, shadowColor: activeTheme.primary }} onPress={() => setSettingsModalVisible(false)}><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Save Preferences</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Inspect PR Modal */}
      <Modal visible={selectedPRToInspect !== null} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 }}>
          <View style={{ borderRadius: 16, padding: 20, borderWidth: 1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 14, backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}>
            {selectedPRToInspect && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="trophy" size={18} color={activeTheme.primaryLight} style={{ marginRight: 6 }} /><Text style={[styles.modalTitle, { color: currentTheme.textPrimary }]}>{selectedPRToInspect.exerciseName}</Text></View>
                    <Text style={[styles.modalSub, { color: activeTheme.primaryLight }]}>{selectedPRToInspect.targetMuscle} Power Record</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedPRToInspect(null)}><Ionicons name="close-circle" size={24} color="#888" /></TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', borderRadius: 12, padding: 14, marginVertical: 12, borderWidth: 1, alignItems: 'center', backgroundColor: currentTheme.cardBgAlt, borderColor: currentTheme.border }}>
                  <View style={{ alignItems: 'center' }}><Text style={{ fontSize: 10, fontWeight: '800', marginBottom: 4, color: currentTheme.textSecondary }}>ESTIMATED 1RM</Text><Text style={{ fontSize: 20, fontWeight: '900', color: currentTheme.textPrimary }}>{selectedPRToInspect.hasData ? `${selectedPRToInspect.max1RM} lbs` : 'No Data'}</Text></View>
                  <View style={{ width: 1, height: 32, marginHorizontal: 20, backgroundColor: currentTheme.border }} />
                  <View style={{ alignItems: 'center' }}><Text style={{ fontSize: 10, fontWeight: '800', marginBottom: 4, color: currentTheme.textSecondary }}>NEXT MILESTONE</Text><Text style={{ fontSize: 20, fontWeight: '900', color: activeTheme.primaryLight }}>{selectedPRToInspect.hasData ? `${Math.ceil((selectedPRToInspect.max1RM + 1) / 25) * 25} lbs` : 'First Log'}</Text></View>
                </View>

                <Text style={[styles.modalLabel, { color: currentTheme.textSecondary }]}>Session History & Milestones:</Text>
                <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                  {selectedPRToInspect.historyEntries.length === 0 ? (
                    <Text style={{ color: '#777', fontStyle: 'italic', paddingVertical: 12 }}>No lifts logged for this movement yet. Complete a workout to record history.</Text>
                  ) : (
                    selectedPRToInspect.historyEntries.map((entry, eIdx) => (
                      <View key={eIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: currentTheme.border }}>
                        <View><Text style={{ color: currentTheme.textPrimary, fontWeight: 'bold', fontSize: 13 }}>{entry.weight} lbs × {entry.reps} reps</Text><Text style={{ color: currentTheme.textSecondary, fontSize: 11, marginTop: 2 }}>{entry.date}</Text></View>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, backgroundColor: currentTheme.cardBgAlt, borderColor: activeTheme.primary + '44' }}><Text style={{ color: activeTheme.primaryLight, fontWeight: 'bold', fontSize: 12 }}>{entry.est1RM} 1RM</Text></View>
                      </View>
                    ))
                  )}
                </ScrollView>
                <TouchableOpacity style={{ paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 18, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, backgroundColor: activeTheme.primary, shadowColor: activeTheme.primary }} onPress={() => setSelectedPRToInspect(null)}><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Close Vault</Text></TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Profile Confirmation Modal */}
      <Modal visible={deleteConfirmModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 }}>
          <View style={{ borderRadius: 16, padding: 20, borderWidth: 1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 14, backgroundColor: currentTheme.cardBg, borderColor: '#FF453A', maxWidth: 320, alignSelf: 'center' }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#261214', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FF453A55', marginBottom: 12 }}><Ionicons name="warning" size={30} color="#FF453A" /></View>
              <Text style={[styles.modalTitle, { color: currentTheme.textPrimary, textAlign: 'center' }]}>Delete Profile & Reset Data?</Text>
              <Text style={[styles.modalSub, { color: currentTheme.textSecondary, textAlign: 'center', marginTop: 6 }]}>This will permanently wipe your profile, routines, and workout history. This action cannot be undone.</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 0, backgroundColor: currentTheme.cardBgAlt, borderWidth: 1, borderColor: currentTheme.border }} onPress={() => setDeleteConfirmModalVisible(false)}><Text style={{ color: currentTheme.textPrimary, fontWeight: 'bold', textAlign: 'center', fontSize: 15 }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 0, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, backgroundColor: '#FF453A', shadowColor: '#FF453A' }} onPress={executeDeleteProfile}><Text style={{ color: '#FFF', fontWeight: 'bold', textAlign: 'center', fontSize: 15 }}>Yes, Delete</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', overflow: 'hidden' },
  inner: { flex: 1, padding: 16, paddingBottom: 0, zIndex: 3 },
  vignetteLayer1: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 36, borderWidth: 10, zIndex: 1 },
  vignetteLayer2: { position: 'absolute', top: 6, bottom: 6, left: 6, right: 6, borderRadius: 32, borderWidth: 12, zIndex: 1 },
  vignetteLayer3: { position: 'absolute', top: 14, bottom: 14, left: 14, right: 14, borderRadius: 28, borderWidth: 16, zIndex: 1 },
  vignetteLayer4: { position: 'absolute', top: 24, bottom: 24, left: 24, right: 24, borderRadius: 24, borderWidth: 20, zIndex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerDashboardTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  headerDashboardSub: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  headerBackBtn: { paddingRight: 8, flexShrink: 0 },
  activeHeaderTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', marginHorizontal: 8 },
  headerRightButtons: { flexDirection: 'row', alignItems: 'center' },
  settingsHeaderBtn: { padding: 6, marginRight: 6, borderRadius: 8, borderWidth: 1 },
  headerStreakBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1 },
  headerStreakBadgeText: { fontSize: 11, fontWeight: 'bold' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#261214', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#4A1C1E' },
  clearBtnText: { color: '#FF453A', fontWeight: '600', marginLeft: 4, fontSize: 13 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  finishBtn: { backgroundColor: '#34C759', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, flexShrink: 0 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  finishBtnText: { color: '#FFF', fontWeight: 'bold' },
  input: { flex: 1, padding: 10, borderRadius: 8, marginHorizontal: 10, fontSize: 16, borderWidth: 1 },

  customCreationBox: { borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1 },
  customCreationTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  customCreationInputRow: { flexDirection: 'row', alignItems: 'center' },
  customCreationSubmitBtn: { marginTop: 8, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  customCreationSubmitText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  profileCard: { borderRadius: 16, padding: 20, borderWidth: 1 },
  profileAvatarRow: { flexDirection: 'row', alignItems: 'center' },
  profileNameText: { fontSize: 18, fontWeight: '900' },
  profileRoleText: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  profileSectionHeader: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  profileStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  profileStatBox: { borderRadius: 12, padding: 14, borderWidth: 1, alignItems: 'center' },
  profileStatVal: { fontSize: 18, fontWeight: '900' },
  profileStatLbl: { fontSize: 11, marginTop: 2 },
  profileInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  profileInfoLbl: { fontSize: 13, fontWeight: '600' },
  profileInfoVal: { fontSize: 13, fontWeight: 'bold' },
  deleteProfileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#261214', borderWidth: 1, borderColor: '#FF453A55', borderRadius: 10, paddingVertical: 12, marginTop: 24 },
  deleteProfileBtnText: { color: '#FF453A', fontWeight: 'bold', fontSize: 14 },

  centeredOnboardingWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, zIndex: 3 },
  centeredOnboardingScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingVertical: 20 },

  microStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, gap: 8 },
  microStatPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1 },
  microStatLabel: { fontSize: 10, fontWeight: '700' },
  microStatValue: { fontSize: 11, fontWeight: 'bold' },

  heatmapCard: { borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1 },
  heatmapHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heatmapTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heatmapStreakText: { fontSize: 12, fontWeight: 'bold' },
  heatmapDaysRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heatmapDayBox: { alignItems: 'center', paddingVertical: 4, paddingHorizontal: 4, borderRadius: 10 },
  heatmapDayBoxToday: { borderWidth: 1 },
  heatmapDayLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  heatmapIndicatorCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  heatmapIndicatorActive: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.6, shadowRadius: 6, elevation: 4 },
  heatmapDayNumText: { fontSize: 11, fontWeight: '600' },

  prShowcaseSection: { marginBottom: 16 },
  prShowcaseHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 2 },
  prShowcaseTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  prShowcaseCountText: { fontSize: 12, fontWeight: 'bold' },
  prScrollContent: { paddingRight: 10, gap: 10 },
  prTrophyCard: { width: 148, borderRadius: 14, padding: 12, borderWidth: 1, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
  prTrophyCardEmpty: { shadowOpacity: 0 },
  prCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  trophyIconCircle: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  trophyIconCircleEmpty: {},
  prMuscleTag: { color: '#777', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  prWeightText: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  prWeightUnit: { fontSize: 12, fontWeight: 'bold' },
  prExerciseName: { fontSize: 12, fontWeight: '600', marginTop: 2, marginBottom: 8 },
  prFooterRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingTop: 6 },
  prDateText: { fontSize: 10, fontWeight: '500' },

  heroLaunchCard: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1.5, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10 },
  heroLaunchCardEmpty: { borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1 },
  emptyHeroText: { fontSize: 14, marginBottom: 10 },
  heroCreateBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1 },
  heroCreateBtnText: { fontWeight: 'bold', fontSize: 13 },
  heroLaunchTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroTagBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  heroTagBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  heroLastLoggedText: { fontSize: 12, fontWeight: '500' },
  heroRoutineTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 0.3, marginTop: 2 },
  heroRoutineSubtitle: { fontSize: 13, marginTop: 3, marginBottom: 14 },
  heroActionBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroFreestyleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  heroFreestyleBtnText: { fontSize: 14, fontWeight: 'bold' },

  logoContainer: { justifyContent: 'center', alignItems: 'center', borderWidth: 2, marginBottom: 24, position: 'relative' },
  logoBreathingAura: { position: 'absolute', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 30 },
  logoHalo: { position: 'absolute', borderWidth: 1.5 },
  hammerContainer: { position: 'absolute', top: 18, alignItems: 'center', transform: [{ rotate: '-18deg' }, { translateX: -8 }], zIndex: 4 },
  hammerHandle: { width: 6, height: 38, backgroundColor: '#8B5A2B', borderRadius: 3, borderWidth: 1, borderColor: '#5C3A1E' },
  hammerHead: { width: 32, height: 20, backgroundColor: '#4A4A52', borderRadius: 3, borderWidth: 1.5, borderColor: '#8E8E98', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -4, shadowColor: '#FF8533', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.8, shadowRadius: 6 },
  hammerBevelLeft: { width: 4, height: 14, backgroundColor: '#333338', borderRadius: 1 },
  hammerFace: { flex: 1, height: 18, backgroundColor: '#686872' },
  hammerBevelRight: { width: 4, height: 14, backgroundColor: '#333338', borderRadius: 1 },
  sparksContainer: { position: 'absolute', top: 68, width: 80, height: 20, zIndex: 6 },
  sparkDot: { position: 'absolute', borderRadius: 2, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 5 },
  moltenBarWrapper: { position: 'absolute', top: 66, width: 68, height: 8, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  moltenGlowBackdrop: { position: 'absolute', width: 74, height: 16, borderRadius: 8, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 18 },
  moltenSteelCore: { width: 64, height: 5, backgroundColor: '#FFEA79', borderRadius: 2.5 },
  anvilComplete: { position: 'absolute', bottom: 20, alignItems: 'center', zIndex: 3 },
  anvilFaceRow: { flexDirection: 'row', alignItems: 'flex-end' },
  anvilHornPoint: { width: 0, height: 0, borderTopWidth: 5, borderTopColor: 'transparent', borderBottomWidth: 5, borderBottomColor: 'transparent', borderRightWidth: 16, borderRightColor: '#5A5A64', marginBottom: 1 },
  anvilStep: { width: 6, height: 8, backgroundColor: '#4E4E58', borderTopLeftRadius: 2 },
  anvilFaceTop: { width: 48, height: 12, backgroundColor: '#72727E', borderTopLeftRadius: 1, borderTopRightRadius: 1 },
  anvilHeelRight: { width: 14, height: 12, backgroundColor: '#52525C', borderTopRightRadius: 3 },
  anvilWaist: { width: 32, height: 14, backgroundColor: '#3E3E46', borderLeftWidth: 3, borderRightWidth: 3, borderColor: '#2D2D34' },
  anvilFeetBase: { width: 66, height: 10, backgroundColor: '#2A2A30', borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, borderWidth: 1, borderColor: '#44444C' },

  homeMinimalContainer: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40, zIndex: 2 },
  homeMinimalContent: { alignItems: 'center' },
  homeBrandMain: { fontSize: 34, fontWeight: '900', letterSpacing: 3, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 10 },
  homeBrandSub: { fontSize: 14, fontWeight: '800', letterSpacing: 5, marginTop: 3, marginBottom: 28 },
  homeQuoteText: { fontSize: 17, fontStyle: 'italic', fontWeight: '500', textAlign: 'center', lineHeight: 26, maxWidth: 290 },
  homeBottomBtnContainer: { width: '100%' },

  tabBar: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 10, marginHorizontal: -16 },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBtnActive: {},
  tabBtnText: { fontSize: 11, fontWeight: '600', marginTop: 3 },

  routineCard: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 13 },
  cardActionGroup: { flexDirection: 'row', alignItems: 'center' },
  startWorkoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, marginRight: 8, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 4 },
  startWorkoutBtnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 4, fontSize: 14 },
  deleteSingleBtn: { padding: 8, borderRadius: 6 },
  exploreTemplatesBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginTop: 12, borderWidth: 1 },
  exploreTemplatesBtnText: { fontWeight: '600', fontSize: 14 },

  templateCard: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  templateDescription: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  importBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  importBtnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 4, fontSize: 13 },
  templateExerciseList: { marginTop: 10, borderTopWidth: 1, paddingTop: 8 },
  templateExerciseText: { fontSize: 13, marginVertical: 2 },

  historyCard: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  historyCardTitle: { fontSize: 17, fontWeight: 'bold' },
  historyCardSubtitle: { fontSize: 13 },
  historyStatsRow: { flexDirection: 'row', padding: 10, borderRadius: 8, marginVertical: 10 },
  statBox: { flex: 1 },
  statLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  statVal: { fontSize: 13, fontWeight: 'bold' },
  historyExerciseList: { marginTop: 4 },

  restSelectorContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1 },
  restSelectorTitle: { fontSize: 13, fontWeight: '600' },
  restOptionsRow: { flexDirection: 'row', alignItems: 'center' },
  restOptionBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, marginLeft: 6, borderWidth: 1 },
  restOptionBtnActive: {},
  restOptionBtnText: { fontSize: 12, fontWeight: 'bold' },
  restOptionBtnTextActive: { color: '#FFF' },

  exerciseCard: { padding: 14, borderRadius: 10, marginBottom: 10, borderWidth: 1 },
  exerciseCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sectionHeader: { fontSize: 13, fontWeight: 'bold', marginTop: 14, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  filterScrollView: { marginBottom: 12, maxHeight: 40 },
  filterChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, marginRight: 8, borderWidth: 1 },
  filterChipActive: {},
  filterChipText: { fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#FFF' },

  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 6, borderWidth: 1 },
  pickerText: { fontSize: 15, fontWeight: '500' },
  pickerSubtext: { fontSize: 12, marginTop: 2 },

  activeExerciseCard: { padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  activeExerciseTitle: { fontSize: 16, fontWeight: 'bold' },
  prevSessionHint: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  tableHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  colHeader: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  setRowInteractive: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderRadius: 6, marginVertical: 2 },
  setRowCompleted: { backgroundColor: '#172B1C' },
  checkBtnActive: { backgroundColor: '#34C759' },
  checkBtnLocked: { borderWidth: 1 },

  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalSub: { fontSize: 13, marginTop: 2 },
  modalLabel: { fontSize: 12, fontWeight: 'bold', marginTop: 14, marginBottom: 8, textTransform: 'uppercase' },
  modalCloseBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 18, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6 },
  modalCloseBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  emptyText: { textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
});