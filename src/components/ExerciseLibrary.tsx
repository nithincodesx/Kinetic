import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Plus, Check, Info, Activity, Target } from 'lucide-react';
import { Exercise, MuscleGroup, MovementPattern, Equipment } from '../types';
import { MUSCLE_GROUPS } from '../constants';
import { EXERCISES } from '../data/exercises';

const FRONT_MUSCLES = [
  { id: 'neck', name: 'Neck & Sternocleidomastoid', target: 'Shoulders', d: 'M 92,38 C 94,44 106,44 108,38 L 105,52 H 95 Z' },
  { id: 'chest_left', name: 'Pectoralis Major (Left Chest)', target: 'Chest', d: 'M 100,54 L 78,59 C 76,64 77,75 80,84 L 100,84 Z' },
  { id: 'chest_right', name: 'Pectoralis Major (Right Chest)', target: 'Chest', d: 'M 100,54 L 122,59 C 124,64 123,75 120,84 L 100,84 Z' },
  { id: 'shoulder_left', name: 'Anterior Deltoid (Left Shoulder)', target: 'Shoulders', d: 'M 78,59 C 71,62 66,69 63,78 C 63,81 67,82 70,80 C 74,74 76,68 78,59 Z' },
  { id: 'shoulder_right', name: 'Anterior Deltoid (Right Shoulder)', target: 'Shoulders', d: 'M 122,59 C 129,62 134,69 137,78 C 137,81 133,82 130,80 C 126,74 124,68 122,59 Z' },
  { id: 'biceps_left', name: 'Biceps Brachii (Left Arm)', target: 'Arms', d: 'M 63,78 C 59,85 55,95 56,105 C 59,105 62,100 64,93 C 65,87 66,81 65,79 Z' },
  { id: 'biceps_right', name: 'Biceps Brachii (Right Arm)', target: 'Arms', d: 'M 137,78 C 141,85 145,95 144,105 C 141,105 138,100 136,93 C 135,87 134,81 135,79 Z' },
  { id: 'triceps_front_left', name: 'Lateral Head Triceps (Left)', target: 'Arms', d: 'M 59,79 C 55,85 52,95 53,103 L 56,103 C 55,95 58,85 59,79 Z' },
  { id: 'triceps_front_right', name: 'Lateral Head Triceps (Right)', target: 'Arms', d: 'M 141,79 C 145,85 148,95 147,103 L 144,103 C 145,95 142,85 141,79 Z' },
  { id: 'forearms_left', name: 'Brachioradialis (Left Forearm)', target: 'Arms', d: 'M 56,105 C 51,114 46,130 48,142 C 51,142 53,133 56,124 Z' },
  { id: 'forearms_right', name: 'Brachioradialis (Right Forearm)', target: 'Arms', d: 'M 144,105 C 149,114 154,130 152,142 C 149,142 147,133 144,124 Z' },
  { id: 'abs_upper_left', name: 'Upper Rectus Abdominis (Left)', target: 'Core', d: 'M 100,86 H 88 V 98 H 100 Z' },
  { id: 'abs_upper_right', name: 'Upper Rectus Abdominis (Right)', target: 'Core', d: 'M 100,86 H 112 V 98 H 100 Z' },
  { id: 'abs_mid_left', name: 'Middle Rectus Abdominis (Left)', target: 'Core', d: 'M 100,100 H 89 V 114 H 100 Z' },
  { id: 'abs_mid_right', name: 'Middle Rectus Abdominis (Right)', target: 'Core', d: 'M 100,100 H 111 V 114 H 100 Z' },
  { id: 'abs_lower_left', name: 'Lower Rectus Abdominis (Left)', target: 'Core', d: 'M 100,116 H 90 V 132 H 100 Z' },
  { id: 'abs_lower_right', name: 'Lower Rectus Abdominis (Right)', target: 'Core', d: 'M 100,116 H 110 V 132 H 100 Z' },
  { id: 'obliques_left', name: 'External Obliques (Left)', target: 'Core', d: 'M 85,86 L 87,132 L 80,128 C 78,110 80,94 85,86 Z' },
  { id: 'obliques_right', name: 'External Obliques (Right)', target: 'Core', d: 'M 115,86 L 113,132 L 120,128 C 122,110 120,94 115,86 Z' },
  { id: 'quads_left', name: 'Quadriceps / Thigh (Left)', target: 'Legs', d: 'M 80,136 C 80,150 77,175 79,204 C 84,208 90,210 97,204 L 97,136 Z' },
  { id: 'quads_right', name: 'Quadriceps / Thigh (Right)', target: 'Legs', d: 'M 120,136 C 120,150 123,175 121,204 C 116,204 110,210 103,204 L 103,136 Z' },
  { id: 'calves_front_left', name: 'Tibialis Anterior (Left Shin)', target: 'Legs', d: 'M 79,210 C 77,228 81,260 85,285 C 87,285 89,252 90,224 Z' },
  { id: 'calves_front_right', name: 'Tibialis Anterior (Right Shin)', target: 'Legs', d: 'M 121,210 C 123,228 119,260 115,285 C 113,285 111,252 110,224 Z' }
];

