/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ThemeCard from './components/ThemeCard';
import ExerciseLibrary from './components/ExerciseLibrary';
import SplitCreator from './components/SplitCreator';
import WeeklyPlanner from './components/WeeklyPlanner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MusicProvider, useMusic } from './context/MusicContext';
import { auth, googleProvider, db } from './lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import ProfileView from './components/Profile';
import { Flame, Target, TrendingUp, Clock, Plus, Save, ChevronRight, LayoutGrid, BookOpen, Calendar as CalendarIcon, Trash2, Edit2, LogIn, Play, Pause, Music, CheckCircle2, Timer, Trophy, Award, Zap, ChevronLeft, Flag, X } from 'lucide-react';
import { Exercise, WorkoutDay, WeeklySchedule, PlannedExercise, WorkoutPreset } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { EXERCISES } from './data/exercises';

// Premium master default PPL split template
const PPL_MASTERY_PRESET: WorkoutPreset = {
  id: 'ppl-mastery',
  name: 'PPL Mastery',
  workoutDays: [
    {
      id: 'ppl-push',
      name: 'Push Day',
      exercises: [
        {
          id: 'bench_01',
          name: 'Barbell Bench Press',
          muscle: 'Chest',
          pattern: 'Compound',
          equipment: 'Barbell',
          emg_score: 95,
          image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=600',
          topTier: true,
          sets: 4,
          reps: '8-10'
        },
        {
          id: 'bench_02',
          name: 'Incline Dumbbell Press',
          muscle: 'Chest',
          pattern: 'Compound',
          equipment: 'Dumbbell',
          emg_score: 91,
          image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=600',
          topTier: true,
          sets: 3,
          reps: '10-12'
        },
        {
          id: 'bench_03',
          name: 'Weighted Dips',
          muscle: 'Chest',
          pattern: 'Compound',
          equipment: 'Bodyweight',
          emg_score: 93,
          image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=600',
          topTier: true,
          sets: 3,
          reps: '8-10'
        },
        {
          id: 'ar-13',
          name: 'Skull Crushers (EZ Bar)',
          muscle: 'Arms',
          pattern: 'Isolation',
          equipment: 'Barbell',
          emg_score: 95,
          image: 'https://picsum.photos/seed/skull-crusher/400/300',
          topTier: true,
          sets: 3,
          reps: '10-12'
        },
        {
          id: 'ar-11',
          name: 'Triceps Pushdown (Rope)',
          muscle: 'Arms',
          pattern: 'Isolation',
          equipment: 'Cable',
          emg_score: 94,
          image: 'https://picsum.photos/seed/rope-pushdown/400/300',
          topTier: true,
          sets: 3,
          reps: '12-15'
        }
      ]
    },
    {
      id: 'ppl-pull',
      name: 'Pull Day',
      exercises: [
        {
          id: 'back-pullups',
          name: 'Weighted Pull-Ups',
          muscle: 'Back',
          pattern: 'Compound',
          equipment: 'Bodyweight',
          emg_score: 94,
          image: 'https://picsum.photos/seed/pullups/400/300',
          topTier: true,
          sets: 4,
          reps: '8-10'
        },
        {
          id: 'back-rows',
          name: 'Barbell Rows',
          muscle: 'Back',
          pattern: 'Compound',
          equipment: 'Barbell',
          emg_score: 91,
          image: 'https://picsum.photos/seed/rows/400/300',
          topTier: true,
          sets: 3,
          reps: '10-12'
        },
        {
          id: 'ar-1',
          name: 'Barbell Bicep Curl',
          muscle: 'Arms',
          pattern: 'Isolation',
          equipment: 'Barbell',
          emg_score: 92,
          image: 'https://picsum.photos/seed/bb-curl/400/300',
          topTier: true,
          sets: 3,
          reps: '8-10'
        }
      ]
    },
    {
      id: 'ppl-legs',
      name: 'Leg Day',
      exercises: [
        {
          id: 'leg-squats',
          name: 'Barbell Squat',
          muscle: 'Legs',
          pattern: 'Compound',
          equipment: 'Barbell',
          emg_score: 95,
          image: 'https://picsum.photos/seed/squat/400/300',
          topTier: true,
          sets: 4,
          reps: '8-10'
        },
        {
          id: 'leg-press',
          name: 'Leg Press',
          muscle: 'Legs',
          pattern: 'Compound',
          equipment: 'Machine',
          emg_score: 88,
          image: 'https://picsum.photos/seed/legpress/400/300',
          sets: 3,
          reps: '10-12'
        },
        {
          id: 'cr-1',
          name: 'Hanging Leg Raises',
          muscle: 'Core',
          pattern: 'Isolation',
          equipment: 'Bodyweight',
          emg_score: 96,
          image: 'https://picsum.photos/seed/leg-raise/400/300',
          topTier: true,
          sets: 3,
          reps: '12-15'
        }
      ]
    }
  ],
  schedule: {
    Monday: 'ppl-push',
    Tuesday: 'ppl-pull',
    Wednesday: null,
    Thursday: 'ppl-legs',
    Friday: 'ppl-push',
    Saturday: null,
    Sunday: null,
  },
  createdAt: Date.now()
};

