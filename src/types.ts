export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';
export type MovementPattern = 'Compound' | 'Isolation';
export type Equipment = 'Dumbbell' | 'Barbell' | 'Machine' | 'Cable' | 'Bodyweight';

export type Rank = 'Novice' | 'Intermediate' | 'Advanced' | 'Elite' | 'Legendary';

export interface MacroStats {
  protein: number;
  carbs: number;
  fats: number;
}

export interface VaultImage {
  id: string;
  url: string;
  date: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  previewUrl: string | null;
  isFallback?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  bio: string;
  rank: Rank;
  level: number;
  totalSets: number;
  streak: number;
  topLifts: {
    bench?: number;
    squat?: number;
    deadlift?: number;
    overhead?: number;
  };
  macroGoals?: MacroStats;
  macroCurrent?: MacroStats;
  vault?: VaultImage[];
  anthem?: SpotifyTrack;
  customSplits: WorkoutPreset[];
  createdAt: number;
}

export interface PublicSplit extends WorkoutPreset {
  authorUid: string;
  authorName: string;
  authorPhoto: string;
  isPublic: boolean;
  downloads: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  pattern: MovementPattern;
  equipment: Equipment;
  emg_score: number;
  image: string;
  topTier?: boolean;
}

export interface PlannedExercise extends Exercise {
  sets: number;
  reps: string;
}

export interface WorkoutDay {
  id: string;
  name: string; // e.g., "Push Day"
  exercises: PlannedExercise[];
}

export interface WeeklySchedule {
  [key: string]: string | null; // Day of week -> WorkoutDay ID
}

export interface WorkoutPreset {
  id: string;
  name: string;
  workoutDays: WorkoutDay[];
  schedule: WeeklySchedule;
  createdAt: number;
}