const BACK_MUSCLES = [
  { id: 'traps_upper_back', name: 'Upper Trapezius (Neck)', target: 'Back', d: 'M 94,36 L 106,36 L 114,50 L 86,50 Z' },
  { id: 'traps_mid_back', name: 'Lower/Middle Trapezius', target: 'Back', d: 'M 86,50 L 114,50 L 100,84 Z' },
  { id: 'shoulders_back_left', name: 'Posterior Deltoid (Left Rear Shoulder)', target: 'Shoulders', d: 'M 86,50 C 78,52 73,59 67,69 C 67,73 71,76 75,74 Z' },
  { id: 'shoulders_back_right', name: 'Posterior Deltoid (Right Rear Shoulder)', target: 'Shoulders', d: 'M 114,50 C 122,52 127,59 133,69 C 133,73 129,76 125,74 Z' },
  { id: 'triceps_left', name: 'Triceps Brachii (Left Arm)', target: 'Arms', d: 'M 67,69 C 63,77 59,90 60,102 C 63,102 66,97 69,89 C 71,83 73,75 75,74 Z' },
  { id: 'triceps_right', name: 'Triceps Brachii (Right Arm)', target: 'Arms', d: 'M 133,69 C 137,77 141,90 140,102 C 137,102 134,97 131,89 C 129,83 127,75 125,74 Z' },
  { id: 'forearms_back_left', name: 'Forearm Extensors (Left Forearm)', target: 'Arms', d: 'M 60,102 C 55,111 50,127 52,139 C 55,139 57,130 60,121 Z' },
  { id: 'forearms_back_right', name: 'Forearm Extensors (Right Forearm)', target: 'Arms', d: 'M 140,102 C 145,111 150,127 148,139 C 145,139 143,130 140,121 Z' },
  { id: 'lats_left', name: 'Latissimus Dorsi (Left Back)', target: 'Back', d: 'M 100,84 L 75,74 C 74,84 78,102 84,116 L 100,112 Z' },
  { id: 'lats_right', name: 'Latissimus Dorsi (Right Back)', target: 'Back', d: 'M 100,84 L 125,74 C 126,84 122,102 116,116 L 100,112 Z' },
  { id: 'lower_back', name: 'Erector Spinae / Lower Back', target: 'Back', d: 'M 84,116 L 116,116 L 112,134 L 88,134 Z' },
  { id: 'glutes_left', name: 'Gluteus Maximus (Left Glute)', target: 'Legs', d: 'M 100,134 H 80 C 78,146 80,165 88,174 C 94,174 98,159 100,134 Z' },
  { id: 'glutes_right', name: 'Gluteus Maximus (Right Glute)', target: 'Legs', d: 'M 100,134 H 120 C 122,146 120,165 112,174 C 106,174 102,159 100,134 Z' },
  { id: 'hamstrings_left', name: 'Biceps Femoris (Left Hamstring)', target: 'Legs', d: 'M 80,174 C 78,194 80,212 84,228 H 98 C 96,208 96,188 88,174 Z' },
  { id: 'hamstrings_right', name: 'Biceps Femoris (Right Hamstring)', target: 'Legs', d: 'M 120,174 C 122,194 120,212 116,228 H 102 C 104,208 104,188 112,174 Z' },
  { id: 'calves_left', name: 'Gastrocnemius (Left Calf)', target: 'Legs', d: 'M 84,230 C 80,248 82,272 86,285 C 89,285 92,272 94,244 Z' },
  { id: 'calves_right', name: 'Gastrocnemius (Right Calf)', target: 'Legs', d: 'M 116,230 C 120,248 118,272 114,285 C 111,285 108,272 106,244 Z' }
];

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

interface ExerciseLibraryProps {
  onAddExercise: (exercise: Exercise) => void;
}

