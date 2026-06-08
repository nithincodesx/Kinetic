import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { WorkoutDay, PlannedExercise } from '../types';

interface SplitCreatorProps {
  currentDay: WorkoutDay;
  onUpdateDay: (day: WorkoutDay) => void;
  onRemoveExercise: (id: string) => void;
}

export default function SplitCreator({ currentDay, onUpdateDay, onRemoveExercise }: SplitCreatorProps) {
  const totalSets = currentDay.exercises.reduce((acc, ex) => acc + ex.sets, 0);
  
  // Validation logic
  const isJunkVolume = totalSets > 25;
  const isOptimalVolume = totalSets >= 12 && totalSets <= 20;
  const isLowVolume = totalSets > 0 && totalSets < 8;

  const updateSets = (id: string, delta: number) => {
    const updatedExercises = currentDay.exercises.map(ex => 
      ex.id === id ? { ...ex, sets: Math.max(1, ex.sets + delta) } : ex
    );
    onUpdateDay({ ...currentDay, exercises: updatedExercises });
  };

  return (
    <div className="space-y-6">
      {/* Volume Meter */}
      <div className="rounded-3xl border border-white/10 bg-[#121212] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white/30">Total Volume</h3>
            <p className="text-2xl font-black text-white">{totalSets} <span className="text-sm font-medium text-white/40">Sets</span></p>
          </div>
          <div className="text-right">
            {isJunkVolume && (
              <div className="flex items-center gap-1.5 text-white/60">
                <AlertTriangle size={16} />
                <span className="text-xs font-bold uppercase">Volume Alert</span>
              </div>
            )}
            {isOptimalVolume && (
              <div className="flex items-center gap-1.5 text-[#CCFF00]">
                <CheckCircle2 size={16} />
                <span className="text-xs font-bold uppercase">Optimal</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (totalSets / 30) * 100)}%` }}
            className={`h-full transition-colors duration-500 ${
              isJunkVolume ? 'bg-[#CCFF00] opacity-50' : isOptimalVolume ? 'bg-[#CCFF00]' : 'bg-white/20'
            }`}
          />
        </div>
        
        <p className="mt-3 text-[10px] font-medium text-white/40 leading-relaxed">
          {isJunkVolume ? "Scientific Check: You've exceeded 25 sets. This may lead to diminished returns and overtraining." : 
           isOptimalVolume ? "Scientific Check: Your volume is in the hypertrophy sweet spot (12-20 sets)." :
           isLowVolume ? "Scientific Check: Volume is low. Consider adding 2-3 more exercises for maximum growth." :
           "Add exercises from the library to start building your split."}
        </p>
      </div>

      {/* Exercise List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {currentDay.exercises.map((ex, index) => (
            <motion.div
              key={ex.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group flex items-center gap-4 rounded-3xl border border-white/5 bg-white/5 p-4 transition-colors hover:border-white/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-xs font-black text-white/40">
                {index + 1}
              </div>
              
              <div className="flex-1">
                <h4 className="font-bold text-white">{ex.name}</h4>
                <p className="text-[10px] font-black uppercase tracking-wider text-white/30">{ex.muscle}</p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-black/40 p-1">
                <button 
                  onClick={() => updateSets(ex.id, -1)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 hover:bg-white/5 hover:text-white"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="w-4 text-center text-sm font-black text-[#CCFF00]">{ex.sets}</span>
                <button 
                  onClick={() => updateSets(ex.id, 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 hover:bg-white/5 hover:text-white"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <button 
                onClick={() => onRemoveExercise(ex.id)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/20 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {currentDay.exercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-white/10 text-white/10">
              <Plus size={32} />
            </div>
            <p className="text-sm font-medium text-white/20">No exercises added yet.<br/>Select from the library below.</p>
          </div>
        )}
      </div>
    </div>
  );
}
