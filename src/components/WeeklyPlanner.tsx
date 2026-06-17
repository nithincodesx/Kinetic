import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Plus, MoreVertical, GripVertical } from 'lucide-react';
import { DAYS_OF_WEEK } from '../constants';
import { WeeklySchedule, WorkoutDay } from '../types';

interface WeeklyPlannerProps {
  schedule: WeeklySchedule;
  workoutDays: WorkoutDay[];
  onAssignDay: (dayOfWeek: string, workoutDayId: string | null) => void;
}

export default function WeeklyPlanner({ schedule, workoutDays, onAssignDay }: WeeklyPlannerProps) {
  // Simple frequency calculation: How many times is each muscle hit?
  const muscleFrequency: { [key: string]: number } = {};
  
  Object.values(schedule).forEach(dayId => {
    if (!dayId) return;
    const workout = workoutDays.find(d => d.id === dayId);
    if (!workout) return;
    
    const uniqueMuscles = new Set(workout.exercises.map(ex => ex.muscle));
    uniqueMuscles.forEach(muscle => {
      muscleFrequency[muscle] = (muscleFrequency[muscle] || 0) + 1;
    });
  });

  return (
    <div className="space-y-6">
      {/* Frequency Map */}
      <div className="rounded-3xl border border-white/10 bg-[#121212] p-6">
        <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-white/30">Frequency Map</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(muscleFrequency).map(([muscle, freq]) => (
            <div 
              key={muscle}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors ${
                freq >= 2 ? 'border-[#CCFF00]/30 bg-[#CCFF00]/10 text-[#CCFF00]' : 'border-white/10 bg-white/5 text-white/40'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider">{muscle}</span>
              <span className="text-xs font-bold">{freq}x</span>
            </div>
          ))}
          {Object.keys(muscleFrequency).length === 0 && (
            <p className="text-xs font-medium text-white/20 italic">Assign workouts to see frequency analysis.</p>
          )}
        </div>
        <p className="mt-4 text-[10px] font-medium text-white/30">
          <span className="text-[#CCFF00]">Gold Standard:</span> Aim to hit every muscle group 2x per week for maximum hypertrophy.
        </p>
      </div>

      {/* 7-Day Grid */}
      <div className="grid gap-3">
        {DAYS_OF_WEEK.map((day) => {
          const assignedDayId = schedule[day];
          const assignedWorkout = workoutDays.find(d => d.id === assignedDayId);

          return (
            <div 
              key={day}
              className="group flex items-center gap-4 rounded-3xl border border-white/5 bg-white/5 p-4 transition-colors hover:border-white/10"
            >
              <div className="w-20">
                <p className="text-xs font-black uppercase tracking-widest text-white/30">{day.slice(0, 3)}</p>
              </div>

              <div className="flex-1">
                {assignedWorkout ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">{assignedWorkout.name}</h4>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#CCFF00]">
                        {assignedWorkout.exercises.length} Exercises
                      </p>
                    </div>
                    <button 
                      onClick={() => onAssignDay(day, null)}
                      className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white/10 italic">Rest Day</p>
                    <div className="flex gap-1 overflow-x-auto">
                      {workoutDays.map(wd => (
                        <button
                          key={wd.id}
                          onClick={() => onAssignDay(day, wd.id)}
                          className="whitespace-nowrap rounded-lg bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/40 hover:bg-[#CCFF00] hover:text-black"
                        >
                          + {wd.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