export default function ExerciseLibrary({ onAddExercise }: ExerciseLibraryProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>('Chest');
  const [patternFilter, setPatternFilter] = useState<MovementPattern | 'All'>('All');
  const [equipmentFilter, setEquipmentFilter] = useState<Equipment | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'emg' | 'alpha'>('emg');
  const [addedId, setAddedId] = useState<string | null>(null);
  
  // Interactive Blueprint states
  const [showAnatomyMap, setShowAnatomyMap] = useState(true);
  const [currentView, setCurrentView] = useState<'both' | 'front' | 'back'>('both');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  const handleAdd = (ex: Exercise) => {
    onAddExercise(ex);
    setAddedId(ex.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const filteredExercises = useMemo(() => {
    return EXERCISES.filter(ex => {
      const muscleMatch = ex.muscle === selectedMuscle;
      const patternMatch = patternFilter === 'All' || ex.pattern === patternFilter;
      const equipmentMatch = equipmentFilter === 'All' || ex.equipment === equipmentFilter;
      const searchMatch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      return muscleMatch && patternMatch && equipmentMatch && searchMatch;
    }).sort((a, b) => {
      if (sortBy === 'emg') return b.emg_score - a.emg_score;
      return a.name.localeCompare(b.name);
    });
  }, [selectedMuscle, patternFilter, equipmentFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm font-medium text-white placeholder:text-white/20 focus:border-[#CCFF00]/50 focus:outline-none focus:ring-1 focus:ring-[#CCFF00]/50 backdrop-blur-md"
        />
      </div>

      {/* Anatomy Map Wrapper Card */}
      <div className="rounded-3xl border border-white/5 bg-[#070707] overflow-hidden p-5 shadow-xl relative">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setShowAnatomyMap(!showAnatomyMap)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="p-1.5 rounded-lg bg-white/5 border border-white/10">
              <Activity size={14} className="text-[#CCFF00]" />
            </span>
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CCFF00] block">Interactive Blueprint</span>
              <span className="text-[11px] font-bold text-white/60">
                {showAnatomyMap ? '💡 Click muscle to select' : '💤 Blueprint Collapsed'}
              </span>
            </div>
          </button>

          {showAnatomyMap && (
            <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-0.5 text-[10px] font-mono">
              <button 
                onClick={() => setCurrentView('both')}
                className={`px-2.5 py-1 rounded-lg transition-all ${currentView === 'both' ? 'bg-[#CCFF00] text-black font-black' : 'text-white/60 hover:text-white'}`}
              >
                Dual
              </button>
              <button 
                onClick={() => setCurrentView('front')}
                className={`px-2.5 py-1 rounded-lg transition-all ${currentView === 'front' ? 'bg-[#CCFF00] text-black font-black' : 'text-white/60 hover:text-white'}`}
              >
                Front
              </button>
              <button 
                onClick={() => setCurrentView('back')}
                className={`px-2.5 py-1 rounded-lg transition-all ${currentView === 'back' ? 'bg-[#CCFF00] text-black font-black' : 'text-white/60 hover:text-white'}`}
              >
                Back
              </button>
            </div>
          )}
        </div>

        <AnimatePresence initial={false}>
          {showAnatomyMap && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4 bg-black/60 rounded-2xl border border-white/5 p-4">
                {/* Front Model View */}
                {(currentView === 'both' || currentView === 'front') && (
                  <div className="flex flex-col items-center gap-2 w-36 relative">
                    <span className="text-[8px] font-black tracking-widest text-[#CCFF00] uppercase bg-[#CCFF00]/10 border border-[#CCFF00]/10 px-2 py-0.5 rounded-full leading-none">Anterior</span>
                    
                    <svg viewBox="0 0 200 320" className="w-full h-auto drop-shadow-md">
                      {renderSilhouetteBackground()}

                      {FRONT_MUSCLES.map((muscle) => {
                        const isActive = selectedMuscle.toLowerCase() === muscle.target.toLowerCase();
                        const isHovered = hoveredId === muscle.id;
                        return (
                          <path
                            key={muscle.id}
                            d={muscle.d}
                            onClick={() => setSelectedMuscle(muscle.target as MuscleGroup)}
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
                              filter: isActive || isHovered ? 'drop-shadow(0px 0px 6px rgba(204,255,0,0.8))' : 'none'
                            }}
                          />
                        );
                      })}
                    </svg>
                  </div>
                )}

                {/* Back Model View */}
                {(currentView === 'both' || currentView === 'back') && (
                  <div className="flex flex-col items-center gap-2 w-36 relative">
                    <span className="text-[8px] font-black tracking-widest text-[#CCFF00] uppercase bg-[#CCFF00]/10 border border-[#CCFF00]/10 px-2 py-0.5 rounded-full leading-none">Posterior</span>
                    
                    <svg viewBox="0 0 200 320" className="w-full h-auto drop-shadow-md">
                      {renderSilhouetteBackground()}

                      {BACK_MUSCLES.map((muscle) => {
                        const isActive = selectedMuscle.toLowerCase() === muscle.target.toLowerCase();
                        const isHovered = hoveredId === muscle.id;
                        return (
                          <path
                            key={muscle.id}
                            d={muscle.d}
                            onClick={() => setSelectedMuscle(muscle.target as MuscleGroup)}
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
                              filter: isActive || isHovered ? 'drop-shadow(0px 0px 6px rgba(204,255,0,0.8))' : 'none'
                            }}
                          />
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>

              {/* Telemetry Indicator */}
              <div className="h-8 mt-3 flex items-center justify-center font-mono text-[9px] tracking-widest uppercase text-white/50 bg-black/40 rounded-lg border border-white/5">
                {hoveredName ? (
                  <span className="text-[#CCFF00] font-black flex items-center gap-2">
                    <span className="h-1 w-1 bg-[#CCFF00] rounded-full animate-ping" />
                    {hoveredName}
                  </span>
                ) : (
                  <span className="text-white/20">Click anatomical nodes above to select...</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Muscle Selector - Instagram Style Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        {MUSCLE_GROUPS.map((muscle) => (
          <button
            key={muscle}
            onClick={() => {
              setSelectedMuscle(muscle as MuscleGroup);
            }}
            className={`whitespace-nowrap rounded-2xl px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all border ${
              selectedMuscle === muscle
                ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.2)]'
                : 'bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:bg-white/10'
            }`}
          >
            {muscle}
          </button>
        ))}
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-2xl bg-white/5 p-1 border border-white/5 backdrop-blur-md">
            {['All', 'Compound', 'Isolation'].map((p) => (
              <button
                key={p}
                onClick={() => setPatternFilter(p as any)}
                className={`rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                  patternFilter === p ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          
          <div className="flex rounded-2xl bg-white/5 p-1 border border-white/5 backdrop-blur-md">
            {['All', 'Dumbbell', 'Machine', 'Barbell', 'Cable', 'Bodyweight'].map((e) => (
              <button
                key={e}
                onClick={() => setEquipmentFilter(e as any)}
                className={`rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                  equipmentFilter === e ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-1 border border-white/5 backdrop-blur-md">
          <button
            onClick={() => setSortBy('emg')}
            className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
              sortBy === 'emg' ? 'bg-[#CCFF00] text-black' : 'text-white/30 hover:text-white/50'
            }`}
          >
            EMG
          </button>
          <button
            onClick={() => setSortBy('alpha')}
            className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
              sortBy === 'alpha' ? 'bg-[#CCFF00] text-black' : 'text-white/30 hover:text-white/50'
            }`}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Exercise List - Vertical Feed of Glassmorphism Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            {sortBy === 'emg' ? 'Ranked by EMG Score' : 'Alphabetical List'} ({filteredExercises.length})
          </h3>
        </div>

        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredExercises.map((ex) => (
              <motion.div
                key={ex.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative flex items-center gap-4 rounded-[32px] border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/[0.08] backdrop-blur-xl"
              >
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-white/5">
                  <img 
                    src={ex.image} 
                    alt={ex.name} 
                    className="h-full w-full object-cover opacity-60 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-black text-[#CCFF00] backdrop-blur-md border border-white/10">
                    {ex.emg_score}%
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-white text-lg tracking-tight">{ex.name}</h4>
                    {ex.emg_score > 93 && (
                      <span className="rounded-full bg-[#CCFF00] px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-black shadow-[0_0_10px_rgba(204,255,0,0.3)]">
                        Top Rated
                      </span>
                    )}
                    {ex.topTier && ! (ex.emg_score > 93) && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-white/60 border border-white/10">
                        Top Tier
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rounded-full bg-[#CCFF00]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{ex.pattern}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rounded-full bg-white/20" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{ex.equipment}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAdd(ex)}
                  className={`mr-2 flex h-12 w-12 items-center justify-center rounded-2xl transition-all active:scale-90 ${
                    addedId === ex.id 
                      ? 'bg-white text-black' 
                      : 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.2)] hover:shadow-[0_0_25px_rgba(204,255,0,0.4)]'
                  }`}
                >
                  {addedId === ex.id ? <Check size={24} strokeWidth={3} /> : <Plus size={24} strokeWidth={3} />}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