function Home() {
  const { profile, user } = useAuth();
  
  // Available presets from all sources
  const [localPresets, setLocalPresets] = useState<WorkoutPreset[]>([]);
  const [activeSplitId, setActiveSplitId] = useState<string>(() => {
    return localStorage.getItem('kinetic_active_split_id') || 'ppl-mastery';
  });
  
  // Selected day within active split
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  // Active workout session HUD state
  const [activeSession, setActiveSession] = useState<{
    split: WorkoutPreset;
    day: WorkoutDay;
  } | null>(null);

  // Active exercise inside live workout
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Set tracker input state: setIndex -> {weight, reps, completed}
  const [setsState, setSetsState] = useState<{
    [setIndex: number]: { weight: string; reps: string; completed: boolean };
  }>({});

  // Active workout timer
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Automated rest timer state (between sets)
  const [restSeconds, setRestSeconds] = useState(0);
  const [restMaxSeconds, setRestMaxSeconds] = useState(90);
  const [isRestActive, setIsRestActive] = useState(false);
  const [showEdgeFlash, setShowEdgeFlash] = useState(false);

  // Aggregated workout metrics arrays
  const [loggedSessionData, setLoggedSessionData] = useState<{
    exerciseId: string;
    name: string;
    sets: { weight: number; reps: number }[];
  }[]>([]);

  // Stop confirmation & Summary modal controls
  const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
  const [isRecapOpen, setIsRecapOpen] = useState(false);

  // Completed log metrics cached for summary modal
  const [finalMetrics, setFinalMetrics] = useState({
    duration: 0,
    totalSets: 0,
    totalVolume: 0,
    calories: 0,
    recapLogs: [] as any[]
  });

  // Recent Completed Workout Logs State
  const [userLogs, setUserLogs] = useState<any[]>([]);

  // 1. Load splits, logs, preset ID from LocalStorage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('kinetic_presets');
    if (savedPresets) {
      try {
        setLocalPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error("Error loading local presets:", e);
      }
    }
    
    // Load physical workout logs
    const savedLogs = localStorage.getItem('kinetic_completed_workout_logs');
    if (savedLogs) {
      try {
        setUserLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Error loading logged workouts:", e);
      }
    } else {
      // Setup some initial sleek starter logs so user has dynamic data immediately
      const initialLogs = [
        {
          id: 'init-1',
          presetName: 'PPL Mastery',
          dayName: 'Push Day',
          duration: 2540, // 42 mins
          totalSets: 12,
          totalWeight: 3240,
          date: Date.now() - 24 * 3600 * 1000 // yesterday
        },
        {
          id: 'init-2',
          presetName: 'PPL Mastery',
          dayName: 'Pull Day',
          duration: 3100, // 51 mins
          totalSets: 11,
          totalWeight: 2980,
          date: Date.now() - 3 * 24 * 3600 * 1000 // 3 days ago
        }
      ];
      setUserLogs(initialLogs);
      localStorage.setItem('kinetic_completed_workout_logs', JSON.stringify(initialLogs));
    }
  }, []);

  // Sync active split ID
  useEffect(() => {
    localStorage.setItem('kinetic_active_split_id', activeSplitId);
  }, [activeSplitId]);

  // Combined unique split master lists
  const allSplits = [PPL_MASTERY_PRESET, ...(profile?.customSplits || []), ...localPresets];
  const uniqueSplits = allSplits.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
  const activeSplit = uniqueSplits.find(s => s.id === activeSplitId) || PPL_MASTERY_PRESET;

  // Active workout stopwatch runner
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Automated Rest Timer Countdown (between sets)
  useEffect(() => {
    let interval: any = null;
    if (isRestActive && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds(prev => {
          if (prev <= 1) {
            // Rest phase completed! Stop countdown and trigger the screen edge flash alert
            setIsRestActive(false);
            setShowEdgeFlash(true);
            setTimeout(() => {
              setShowEdgeFlash(false);
            }, 1500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRestActive, restSeconds]);

  // Adjust rest time dynamically by a delta: e.g. +30s or -30s
  const adjustRestTime = (amount: number) => {
    setRestSeconds(prev => {
      const nextVal = prev + amount;
      if (nextVal <= 0) {
        setIsRestActive(false);
        return 0;
      }
      // Expand maximum scale dynamically so circular ring percentages scale correctly
      if (amount > 0) {
        setRestMaxSeconds(max => Math.max(max, nextVal));
      }
      return nextVal;
    });
  };

  // Auto initialize set inputs for the active exercise when index shifts
  const activeExercise = activeSession?.day.exercises[currentExerciseIndex] || null;

  useEffect(() => {
    if (!activeExercise) return;
    const initial: typeof setsState = {};
    const setsCount = activeExercise.sets || 3;
    const repsTarget = activeExercise.reps || '10';
    // Split target "8-12" or similar to fallback rep limit
    const parsedReps = repsTarget.split('-').pop()?.trim() || '10';

    for (let i = 0; i < setsCount; i++) {
      initial[i] = {
        weight: '60',
        reps: parsedReps,
        completed: false
      };
    }
    setSetsState(initial);
  }, [currentExerciseIndex, activeExercise]);

  const handleStartSession = (split: WorkoutPreset, day: WorkoutDay) => {
    setActiveSession({ split, day });
    setCurrentExerciseIndex(0);
    setSeconds(0);
    setIsTimerRunning(true);
    setLoggedSessionData([]);
    setIsStopConfirmOpen(false);
    setIsRecapOpen(false);
    
    // Explicit clean-slate resets for automated rest timer states
    setRestSeconds(0);
    setRestMaxSeconds(90);
    setIsRestActive(false);
    setShowEdgeFlash(false);
  };

  const handleSetInputChange = (idx: number, field: 'weight' | 'reps', value: string) => {
    setSetsState(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        [field]: value
      }
    }));
  };

  const toggleSetCompletion = (idx: number) => {
    setSetsState(prev => {
      const row = prev[idx] || { weight: '60', reps: '10', completed: false };
      const willBeCompleted = !row.completed;

      // Start rest timer if checked complete
      if (willBeCompleted) {
        setRestSeconds(90); // default to 90 seconds
        setRestMaxSeconds(90);
        setIsRestActive(true);
      }

      return {
        ...prev,
        [idx]: {
          ...row,
          completed: willBeCompleted
        }
      };
    });
  };

  // Move to next exercise and capture the current lift's completed logs
  const handleNextExercise = () => {
    saveCurrentExerciseData();

    // Instant stop: clear & reset rest timer so it doesn't bleed into next lift
    setIsRestActive(false);
    setRestSeconds(0);

    if (activeSession && currentExerciseIndex < activeSession.day.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      concludeTrainingSession();
    }
  };

  const handlePrevExercise = () => {
    // Instant stop: clear & reset rest timer when moving to previous exercise
    setIsRestActive(false);
    setRestSeconds(0);

    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  const saveCurrentExerciseData = () => {
    if (!activeExercise) return;

    // Filter only sets user marked as checked complete
    const completedSets = (Object.values(setsState) as Array<{ weight: string; reps: string; completed: boolean }>)
      .filter(s => s.completed)
      .map(s => ({
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps, 10) || 0
      }));

    // Update session logs array (overwrite or push new depending on current index override)
    setLoggedSessionData(prev => {
      const existingIdx = prev.findIndex(item => item.exerciseId === activeExercise.id);
      const newEntry = {
        exerciseId: activeExercise.id,
        name: activeExercise.name,
        sets: completedSets
      };

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newEntry;
        return copy;
      } else {
        return [...prev, newEntry];
      }
    });
  };

  const concludeTrainingSession = () => {
    if (!activeSession) return;
    setIsTimerRunning(false);

    // Premature stop guard for rest countdown too
    setIsRestActive(false);
    setRestSeconds(0);

    // Make sure we log the current exercise if progress has been made
    const currentCompleted = (Object.values(setsState) as Array<{ weight: string; reps: string; completed: boolean }>)
      .filter(s => s.completed)
      .map(s => ({
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps, 10) || 0
      }));

    // Build the final completed object array
    const finalSessionList = [...loggedSessionData];
    const existingIdx = finalSessionList.findIndex(item => item.exerciseId === activeExercise?.id);
    if (activeExercise) {
      const newEntry = {
        exerciseId: activeExercise.id,
        name: activeExercise.name,
        sets: currentCompleted
      };
      if (existingIdx >= 0) {
        finalSessionList[existingIdx] = newEntry;
      } else {
        finalSessionList.push(newEntry);
      }
    }

    // Process high-level metrics
    const totalSetsCompleted = finalSessionList.reduce((acc, ex) => acc + ex.sets.length, 0);
    const calculatedVolume = finalSessionList.reduce((acc, ex) => {
      return acc + ex.sets.reduce((setAcc, set) => setAcc + (set.weight * set.reps), 0);
    }, 0);
    
    // 12 kcal per completed set + 1.5 kcal/min background rate
    const estimatedBurn = Math.ceil(totalSetsCompleted * 12 + (seconds / 60) * 1.5);

    setFinalMetrics({
      duration: seconds,
      totalSets: totalSetsCompleted,
      totalVolume: calculatedVolume,
      calories: estimatedBurn,
      recapLogs: finalSessionList
    });

    setIsRecapOpen(true);
  };

  // Stop workout prematurely
  const handleStopClick = () => {
    setIsTimerRunning(false); // Pause stopwatch immediately
    setIsRestActive(false);   // Instantly terminate rest countdown along with stopwatch
    setRestSeconds(0);
    setIsStopConfirmOpen(true);
  };

  const handleConcludeEarly = () => {
    setIsStopConfirmOpen(false);
    concludeTrainingSession();
  };

  const handleSaveAndBackHome = async () => {
    // 1. Create a physical Completed Workout Log item
    const newLog = {
      id: `log-${Date.now()}`,
      presetName: activeSession?.split.name || 'Custom Training',
      dayName: activeSession?.day.name || 'Workout Day',
      duration: finalMetrics.duration,
      totalSets: finalMetrics.totalSets,
      totalWeight: finalMetrics.totalVolume,
      date: Date.now()
    };

    const updatedLogs = [newLog, ...userLogs];
    setUserLogs(updatedLogs);
    localStorage.setItem('kinetic_completed_workout_logs', JSON.stringify(updatedLogs));

    // 2. Reactively increment the totalSets in the authenticated profile
    if (profile && user) {
      try {
        const profileRef = doc(db, 'users', profile.uid);
        const nextTotalSets = (profile.totalSets || 0) + finalMetrics.totalSets;
        // Dynamic game leveling system
        const nextLevel = Math.floor(nextTotalSets / 20) + 1;
        const ranks: Array<'Novice' | 'Intermediate' | 'Advanced' | 'Elite' | 'Legendary'> = ['Novice', 'Intermediate', 'Advanced', 'Elite', 'Legendary'];
        const nextRank = nextLevel >= 15 ? ranks[4] : nextLevel >= 10 ? ranks[3] : nextLevel >= 6 ? ranks[2] : nextLevel >= 3 ? ranks[1] : ranks[0];

        await updateDoc(profileRef, {
          totalSets: nextTotalSets,
          level: nextLevel,
          rank: nextRank
        });
      } catch (e) {
        console.error("Firestore stats increment failed:", e);
      }
    }

    // Reset everything
    setActiveSession(null);
    setSelectedDayId(null);
    setIsRecapOpen(false);
    setSeconds(0);
  };

  // Helper stopwatch duration format
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <div className="space-y-6">
      {/* 2. LIVE ACTIVE WORKOUT PORT (Pitch black distraction-free HUD) */}
      <AnimatePresence>
        {activeSession && activeExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col bg-black text-white px-6 py-8 overflow-y-auto w-screen h-screen focus:outline-none select-none"
            id="workout_hud_root"
          >
            {/* Edge Flash Pulse Area (Visual pulse indicator on rest finish) */}
            <AnimatePresence>
              {showEdgeFlash && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="fixed inset-0 z-[250] border-[12px] md:border-[24px] border-[#CCFF00] pointer-events-none shadow-[inset_0_0_100px_rgba(204,255,0,0.4)]"
                  id="screen_edge_rest_flash"
                />
              )}
            </AnimatePresence>

            {/* Global Header Timer Area */}
            <div className="flex flex-col items-center gap-3 border-b border-white/5 pb-5 mt-4" id="hud_timer_header">
              <div className="flex items-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">
                <Timer size={13} className="text-[#CCFF00] animate-pulse" />
                <span>Live Kinetic Session</span>
              </div>
              
              <div className="flex flex-col items-center gap-2 w-full max-w-sm px-4">
                <div className="flex items-center justify-between w-full">
                  {/* Pause/Play Toggle Button */}
                  <button 
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                    title={isTimerRunning ? "Pause timer" : "Resume timer"}
                    id="timer_play_pause"
                  >
                    {isTimerRunning ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                  </button>
                  
                  {/* Massive monospaced Stopwatch Counter (Tappable pauses/resumes tracking) */}
                  <span 
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="font-mono text-3xl font-black tracking-widest text-[#CCFF00] bg-[#CCFF00]/10 px-5 py-2 rounded-2xl border border-[#CCFF00]/10 min-w-[150px] text-center shadow-[0_0_20px_rgba(204,255,0,0.1)] cursor-pointer active:scale-95 hover:border-[#CCFF00]/40 hover:bg-[#CCFF00]/20 transition-all select-none"
                    title="Tap to Pause/Resume Workout"
                    id="stopwatch_counter_display"
                  >
                    {formatTime(seconds)}
                  </span>
                  
                  {/* Exit / Stop Button */}
                  <button 
                    onClick={handleStopClick}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                    title="Conclude early"
                    id="hud_exit_session"
                  >
                    <X size={16} />
                  </button>
                </div>

                <span className="text-[9px] text-white/20 uppercase font-black tracking-widest leading-none text-center">
                  Tap counter or side trigger button to pause
                </span>
              </div>
            </div>

            {/* Main Focus Area */}
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-6 space-y-6" id="hud_main_view">
              
              {/* Automated Rest Timer (Sleek Circular Countdowns between sets) */}
              <AnimatePresence>
                {isRestActive && restSeconds > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, height: "auto", y: 0, scale: 1 }}
                    exit={{ opacity: 0, height: 0, y: -10, scale: 0.95 }}
                    className="rounded-[28px] border border-[#CCFF00]/20 bg-[#070707] p-5 flex items-center gap-5 shadow-[0_0_35px_rgba(204,255,0,0.08)] relative overflow-hidden"
                    id="kinetic_rest_card"
                  >
                    {/* Glowing Left Indicator Accent */}
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.5)]" />

                    {/* Sleek Circular Countdown Ring */}
                    <div className="relative flex items-center justify-center h-16 w-16 shrink-0" id="rest_ring_container">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Base background circle track */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="stroke-white/5 fill-transparent"
                          strokeWidth="7"
                        />
                        {/* Dynamic front circle animated ring */}
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="stroke-[#CCFF00] fill-transparent"
                          strokeWidth="7"
                          strokeDasharray="251.2"
                          animate={{ strokeDashoffset: 251.2 * (1 - restSeconds / restMaxSeconds) }}
                          transition={{ ease: "linear", duration: 0.2 }}
                          strokeLinecap="round"
                        />
                      </svg>
                      {/* Remaining rest time digital display on top of circle */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-xs font-black tracking-wide text-white tabular-nums">
                          {Math.floor(restSeconds / 60).toString().padStart(2, '0')}:{(restSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-black uppercase text-[#CCFF00] tracking-widest leading-none">Interval Rest Timer</span>
                          <p className="text-xs font-black text-white uppercase tracking-tight mt-0.5 leading-none">Recover Energy</p>
                        </div>
                        
                        {/* Quick Controls Inside Rest Card */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Subtract 30s macro */}
                          <button
                            onClick={() => adjustRestTime(-30)}
                            className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-[10px] font-mono font-black text-white/70 hover:text-red-400 transition-all select-none active:scale-95 cursor-pointer"
                            title="Subtract 30 seconds"
                          >
                            -30s
                          </button>
                          
                          {/* Add 30s macro */}
                          <button
                            onClick={() => adjustRestTime(30)}
                            className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#CCFF00]/50 hover:bg-[#CCFF00]/10 text-[10px] font-mono font-black text-white/70 hover:text-[#CCFF00] transition-all select-none active:scale-95 cursor-pointer"
                            title="Add 30 seconds"
                          >
                            +30s
                          </button>

                          {/* Skip Rest Entirely */}
                          <button
                            onClick={() => {
                              setIsRestActive(false);
                              setRestSeconds(0);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/5 hover:bg-white/20 text-[9px] font-black uppercase tracking-wider text-white transition-all select-none active:scale-95 cursor-pointer"
                            title="Skip Rest Interval"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Exercise Focus Card Block */}
              <div className="rounded-[32px] border border-white/10 bg-[#070707] p-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative overflow-hidden" id="focus_card_block">
                {/* Radial edge glow */}
                <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-[#CCFF00]/5 blur-2xl pointer-events-none" />
                
                {/* Muscle Target Badges */}
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white/50">
                    {activeExercise.muscle}
                  </span>
                  <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white/50">
                    {activeExercise.pattern}
                  </span>
                  <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white/50">
                    {activeExercise.equipment}
                  </span>
                  {activeExercise.emg_score && (
                    <span className="rounded-lg bg-[#CCFF00]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#CCFF00]">
                      EMG {activeExercise.emg_score}%
                    </span>
                  )}
                </div>

                {/* Bold Exercise Title */}
                <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-6 leading-none">
                  {activeExercise.name}
                </h3>

                {/* Set Tracker Interactive Grid */}
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-3" id="tracker_label">Interactive Set Tracker</p>
                <div className="space-y-3" id="sets_input_grid">
                  {Array.from({ length: activeExercise.sets || 3 }).map((_, idx) => {
                    const rowState = setsState[idx] || { weight: '60', reps: '10', completed: false };
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
                          rowState.completed
                            ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30 text-[#CCFF00]'
                            : 'bg-white/5 border-white/5'
                        }`}
                        id={`set_row_${idx}`}
                      >
                        <span className={`text-[10px] font-black uppercase w-10 ${rowState.completed ? 'text-[#CCFF00]' : 'text-white/40'}`}>
                          Set {idx + 1}
                        </span>

                        {/* Weight input cell */}
                        <div className="flex-1 flex items-center bg-black/40 border border-white/5 rounded-xl px-2.5 py-1.5">
                          <input
                            type="number"
                            value={rowState.weight}
                            onChange={(e) => handleSetInputChange(idx, 'weight', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center bg-transparent text-sm font-black text-white focus:outline-none focus:text-[#CCFF00] min-w-0 font-mono"
                            placeholder="60"
                            id={`weight_input_${idx}`}
                          />
                          <span className="text-[9px] text-white/30 font-bold ml-1 font-mono">KG</span>
                        </div>

                        {/* Reps input cell */}
                        <div className="flex-1 flex items-center bg-black/40 border border-white/5 rounded-xl px-2.5 py-1.5">
                          <input
                            type="number"
                            value={rowState.reps}
                            onChange={(e) => handleSetInputChange(idx, 'reps', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center bg-transparent text-sm font-black text-white focus:outline-none focus:text-[#CCFF00] min-w-0 font-mono"
                            placeholder="10"
                            id={`reps_input_${idx}`}
                          />
                          <span className="text-[9px] text-white/30 font-bold ml-1 font-mono">REPS</span>
                        </div>

                        {/* Checkbox circle complete */}
                        <button
                          onClick={() => toggleSetCompletion(idx)}
                          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                            rowState.completed
                              ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                              : 'bg-white/5 text-white/20 hover:bg-white/10 hover:text-white'
                          }`}
                          title="Finish Set"
                          id={`complete_set_btn_${idx}`}
                        >
                          <CheckCircle2 size={16} className={rowState.completed ? "stroke-[3px]" : ""} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Media Placeholder Slot */}
                <div className="mt-6 rounded-2xl bg-white/5 border border-dashed border-white/10 p-5 flex flex-col items-center justify-center text-center" id="media_placeholder">
                  <Play className="text-white/20 mb-2 animate-pulse" size={24} />
                  <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Media & Animation Placeholder Slot</p>
                  <p className="text-[9px] text-white/20 mt-1">Video guides & form checks stream here in later production integrations</p>
                </div>
              </div>

              {/* Workout flow step navigation */}
              <div className="pt-2 flex flex-col items-center gap-3">
                <button
                  onClick={handleNextExercise}
                  className="w-full flex items-center justify-between rounded-2xl bg-white text-black p-4 font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98] shadow-lg shadow-white/5 hover:bg-[#CCFF00]"
                  id="next_exercise_btn"
                >
                  <span className="text-[9px] text-black/50 font-black">
                    Lift {currentExerciseIndex + 1} of {activeSession.day.exercises.length}
                  </span>
                  <span className="flex items-center gap-1">
                    {currentExerciseIndex < activeSession.day.exercises.length - 1
                      ? `Next Lift >`
                      : 'Complete Session'}
                  </span>
                </button>

                {currentExerciseIndex > 0 && (
                  <button
                    onClick={handlePrevExercise}
                    className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors py-1"
                    id="prev_exercise_btn"
                  >
                    &lt; Previous Lift
                  </button>
                )}
              </div>
            </div>

            {/* Premature stop verification portal */}
            {isStopConfirmOpen && (
              <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 p-6" id="terminate_portal">
                <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-[#0d0d0d] p-6 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-red-950/50 text-red-400 border border-red-900/40">
                    <Flag size={22} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black uppercase tracking-tight">Finish Session Now?</h3>
                    <p className="text-xs text-white/40 leading-relaxed font-semibold">Do you want to conclude early? All currently logged sets will be saved into your daily logs.</p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={handleConcludeEarly}
                      className="w-full rounded-2xl bg-red-600 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-red-500 transition-colors"
                      id="confirm_conclude_early"
                    >
                      Conclude & Log Workout
                    </button>
                    <button
                      onClick={() => {
                        setIsStopConfirmOpen(false);
                        setIsTimerRunning(true); // Auto-resume stopwatch when they resume workout
                      }}
                      className="w-full rounded-2xl bg-white/5 py-3.5 text-xs font-black uppercase tracking-widest text-white/60 hover:bg-white/10"
                    >
                      Resume Training
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Glorious Post-Workout Session Cleared screen */}
            {isRecapOpen && (
              <div className="fixed inset-0 z-[300] flex flex-col bg-black overflow-y-auto px-6 py-12" id="recap_hub">
                <div className="max-w-md mx-auto w-full flex flex-col items-center justify-center space-y-8 py-10">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[#CCFF00] animate-bounce shadow-[0_0_20px_rgba(204,255,0,0.15)]">
                      <Trophy size={32} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black tracking-[0.25em] text-[#CCFF00] uppercase">Workout Logged</span>
                      <h2 className="text-3xl font-black tracking-tighter uppercase text-white mt-1 leading-none">Session Cleared!</h2>
                    </div>
                    <p className="text-xs text-white/40 tracking-wide">Excellent execution athlete. High intensity stimulus reached.</p>
                  </div>

                  {/* Summary Bento Grid */}
                  <div className="grid grid-cols-2 gap-4 w-full" id="stats_bento">
                    <div className="rounded-3xl border border-white/5 bg-[#070707] p-5">
                      <p className="text-[9px] font-black uppercase text-white/30 tracking-widest leading-none">Duration</p>
                      <p className="text-xl font-black text-white mt-2 font-mono">
                        {Math.floor(finalMetrics.duration / 60)}m {finalMetrics.duration % 60}s
                      </p>
                    </div>
                    
                    <div className="rounded-3xl border border-white/5 bg-[#070707] p-5">
                      <p className="text-[9px] font-black uppercase text-white/30 tracking-widest leading-none">Sets Lifted</p>
                      <p className="text-xl font-black text-white mt-2 font-mono">
                        {finalMetrics.totalSets} <span className="text-xs text-white/40">Sets</span>
                      </p>
                    </div>

                    <div className="rounded-3xl border border-white/5 bg-[#070707] p-5">
                      <p className="text-[9px] font-black uppercase text-[#CCFF00] tracking-widest leading-none">Volume</p>
                      <p className="text-xl font-black text-[#CCFF00] mt-2 font-mono">
                        {finalMetrics.totalVolume.toLocaleString()} <span className="text-xs">KG</span>
                      </p>
                    </div>

                    <div className="rounded-3xl border border-white/5 bg-[#070707] p-5">
                      <p className="text-[9px] font-black uppercase text-white/30 tracking-widest leading-none">Energy Burn</p>
                      <p className="text-xl font-black text-white mt-2 font-mono">
                        ~{finalMetrics.calories} <span className="text-xs text-white/40">KCAL</span>
                      </p>
                    </div>
                  </div>

                  {/* Gamer level reward badge notification */}
                  <div className="w-full rounded-2xl border border-white/5 bg-[#070707] p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20">
                      <Award size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-white tracking-widest">KINETIC EXPERIENCE AWARDED</p>
                      <p className="text-[10px] text-white/40 mt-1">earned +{finalMetrics.totalSets * 10} XP. Check your level badge on Profile tab.</p>
                    </div>
                  </div>

                  {/* Lifts logs recap cards */}
                  <div className="w-full space-y-3" id="lift_summaries">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Lifts Performance Overview</p>
                    {finalMetrics.recapLogs.map((item, index) => (
                      <div key={item.exerciseId || index} className="rounded-2xl border border-white/5 bg-white/5 p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-black uppercase tracking-tight text-white leading-none">
                            {item.name}
                          </label>
                          <span className="text-[10px] font-mono text-white/40 uppercase">
                            {item.sets.length} complete
                          </span>
                        </div>
                        {item.sets.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {item.sets.map((set: any, sIdx: number) => (
                              <span key={sIdx} className="text-[9px] bg-white/5 border border-white/5 rounded-lg leading-none py-1.5 px-2 font-mono text-white/70">
                                {set.weight}kg × {set.reps}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[9px] italic text-white/20">No complete checked sets in this session</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Return Button */}
                  <button
                    onClick={handleSaveAndBackHome}
                    className="w-full rounded-[20px] bg-[#CCFF00] p-4 text-xs font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(204,255,0,0.2)] hover:brightness-110 active:scale-[0.98] transition-all"
                    id="save_log_action"
                  >
                    Save Accomplishments & Deploy
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. STANDARD HOME TAB (When live session is not running) */}
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tighter uppercase text-white">Daily Overview</h2>
        <p className="text-white/40 font-medium">Saturday, April 29</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ThemeCard title="Calories" subtitle="1,840">
          <div className="mt-2 flex items-center gap-2 text-xs text-white/60 font-medium">
            <Flame size={15} className="text-[#CCFF00]" />
            <span>82% of target limit</span>
          </div>
        </ThemeCard>
        <ThemeCard title="Steps" subtitle="8,432">
          <div className="mt-2 flex items-center gap-2 text-xs text-white/60 font-medium">
            <TrendingUp size={15} className="text-[#CCFF00]" />
            <span>+12% than average volume</span>
          </div>
        </ThemeCard>
      </div>

      {/* 1. HOME SCREEN SPLIT SWITCHER BANNER & GATES (Frosted AMOLED Card) */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#070707] p-6 shadow-2xl" id="kinetic_split_banner">
        {/* Glowing edge ring ambient */}
        <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-[#CCFF00]/5 blur-[40px] pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <span className="text-[10px] font-black tracking-widest text-[#CCFF00] uppercase">Active Training Split</span>
            <h3 className="text-xl font-black tracking-tight text-white mt-0.5 leading-none">{activeSplit.name}</h3>
            <p className="text-white/40 text-xs mt-1.5 font-semibold">
              {activeSplit.workoutDays.length} variations active in planner
            </p>
          </div>
          
          {/* Active Split Switcher Dropdown */}
          <div className="relative">
            <select
              value={activeSplitId}
              onChange={(e) => {
                setActiveSplitId(e.target.value);
                setSelectedDayId(null); // Reset active chosen variations day when split is switched
              }}
              className="appearance-none bg-white/5 border border-white/5 hover:border-[#CCFF00]/50 rounded-xl px-4 py-2 pr-8 text-xs font-bold text-white transition-all focus:outline-none cursor-pointer"
              id="active_split_selector"
            >
              {uniqueSplits.map(s => (
                <option key={s.id} value={s.id} className="bg-[#121212] text-white">
                  {s.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>

        {/* Day variations selectors chips */}
        <div className="mt-5">
          <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-3">Daily Variations</p>
          <div className="grid grid-cols-3 gap-2">
            {activeSplit.workoutDays.map((day) => {
              const isSelected = selectedDayId === day.id;
              return (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayId(day.id === selectedDayId ? null : day.id)}
                  className={`relative overflow-hidden rounded-2xl py-4 px-3 border flex flex-col items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)]'
                      : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                  id={`day_selector_chip_${day.id}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {day.name.replace(" Day", "")}
                  </span>
                  <span className="text-[9px] opacity-40 font-mono font-bold">
                    {day.exercises.length} lifts
                  </span>
                  {isSelected && (
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#CCFF00]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Training Session Glowing Launcher Button below chips */}
        <AnimatePresence>
          {selectedDayId && (
            <motion.button
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: '1.25rem' }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              onClick={() => handleStartSession(activeSplit, activeSplit.workoutDays.find(d => d.id === selectedDayId)!)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#CCFF00] py-4 text-xs font-black uppercase tracking-widest text-black shadow-[0_4px_25px_rgba(204,255,0,0.25)] hover:brightness-110 active:scale-[0.98] transition-all overflow-hidden"
              id="start_session_launcher"
            >
              <Play size={14} fill="currentColor" />
              Start {activeSplit.workoutDays.find(d => d.id === selectedDayId)?.name} Session
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic persistent Workout Completed Recent Activity section */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Recent Activity</h3>
        <div className="space-y-3" id="recent_activities_log">
          {userLogs.slice(0, 3).map((log) => {
            const dateStr = new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return (
              <div key={log.id} className="flex items-center gap-4 rounded-[24px] border border-white/5 bg-white/5 p-4 justify-between" id={`activity_log_${log.id}`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/40 border border-white/5">
                    <Award size={20} className="text-[#CCFF00]/80" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white leading-none">{log.dayName} Completed</h4>
                    <p className="text-[10px] text-white/30 mt-1 font-semibold">{log.presetName} • {dateStr}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="block text-xs font-black text-white font-mono">{log.totalSets} Sets</span>
                  <span className="block text-[9px] text-[#CCFF00] font-mono mt-0.5">{log.totalWeight.toLocaleString()} KG Volume</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const FRONT_MUSCLES = [
  { id: 'neck', name: 'Neck & Sternocleidomastoid', target: 'traps', d: 'M 92,38 C 94,44 106,44 108,38 L 105,52 H 95 Z' },
  { id: 'chest_left', name: 'Pectoralis Major (Left Chest)', target: 'chest', d: 'M 100,54 L 78,59 C 76,64 77,75 80,84 L 100,84 Z' },
  { id: 'chest_right', name: 'Pectoralis Major (Right Chest)', target: 'chest', d: 'M 100,54 L 122,59 C 124,64 123,75 120,84 L 100,84 Z' },
  { id: 'shoulder_left', name: 'Anterior Deltoid (Left Shoulder)', target: 'shoulders', d: 'M 78,59 C 71,62 66,69 63,78 C 63,81 67,82 70,80 C 74,74 76,68 78,59 Z' },
  { id: 'shoulder_right', name: 'Anterior Deltoid (Right Shoulder)', target: 'shoulders', d: 'M 122,59 C 129,62 134,69 137,78 C 137,81 133,82 130,80 C 126,74 124,68 122,59 Z' },
  { id: 'biceps_left', name: 'Biceps Brachii (Left Arm)', target: 'biceps', d: 'M 63,78 C 59,85 55,95 56,105 C 59,105 62,100 64,93 C 65,87 66,81 65,79 Z' },
  { id: 'biceps_right', name: 'Biceps Brachii (Right Arm)', target: 'biceps', d: 'M 137,78 C 141,85 145,95 144,105 C 141,105 138,100 136,93 C 135,87 134,81 135,79 Z' },
  { id: 'triceps_front_left', name: 'Lateral Head Triceps (Left)', target: 'triceps', d: 'M 59,79 C 55,85 52,95 53,103 L 56,103 C 55,95 58,85 59,79 Z' },
  { id: 'triceps_front_right', name: 'Lateral Head Triceps (Right)', target: 'triceps', d: 'M 141,79 C 145,85 148,95 147,103 L 144,103 C 145,95 142,85 141,79 Z' },
  { id: 'forearms_left', name: 'Brachioradialis (Left Forearm)', target: 'forearms', d: 'M 56,105 C 51,114 46,130 48,142 C 51,142 53,133 56,124 Z' },
  { id: 'forearms_right', name: 'Brachioradialis (Right Forearm)', target: 'forearms', d: 'M 144,105 C 149,114 154,130 152,142 C 149,142 147,133 144,124 Z' },
  { id: 'abs_upper_left', name: 'Upper Rectus Abdominis (Left)', target: 'abs', d: 'M 100,86 H 88 V 98 H 100 Z' },
  { id: 'abs_upper_right', name: 'Upper Rectus Abdominis (Right)', target: 'abs', d: 'M 100,86 H 112 V 98 H 100 Z' },
  { id: 'abs_mid_left', name: 'Middle Rectus Abdominis (Left)', target: 'abs', d: 'M 100,100 H 89 V 114 H 100 Z' },
  { id: 'abs_mid_right', name: 'Middle Rectus Abdominis (Right)', target: 'abs', d: 'M 100,100 H 111 V 114 H 100 Z' },
  { id: 'abs_lower_left', name: 'Lower Rectus Abdominis (Left)', target: 'abs', d: 'M 100,116 H 90 V 132 H 100 Z' },
  { id: 'abs_lower_right', name: 'Lower Rectus Abdominis (Right)', target: 'abs', d: 'M 100,116 H 110 V 132 H 100 Z' },
  { id: 'obliques_left', name: 'External Obliques (Left)', target: 'obliques', d: 'M 85,86 L 87,132 L 80,128 C 78,110 80,94 85,86 Z' },
  { id: 'obliques_right', name: 'External Obliques (Right)', target: 'obliques', d: 'M 115,86 L 113,132 L 120,128 C 122,110 120,94 115,86 Z' },
  { id: 'quads_left', name: 'Quadriceps / Thigh (Left)', target: 'quads', d: 'M 80,136 C 80,150 77,175 79,204 C 84,208 90,210 97,204 L 97,136 Z' },
  { id: 'quads_right', name: 'Quadriceps / Thigh (Right)', target: 'quads', d: 'M 120,136 C 120,150 123,175 121,204 C 116,204 110,210 103,204 L 103,136 Z' },
  { id: 'calves_front_left', name: 'Tibialis Anterior (Left Shin)', target: 'calves', d: 'M 79,210 C 77,228 81,260 85,285 C 87,285 89,252 90,224 Z' },
  { id: 'calves_front_right', name: 'Tibialis Anterior (Right Shin)', target: 'calves', d: 'M 121,210 C 123,228 119,260 115,285 C 113,285 111,252 110,224 Z' }
];

const BACK_MUSCLES = [
  { id: 'traps_upper_back', name: 'Upper Trapezius (Neck)', target: 'traps', d: 'M 94,36 L 106,36 L 114,50 L 86,50 Z' },
  { id: 'traps_mid_back', name: 'Lower/Middle Trapezius', target: 'traps', d: 'M 86,50 L 114,50 L 100,84 Z' },
  { id: 'shoulders_back_left', name: 'Posterior Deltoid (Left Rear Shoulder)', target: 'shoulders', d: 'M 86,50 C 78,52 73,59 67,69 C 67,73 71,76 75,74 Z' },
  { id: 'shoulders_back_right', name: 'Posterior Deltoid (Right Rear Shoulder)', target: 'shoulders', d: 'M 114,50 C 122,52 127,59 133,69 C 133,73 129,76 125,74 Z' },
  { id: 'triceps_left', name: 'Triceps Brachii (Left Arm)', target: 'triceps', d: 'M 67,69 C 63,77 59,90 60,102 C 63,102 66,97 69,89 C 71,83 73,75 75,74 Z' },
  { id: 'triceps_right', name: 'Triceps Brachii (Right Arm)', target: 'triceps', d: 'M 133,69 C 137,77 141,90 140,102 C 137,102 134,97 131,89 C 129,83 127,75 125,74 Z' },
  { id: 'forearms_back_left', name: 'Forearm Extensors (Left Forearm)', target: 'forearms', d: 'M 60,102 C 55,111 50,127 52,139 C 55,139 57,130 60,121 Z' },
  { id: 'forearms_back_right', name: 'Forearm Extensors (Right Forearm)', target: 'forearms', d: 'M 140,102 C 145,111 150,127 148,139 C 145,139 143,130 140,121 Z' },
  { id: 'lats_left', name: 'Latissimus Dorsi (Left Back)', target: 'lats', d: 'M 100,84 L 75,74 C 74,84 78,102 84,116 L 100,112 Z' },
  { id: 'lats_right', name: 'Latissimus Dorsi (Right Back)', target: 'lats', d: 'M 100,84 L 125,74 C 126,84 122,102 116,116 L 100,112 Z' },
  { id: 'lower_back', name: 'Erector Spinae / Lower Back', target: 'lower back', d: 'M 84,116 L 116,116 L 112,134 L 88,134 Z' },
  { id: 'glutes_left', name: 'Gluteus Maximus (Left Glute)', target: 'glutes', d: 'M 100,134 H 80 C 78,146 80,165 88,174 C 94,174 98,159 100,134 Z' },
  { id: 'glutes_right', name: 'Gluteus Maximus (Right Glute)', target: 'glutes', d: 'M 100,134 H 120 C 122,146 120,165 112,174 C 106,174 102,159 100,134 Z' },
  { id: 'hamstrings_left', name: 'Biceps Femoris (Left Hamstring)', target: 'hamstrings', d: 'M 80,174 C 78,194 80,212 84,228 H 98 C 96,208 96,188 88,174 Z' },
  { id: 'hamstrings_right', name: 'Biceps Femoris (Right Hamstring)', target: 'hamstrings', d: 'M 120,174 C 122,194 120,212 116,228 H 102 C 104,208 104,188 112,174 Z' },
  { id: 'calves_left', name: 'Gastrocnemius (Left Calf)', target: 'calves', d: 'M 84,230 C 80,248 82,272 86,285 C 89,285 92,272 94,244 Z' },
  { id: 'calves_right', name: 'Gastrocnemius (Right Calf)', target: 'calves', d: 'M 116,230 C 120,248 118,272 114,285 C 111,285 108,272 106,244 Z' }
];

function Anatomy() {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>('chest');
  const [activeEquipment, setActiveEquipment] = useState<string>('All Equipment');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'both' | 'front' | 'back'>('both');

  // Filter exercises by muscle and equipment category
  const filteredExercises = EXERCISES.filter(ex => {
    // Exact muscle group matching
    const matchesMuscle = !selectedMuscle || (() => {
      let targetCategory = 'Chest';
      if (selectedMuscle === 'chest') targetCategory = 'Chest';
      else if (selectedMuscle === 'shoulders' || selectedMuscle === 'traps') targetCategory = 'Shoulders';
      else if (selectedMuscle === 'biceps' || selectedMuscle === 'triceps' || selectedMuscle === 'forearms') targetCategory = 'Arms';
      else if (selectedMuscle === 'lats' || selectedMuscle === 'lower back') targetCategory = 'Back';
      else if (selectedMuscle === 'abs' || selectedMuscle === 'obliques') targetCategory = 'Core';
      else if (selectedMuscle === 'quads' || selectedMuscle === 'glutes' || selectedMuscle === 'hamstrings' || selectedMuscle === 'calves') targetCategory = 'Legs';
      return ex.muscle.toLowerCase() === targetCategory.toLowerCase();
    })();
    
    if (activeEquipment === 'All Equipment' || activeEquipment === 'All') return matchesMuscle;

    if (activeEquipment === 'Cables') {
      return matchesMuscle && ex.equipment.toLowerCase() === 'cable';
    }
    return matchesMuscle && ex.equipment.toLowerCase() === activeEquipment.toLowerCase();
  });

  const muscleStabilizers: Record<string, { main: string; helper: string; score: number }> = {
    chest: { main: 'Pectoralis Major / Clavicular Head', helper: 'Triceps Brachii, Anterior Deltoids', score: 95 },
    shoulders: { main: 'Anterior / Lateral / Posterior Deltoids', helper: 'Triceps, Upper Trapezius, Rotator Cuff', score: 95 },
    traps: { main: 'Trapezius (Pars Descendens)', helper: 'Levator Scapulae, Rhomboids', score: 92 },
    biceps: { main: 'Biceps Brachii (Short & Long Heads)', helper: 'Brachialis, Brachioradialis', score: 94 },
    triceps: { main: 'Triceps Brachii (Lateral, Long & Medial Heads)', helper: 'Anconeus, Posterior Deltoid', score: 96 },
    forearms: { main: 'Brachioradialis / Flexor Carpi Ulnaris', helper: 'Pronator Teres, Extensor Digitorum', score: 88 },
    lats: { main: 'Latissimus Dorsi / Teres Major', helper: 'Biceps Brachii, Brachioradialis, Rhomboids', score: 98 },
    'lower back': { main: 'Erector Spinae / Quadratus Lumborum', helper: 'Gluteus Maximus, Core Obliques', score: 90 },
    abs: { main: 'Rectus Abdominis / Linea Alba', helper: 'Transverse Abdominis, Internal Obliques', score: 96 },
    obliques: { main: 'External Obliques / Serratus Anterior', helper: 'Rectus Abdominis, Intercostals', score: 92 },
    quads: { main: 'Quadriceps Femoris (Rectus Femoris, Vastus Lateralis)', helper: 'Gastrocnemius, Glutes', score: 97 },
    glutes: { main: 'Gluteus Maximus & Medius', helper: 'Hamstrings, Erector Spinae', score: 95 },
    hamstrings: { main: 'Biceps Femoris / Semitendinosus', helper: 'Gluteus Maximus, Gastrocnemius', score: 93 },
    calves: { main: 'Gastrocnemius / Soleus', helper: 'Tibialis Anterior, Plantaris', score: 91 }
  };

  const activeStats = (selectedMuscle && muscleStabilizers[selectedMuscle]) 
    ? muscleStabilizers[selectedMuscle] 
    : { main: 'Whole-Body Neuromuscular Chains', helper: 'Synergistic Kinetic Linkages', score: 94 };

  const handleMuscleClick = (target: string) => {
    if (selectedMuscle === target) {
      setSelectedMuscle(null);
    } else {
      setSelectedMuscle(target);
    }
  };

  const renderSilhouetteBackground = () => (
    <g className="fill-[#131313] stroke-white/5" strokeWidth="0.75">
      {/* Head */}
      <circle cx="100" cy="24" r="13" />
      {/* Neck */}
      <polygon points="95,36 105,36 104,52 96,52" />
      {/* Body Core */}
      <polygon points="76,52 124,52 118,138 82,138" />
      {/* Arms Left */}
      <polygon points="76,52 53,103 48,142 53,142 59,103 76,70" />
      {/* Arms Right */}
      <polygon points="124,52 147,103 152,142 147,142 141,103 124,70" />
      {/* Legs Left */}
      <polygon points="78,138 79,204 85,285 91,285 97,204 100,138" />
      {/* Legs Right */}
      <polygon points="122,138 121,204 115,285 109,285 103,204 100,138" />
    </g>
  );

  return (
    <div className="min-h-screen bg-[#000] text-white py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="anatomy_section">
      
      {/* Dynamic Screen Edge Glow Aura */}
      <div className="absolute top-0 left-1/4 right-1/4 h-96 bg-[#CCFF00]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header and Aesthetic Summary */}
      <div className="text-center mb-10 max-w-2xl mx-auto relative z-10">
        <h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl text-white">
          Kinetic <span className="text-[#CCFF00]">Anatomy</span> Engine
        </h1>
        <p className="mt-3 text-sm text-white/40 leading-relaxed font-medium">
          Interactive MuscleWiki-style neuromuscular mapping matrix. Click muscle segments on the blueprint below to illuminate targets and live filter biomechanical regimens.
        </p>

        {/* Dynamic Real-time HUD stats bar */}
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-2.5 rounded-full border border-white/5 bg-white/[0.03] backdrop-blur-md text-[10px] font-mono tracking-widest uppercase text-white/60">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
            <span>Target: <strong className="text-[#CCFF00] font-black">{selectedMuscle ? selectedMuscle.toUpperCase() : 'ALL GROUP'}</strong></span>
          </div>
          <span className="hidden sm:inline text-white/10">|</span>
          <div>
            <span>EMG Peak: <strong className="text-[#CCFF00] font-black">{activeStats.score}%</strong></span>
          </div>
          <span className="hidden sm:inline text-white/10">|</span>
          <div className="text-white/40">
            Selected: <span className="text-white font-bold">{filteredExercises.length} Movements</span>
          </div>
        </div>
      </div>

      {/* Interactive anatomical body map section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-14 relative z-10">
        
        {/* Left 6-Columns: Dynamic Side-by-Side Map Card */}
        <div className="lg:col-span-6 bg-[#070707] border border-white/5 rounded-[32px] p-6 shadow-2xl relative overflow-hidden" id="anatomy_map_card">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#CCFF0003,transparent)] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-white/5 border border-white/10">
                <Target size={14} className="text-[#CCFF00]" />
              </span>
              <h3 className="text-xs font-black uppercase tracking-widest text-white/80">Vector Anatomy Map</h3>
            </div>

            {/* Layout Toggle Controls for Mobile & Desktop Layout comfort */}
            <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-0.5 text-xs font-mono">
              <button 
                onClick={() => setCurrentView('both')}
                className={`px-3 py-1 rounded-lg transition-all ${currentView === 'both' ? 'bg-[#CCFF00] text-black font-black' : 'text-white/60 hover:text-white'}`}
              >
                Dual
              </button>
              <button 
                onClick={() => setCurrentView('front')}
                className={`px-3 py-1 rounded-lg transition-all ${currentView === 'front' ? 'bg-[#CCFF00] text-black font-black' : 'text-white/60 hover:text-white'}`}
              >
                Front
              </button>
              <button 
                onClick={() => setCurrentView('back')}
                className={`px-3 py-1 rounded-lg transition-all ${currentView === 'back' ? 'bg-[#CCFF00] text-black font-black' : 'text-white/60 hover:text-white'}`}
              >
                Back
              </button>
            </div>
          </div>

          {/* Double Human Models Wrap */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 py-4 bg-black rounded-2xl border border-white/5 p-4">
            
            {/* FRONT MODEL VIEW */}
            {(currentView === 'both' || currentView === 'front') && (
              <div className="flex flex-col items-center gap-3 w-48 relative">
                <span className="text-[9px] font-black tracking-widest text-[#CCFF00] uppercase bg-[#CCFF00]/10 border border-[#CCFF00]/10 px-2.5 py-0.5 rounded-full leading-none">Anterior (Front)</span>
                
                <svg viewBox="0 0 200 320" className="w-full h-auto drop-shadow-2xl">
                  {/* Neon Glow SVG Filters */}
                  <defs>
                    <filter id="vector-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Body Silhouette Base */}
                  {renderSilhouetteBackground()}

                  {/* Front Interactive Muscle Paths */}
                  {FRONT_MUSCLES.map((muscle) => {
                    const isActive = selectedMuscle === muscle.target;
                    const isHovered = hoveredId === muscle.id;
                    return (
                      <path
                        key={muscle.id}
                        d={muscle.d}
                        onClick={() => handleMuscleClick(muscle.target)}
                        onMouseEnter={() => {
                          setHoveredId(muscle.id);
                          setHoveredName(`${muscle.name} ➔ ${muscle.target.toUpperCase()}`);
                        }}
                        onMouseLeave={() => {
                          setHoveredId(null);
                          setHoveredName(null);
                        }}
                        className="transition-all duration-300 cursor-pointer hover:scale-[1.02] origin-center"
                        style={{
                          fill: isActive 
                            ? '#CCFF00' 
                            : isHovered 
                              ? 'rgba(204, 255, 0, 0.45)' 
                              : '#1A1A1A',
                          fillOpacity: isActive ? 0.35 : isHovered ? 0.45 : 0.9,
                          stroke: isActive || isHovered ? '#CCFF00' : 'rgba(255,255,255,0.2)',
                          strokeWidth: isActive ? 1.5 : isHovered ? 1.25 : 0.75,
                          filter: isActive || isHovered ? 'drop-shadow(0px 0px 8px rgba(204,255,0,0.85))' : 'none'
                        }}
                      />
                    );
                  })}
                </svg>
              </div>
            )}

            {/* BACK MODEL VIEW */}
            {(currentView === 'both' || currentView === 'back') && (
              <div className="flex flex-col items-center gap-3 w-48 relative">
                <span className="text-[9px] font-black tracking-widest text-[#CCFF00] uppercase bg-[#CCFF00]/10 border border-[#CCFF00]/10 px-2.5 py-0.5 rounded-full leading-none">Posterior (Back)</span>
                
                <svg viewBox="0 0 200 320" className="w-full h-auto drop-shadow-2xl">
                  {/* Body Silhouette Base */}
                  {renderSilhouetteBackground()}

                  {/* Back Interactive Muscle Paths */}
                  {BACK_MUSCLES.map((muscle) => {
                    const isActive = selectedMuscle === muscle.target;
                    const isHovered = hoveredId === muscle.id;
                    return (
                      <path
                        key={muscle.id}
                        d={muscle.d}
                        onClick={() => handleMuscleClick(muscle.target)}
                        onMouseEnter={() => {
                          setHoveredId(muscle.id);
                          setHoveredName(`${muscle.name} ➔ ${muscle.target.toUpperCase()}`);
                        }}
                        onMouseLeave={() => {
                          setHoveredId(null);
                          setHoveredName(null);
                        }}
                        className="transition-all duration-300 cursor-pointer hover:scale-[1.02] origin-center"
                        style={{
                          fill: isActive 
                            ? '#CCFF00' 
                            : isHovered 
                              ? 'rgba(204, 255, 0, 0.45)' 
                              : '#1A1A1A',
                          fillOpacity: isActive ? 0.35 : isHovered ? 0.45 : 0.9,
                          stroke: isActive || isHovered ? '#CCFF00' : 'rgba(255,255,255,0.2)',
                          strokeWidth: isActive ? 1.5 : isHovered ? 1.25 : 0.75,
                          filter: isActive || isHovered ? 'drop-shadow(0px 0px 8px rgba(204,255,0,0.85))' : 'none'
                        }}
                      />
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Diagnostic Vector Label Telemetry overlay */}
          <div className="h-10 mt-4 border-t border-white/5 flex items-center justify-center font-mono text-[10px] tracking-widest uppercase text-white/50 bg-black/40 rounded-xl">
            {hoveredName ? (
              <span className="text-[#CCFF00] font-black animate-pulse flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-[#CCFF00] rounded-full" />
                {hoveredName}
              </span>
            ) : (
              <span className="text-white/20 select-none">Hover skeletal grids for telemetry ...</span>
            )}
          </div>
        </div>

        {/* Right 6-Columns: Focused isolations card containing biomechanics details */}
        <div className="lg:col-span-6 flex flex-col h-full justify-between space-y-6">
          <div className="bg-[#070707] border border-white/5 rounded-[32px] p-6 shadow-2xl relative flex-1 flex flex-col justify-between min-h-[360px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-[#CCFF00] uppercase tracking-[0.2em] font-black">Neuromuscular Diagnostics</span>
                <span className="px-2 py-0.5 text-[9px] font-mono font-black border border-white/10 rounded-full text-white/40">FLEXION_ANALYTICS</span>
              </div>

              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                {selectedMuscle ? selectedMuscle + ' Isolation Data' : 'Generic Vector Loadout'}
              </h2>

              {/* Dynamic Information Grid */}
              <div className="space-y-4 mt-6">
                <div>
                  <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest block mb-1">Primary Biomechanical Line</span>
                  <div className="bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl">
                    <p className="text-white text-xs font-black uppercase tracking-wide leading-tight">{activeStats.main}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest block mb-1">Synergistic Stabilizers</span>
                  <div className="bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl">
                    <p className="text-white/60 text-xs font-black uppercase tracking-wide leading-tight">{activeStats.helper}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest block mb-1">Recruitment Rating</span>
                    <div className="bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl">
                      <p className="text-[#CCFF00] text-lg font-mono font-black">{activeStats.score}% <span className="text-[10px] text-white/30 font-sans ml-1">STABLE</span></p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest block mb-1">Fibrillative Target</span>
                    <div className="bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl">
                      <p className="text-white text-lg font-mono font-black">{selectedMuscle ? 'Compound' : 'Symmetric'} <span className="text-[10px] text-white/30 font-sans ml-1">ISOL</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center gap-4 text-xs font-mono text-white/40">
              <span className="sm:border-r border-white/5 pr-4 leading-none">INSTRUCTION</span>
              <p className="text-[11px] leading-relaxed text-white/30 text-center sm:text-left font-sans font-semibold">
                {selectedMuscle 
                  ? `Currently isolating the ${selectedMuscle.toUpperCase()}. Tap a selected segment again to deselect, or choose another group to shift target parameters.`
                  : 'Tap any muscle group node on the vector blueprint to lock biomechanical isolations and active live exercise pathways.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment filter chips */}
      <div className="relative z-10 mb-8 border-b border-white/5 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-white/5 border border-white/10">
              <LayoutGrid size={13} className="text-[#CCFF00]" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-white/80 font-sans">Filter Setup Framework</span>
          </div>

          <span className="text-[10px] font-mono text-white/30 uppercase text-right leading-none">
            Viewing {selectedMuscle ? selectedMuscle.toUpperCase() : 'ALL MUSCLES'} for {activeEquipment.toUpperCase()}
          </span>
        </div>

        {/* Horizontal scrollable row of glassmorphic filters */}
        <div className="flex flex-wrap items-center gap-2" id="anatomy_filter_row">
          {['All Equipment', 'Barbell', 'Dumbbell', 'Cables', 'Bodyweight'].map((equipment) => {
            const isChipActive = activeEquipment === equipment;
            return (
              <button
                key={equipment}
                onClick={() => setActiveEquipment(equipment)}
                className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                  isChipActive 
                    ? 'bg-[#CCFF00] text-black shadow-[0_4px_25px_rgba(204,255,0,0.25)] font-black border border-[#CCFF00]' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5 backdrop-blur-md'
                }`}
              >
                {equipment === 'All Equipment' ? '💡 All Equipment' : equipment}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise Grid with framer-motion smooth transitions */}
      <div className="relative z-10" id="anatomy_exercise_grid">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedMuscle}-${activeEquipment}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredExercises.length > 0 ? (
              filteredExercises.map((exercise) => (
                <div 
                  key={exercise.id} 
                  className="group bg-[#070707] border border-white/5 hover:border-white/10 hover:shadow-[0_10px_35px_rgba(0,0,0,0.9)] rounded-[24px] p-4 flex flex-col justify-between transition-all relative overflow-hidden"
                >
                  {/* Subtle inner grid lines decorative elements */}
                  <div className="absolute top-0 right-0 h-10 w-10 bg-gradient-to-bl from-[#CCFF00]/5 to-transparent blur-md pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  
                  <div>
                    {/* Empty, high-contrast Video loop placeholder */}
                    <div className="relative aspect-video rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden flex flex-col items-center justify-center group-hover:border-[#CCFF00]/25 transition-all mb-4">
                      {/* Grid overlay lines */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                      
                      {/* Tech Recording Indicator Corner */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 leading-none">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-mono text-[8px] uppercase tracking-widest text-white/30">REF_CLIP</span>
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 leading-none">
                        <span className="font-mono text-[8px] tracking-wide text-white/20">60FPS • AUTOLOOP</span>
                      </div>

                      {/* Video Player Play Icon */}
                      <div className="border border-white/5 bg-white/5 backdrop-blur-md rounded-2xl p-3 flex items-center justify-center text-white/30 group-hover:text-[#CCFF00] group-hover:scale-110 transition-all shadow-lg z-10">
                        <Play size={14} fill="currentColor" className="ml-0.5" />
                      </div>
                      <span className="text-[9px] uppercase font-black tracking-widest text-white/20 mt-3 font-mono z-10">Local Repository Loop</span>
                    </div>

                    {/* Exercise Name */}
                    <h4 className="text-sm font-black text-white group-hover:text-[#CCFF00] transition-colors line-clamp-1">
                      {exercise.name}
                    </h4>

                    {/* Badges Container */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {/* Primary target Badge */}
                      <span className="inline-flex items-center px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-[#CCFF00] bg-[#CCFF00]/5 border border-[#CCFF00]/10">
                        Primary: {exercise.muscle}
                      </span>

                      {/* Equipment target badge */}
                      <span className="inline-flex items-center px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-white/40 bg-white/5 border border-white/5">
                        {exercise.equipment}
                      </span>

                      {/* Pattern rating badge */}
                      <span className="inline-flex items-center px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-white/40 bg-white/5 border border-white/5">
                        {exercise.pattern}
                      </span>
                    </div>
                  </div>

                  {/* Mechanical Target Rating Section */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-white/30 uppercase tracking-widest font-bold">EMG Index Score</span>
                    <span className="text-[#CCFF00] font-black">{exercise.emg_score}% EFFECTIVE</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-16 text-center border border-dashed border-white/10 rounded-[28px] bg-white/[0.01]">
                <BookOpen size={24} className="mx-auto text-white/20 mb-3" />
                <p className="text-xs font-black uppercase tracking-wider text-white/60">No matched movements</p>
                <p className="text-[11px] text-white/30 mt-1">Try toggling to "💡 All Equipment" or click alternative skeletal regions.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

function Workout() {
  const { user, profile, loading: authLoading, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'library' | 'creator' | 'planner' | 'presets'>('library');
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([
    { id: '1', name: 'Push Day', exercises: [] },
    { id: '2', name: 'Pull Day', exercises: [] },
    { id: '3', name: 'Leg Day', exercises: [] },
  ]);
  const [currentDayId, setCurrentDayId] = useState('1');
  const [schedule, setSchedule] = useState<WeeklySchedule>({
    Monday: '1',
    Tuesday: '2',
    Wednesday: null,
    Thursday: '3',
    Friday: '1',
    Saturday: null,
    Sunday: null,
  });
  const [presets, setPresets] = useState<WorkoutPreset[]>([]);
  const [publicSplits, setPublicSplits] = useState<any[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);
  const [presetToRename, setPresetToRename] = useState<WorkoutPreset | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Load presets from profile if logged in, otherwise localStorage
  useEffect(() => {
    if (profile) {
      setPresets(profile.customSplits || []);
    } else {
      const savedPresets = localStorage.getItem('kinetic_presets');
      if (savedPresets) {
        try {
          setPresets(JSON.parse(savedPresets));
        } catch (e) {
          console.error("Failed to parse presets", e);
        }
      }
    }
  }, [profile]);

  // Fetch Community Blueprints
  useEffect(() => {
    const q = query(collection(db, 'publicSplits'), where('isPublic', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const splits = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setPublicSplits(splits);
    });
    return () => unsubscribe();
  }, []);

  const currentDay = workoutDays.find(d => d.id === currentDayId)!;

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return;

    const newPreset: any = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      workoutDays: JSON.parse(JSON.stringify(workoutDays)),
      schedule: { ...schedule },
      createdAt: Date.now(),
      isPublic: isPublic,
    };

    if (profile) {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        customSplits: arrayUnion(newPreset)
      });

      if (isPublic) {
        const publicRef = doc(db, 'publicSplits', newPreset.id);
        await setDoc(publicRef, {
          ...newPreset,
          authorUid: profile.uid,
          authorName: profile.displayName,
          authorPhoto: profile.photoURL,
          downloads: 0,
        });
      }
    } else {
      const updatedPresets = [newPreset, ...presets];
      setPresets(updatedPresets);
      localStorage.setItem('kinetic_presets', JSON.stringify(updatedPresets));
    }

    setNewPresetName('');
    setIsSaveModalOpen(false);
    setIsPublic(false);
    setActiveTab('presets');
  };

  const handleImportPublic = async (split: any) => {
    if (!profile) {
      alert("Please login to import community blueprints.");
      return;
    }

    const userRef = doc(db, 'users', profile.uid);
    await updateDoc(userRef, {
      customSplits: arrayUnion({
        ...split,
        id: `imported-${Date.now()}`,
        isPublic: false,
        createdAt: Date.now()
      })
    });

    // Increment downloads
    const publicRef = doc(db, 'publicSplits', split.id);
    await updateDoc(publicRef, {
      downloads: (split.downloads || 0) + 1
    });

    alert("Blueprint imported to your presets!");
  };

  const handleRenamePreset = () => {
    if (!presetToRename || !renameValue.trim()) return;

    setPresets(presets.map(p => 
      p.id === presetToRename.id ? { ...p, name: renameValue.trim() } : p
    ));
    setPresetToRename(null);
    setRenameValue('');
    setIsRenameModalOpen(false);
  };

  const handleLoadPreset = (preset: WorkoutPreset) => {
    setWorkoutDays(JSON.parse(JSON.stringify(preset.workoutDays)));
    setSchedule({ ...preset.schedule });
    if (preset.workoutDays.length > 0) {
      setCurrentDayId(preset.workoutDays[0].id);
    }
    setActiveTab('creator');
  };

  const handleDeletePreset = () => {
    if (presetToDelete) {
      setPresets(presets.filter(p => p.id !== presetToDelete));
      setPresetToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleTogglePublic = async (preset: any) => {
    if (!profile) return;

    const newPublicStatus = !preset.isPublic;
    const updatedPresets = presets.map(p => 
      p.id === preset.id ? { ...p, isPublic: newPublicStatus } : p
    );

    // Update User Profile
    const userRef = doc(db, 'users', profile.uid);
    await updateDoc(userRef, {
      customSplits: updatedPresets
    });

    // Update Public Splits collection
    const publicRef = doc(db, 'publicSplits', preset.id);
    if (newPublicStatus) {
      await setDoc(publicRef, {
        ...preset,
        isPublic: true,
        authorUid: profile.uid,
        authorName: profile.displayName,
        authorPhoto: profile.photoURL,
        downloads: preset.downloads || 0,
      });
    } else {
      // Deleting is cleaner for the community feed
      try {
        await deleteDoc(publicRef);
      } catch (e) {
        console.error("Error removing public split:", e);
      }
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    const newPlanned: PlannedExercise = { ...exercise, sets: 3, reps: '8-12' };
    const updatedDays = workoutDays.map(d => 
      d.id === currentDayId 
        ? { ...d, exercises: [...d.exercises, { ...newPlanned, id: `${exercise.id}-${Date.now()}` }] }
        : d
    );
    setWorkoutDays(updatedDays);
    // Removed automatic tab switch to 'creator' as per user request
  };

  const handleUpdateDay = (updatedDay: WorkoutDay) => {
    setWorkoutDays(workoutDays.map(d => d.id === updatedDay.id ? updatedDay : d));
  };

  const handleRemoveExercise = (id: string) => {
    const updatedDays = workoutDays.map(d => 
      d.id === currentDayId 
        ? { ...d, exercises: d.exercises.filter(ex => ex.id !== id) }
        : d
    );
    setWorkoutDays(updatedDays);
  };

  const handleAssignDay = (dayOfWeek: string, workoutDayId: string | null) => {
    setSchedule({ ...schedule, [dayOfWeek]: workoutDayId });
  };

  return (
    <div className="space-y-8">
      {/* Header & Tabs */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tighter uppercase">Split Architect</h2>
            <p className="text-white/40 font-medium">Design your scientific training week</p>
          </div>
          <button 
            onClick={() => {
              setNewPresetName(`Preset ${presets.length + 1}`);
              setIsSaveModalOpen(true);
            }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-transform active:scale-90"
          >
            <Save size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex gap-2 rounded-3xl bg-white/5 p-1.5 backdrop-blur-md overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex flex-1 min-w-[80px] items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'library' ? 'bg-white/10 text-[#CCFF00]' : 'text-white/30 hover:text-white/50'
            }`}
          >
            <BookOpen size={14} />
            Library
          </button>
          <button 
            onClick={() => setActiveTab('creator')}
            className={`flex flex-1 min-w-[80px] items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'creator' ? 'bg-white/10 text-[#CCFF00]' : 'text-white/30 hover:text-white/50'
            }`}
          >
            <LayoutGrid size={14} />
            Creator
          </button>
          <button 
            onClick={() => setActiveTab('planner')}
            className={`flex flex-1 min-w-[80px] items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'planner' ? 'bg-white/10 text-[#CCFF00]' : 'text-white/30 hover:text-white/50'
            }`}
          >
            <CalendarIcon size={14} />
            Planner
          </button>
          <button 
            onClick={() => setActiveTab('presets')}
            className={`flex flex-1 min-w-[80px] items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'presets' ? 'bg-white/10 text-[#CCFF00]' : 'text-white/30 hover:text-white/50'
            }`}
          >
            <Target size={14} />
            Presets
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#CCFF00]">Adding to: {currentDay.name}</h3>
                <div className="flex gap-2">
                  {workoutDays.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setCurrentDayId(d.id)}
                      className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                        currentDayId === d.id ? 'bg-[#CCFF00] text-black' : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {d.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <ExerciseLibrary onAddExercise={handleAddExercise} />
            </motion.div>
          )}

          {activeTab === 'creator' && (
            <motion.div
              key="creator"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#CCFF00]">{currentDay.name}</h3>
                  <button className="text-white/20 hover:text-white">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex gap-2">
                  {workoutDays.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setCurrentDayId(d.id)}
                      className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                        currentDayId === d.id ? 'bg-[#CCFF00] text-black' : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {d.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <SplitCreator 
                currentDay={currentDay} 
                onUpdateDay={handleUpdateDay}
                onRemoveExercise={handleRemoveExercise}
              />
            </motion.div>
          )}

          {activeTab === 'planner' && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <WeeklyPlanner 
                schedule={schedule}
                workoutDays={workoutDays}
                onAssignDay={handleAssignDay}
              />
            </motion.div>
          )}

          {activeTab === 'presets' && (
            <motion.div
              key="presets"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#CCFF00]">Saved Presets</h3>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{presets.length} Total</span>
              </div>

              {presets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-white/5">
                  <Save size={32} className="text-white/10 mb-4" />
                  <p className="text-sm font-medium text-white/20">No presets saved yet.<br/>Design a split and hit the save icon.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {presets.map((preset) => (
                    <div 
                      key={preset.id}
                      className="group relative flex items-center justify-between rounded-3xl border border-white/5 bg-white/5 p-5 transition-all hover:border-[#CCFF00]/30 hover:bg-white/[0.07]"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-lg">{preset.name}</h4>
                        <div className="flex gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#CCFF00]">
                            {preset.workoutDays.length} Days
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                            {new Date(preset.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {profile && (
                          <div className="flex items-center gap-2 pr-4 border-r border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                              {(preset as any).isPublic ? 'Public' : 'Private'}
                            </span>
                            <button 
                              onClick={() => handleTogglePublic(preset)}
                              className={`h-4 w-8 rounded-full transition-all p-0.5 ${(preset as any).isPublic ? 'bg-[#CCFF00]' : 'bg-white/10'}`}
                            >
                              <div className={`h-3 w-3 rounded-full bg-black transition-all ${(preset as any).isPublic ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        )}
                        <button 
                          onClick={() => {
                            setPresetToRename(preset);
                            setRenameValue(preset.name);
                            setIsRenameModalOpen(true);
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleLoadPreset(preset)}
                          className="flex items-center gap-2 rounded-xl bg-[#CCFF00] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black transition-transform active:scale-95"
                        >
                          Edit / Load
                        </button>
                        <button 
                          onClick={() => {
                            setPresetToDelete(preset.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-white/20 transition-all hover:border-white/20 hover:text-white"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSaveModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-[#121212] p-8 shadow-2xl"
            >
              <h3 className="text-xl font-black uppercase tracking-tight text-white">Save Entire Split</h3>
              <p className="mt-2 text-sm text-white/40">This will save your Push, Pull, and Leg days as one preset.</p>
              
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Preset Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="e.g., Summer Shred v1"
                    className="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:border-[#CCFF00]/50 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                  <div>
                    <p className="text-sm font-bold text-white">Make Public</p>
                    <p className="text-[10px] text-white/40">Share with the community</p>
                  </div>
                  <button 
                    onClick={() => setIsPublic(!isPublic)}
                    className={`h-6 w-12 rounded-full transition-all p-1 ${isPublic ? 'bg-[#CCFF00]' : 'bg-white/10'}`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-black transition-all ${isPublic ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsSaveModalOpen(false)}
                    className="flex-1 rounded-2xl bg-white/5 py-3 text-xs font-black uppercase tracking-widest text-white/40 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSavePreset}
                    className="flex-1 rounded-2xl bg-[#CCFF00] py-3 text-xs font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                  >
                    Save Split
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-[#121212] p-8 shadow-2xl"
            >
              <h3 className="text-xl font-black uppercase tracking-tight text-white">Delete Preset?</h3>
              <p className="mt-2 text-sm text-white/40">Are you sure you want to remove this split? This action cannot be undone.</p>
              
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 rounded-2xl bg-[#CCFF00] py-3 text-xs font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                >
                  Keep It
                </button>
                <button 
                  onClick={handleDeletePreset}
                  className="flex-1 rounded-2xl bg-white/5 py-3 text-xs font-black uppercase tracking-widest text-white/40 hover:bg-white/10"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isRenameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRenameModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-[#121212] p-8 shadow-2xl"
            >
              <h3 className="text-xl font-black uppercase tracking-tight text-white">Rename Preset</h3>
              <p className="mt-2 text-sm text-white/40">Give your training split a new name.</p>
              
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30">New Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="e.g., Hypertrophy Split"
                    className="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:border-[#CCFF00]/50 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenamePreset();
                    }}
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsRenameModalOpen(false)}
                    className="flex-1 rounded-2xl bg-white/5 py-3 text-xs font-black uppercase tracking-widest text-white/40 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleRenamePreset}
                    className="flex-1 rounded-2xl bg-[#CCFF00] py-3 text-xs font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                  >
                    Rename
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Community Blueprints Section */}
      <div className="pt-8 border-t border-white/5">
        <h3 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-white/30">Community Blueprints</h3>
        <div className="grid grid-cols-2 gap-4">
          {publicSplits.length === 0 ? (
            <div className="col-span-2 py-10 text-center border border-dashed border-white/5 rounded-3xl">
              <p className="text-sm text-white/20">No public blueprints yet.</p>
            </div>
          ) : (
            publicSplits.map((split) => (
              <div key={split.id}>
                <ThemeCard title={split.authorName} subtitle={split.name} className="bg-gradient-to-br from-[#121212] to-[#0a0a0a]">
                  <p className="mt-2 text-[10px] font-medium text-white/40">{split.workoutDays.length} Days • {split.downloads || 0} Imports</p>
                  <button 
                    onClick={() => handleImportPublic(split)}
                    className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#CCFF00]"
                  >
                    Import <ChevronRight size={12} />
                  </button>
                </ThemeCard>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Nutrition() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Nutrition</h2>
      <p className="mt-2 text-white/40">Track your macros and meals.</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MusicProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/anatomy" element={<Anatomy />} />
              <Route path="/workout" element={<Workout />} />
              <Route path="/nutrition" element={<Nutrition />} />
              <Route path="/profile" element={<ProfileView />} />
            </Routes>
          </Layout>
        </Router>
      </MusicProvider>
    </AuthProvider>
  );
}
