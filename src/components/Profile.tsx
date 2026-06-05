import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, LogOut, Trophy, Flame, Target, Edit2, Shield, Share2, ChevronRight, Check, X, Lock, Unlock, Camera, Image as ImageIcon, Plus, Music, Play, Pause, Search, Download, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import ThemeCard from './ThemeCard';
import { spotifyService } from '../services/spotifyService';
import { SpotifyTrack } from '../types';
import html2canvas from 'html2canvas';

const MacroRing = ({ label, current, goal, colors, size = 80 }: { label: string, current: number, goal: number, colors: string, size?: number }) => {
  const percentage = Math.min((current / goal) * 100, 100);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="h-full w-full rotate-90 transform">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-white/5"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#gradient-${label})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]"
          />
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.split(' ')[0]} />
              <stop offset="100%" stopColor={colors.split(' ')[1]} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black tracking-tighter text-white">{Math.round(percentage)}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">{label}</p>
        <p className="text-[10px] font-bold text-white">{current}g / {goal}g</p>
      </div>
    </div>
  );
};

export default function Profile() {
  const { profile, loading, logout } = useAuth();
  const { isPlaying, isLoading, error, progress, togglePlay, playTrack, currentTrackId: isPlayingPreview } = useMusic();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingPRs, setIsEditingPRs] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [newPRs, setNewPRs] = useState({ bench: 0, squat: 0, deadlift: 0, overhead: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isVaultLocked, setIsVaultLocked] = useState(true);
  const [sharingPR, setSharingPR] = useState<string | null>(null);
  const [comparisonIndices, setComparisonIndices] = useState<[number, number]>([0, 1]);
  
  // Music State
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const [isPhotoUrlModalOpen, setIsPhotoUrlModalOpen] = useState(false);
  const [isProfileUrlModalOpen, setIsProfileUrlModalOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // Use mock macros if not in profile
  const macroGoals = profile?.macroGoals || { protein: 180, carbs: 250, fats: 70 };
  const macroCurrent = profile?.macroCurrent || { protein: 120, carbs: 180, fats: 45 };

  // Mock vault images
  const vaultImages = (profile?.vault && profile.vault.length > 0) ? profile.vault : [
    { id: '1', url: 'https://picsum.photos/seed/physique1/400/600', date: Date.now() - 1000 * 60 * 60 * 24 * 30 },
    { id: '2', url: 'https://picsum.photos/seed/physique2/400/600', date: Date.now() },
  ];

  useEffect(() => {
    if (profile) {
      setNewBio(profile.bio || '');
      setNewPRs({
        bench: profile.topLifts?.bench || 0,
        squat: profile.topLifts?.squat || 0,
        deadlift: profile.topLifts?.deadlift || 0,
        overhead: profile.topLifts?.overhead || 0,
      });
    }
  }, [profile]);

  const handleSaveBio = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        bio: newBio
      });
      setIsEditingBio(false);
    } catch (error) {
      console.error("Error updating bio:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePRs = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        topLifts: newPRs
      });
      setIsEditingPRs(false);
    } catch (error) {
      console.error("Error updating PRs:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchMusic = async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    setIsSearching(true);
    const results = await spotifyService.searchTracks(trimmedQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectAnthem = async (track: SpotifyTrack) => {
    if (!profile) return;
    try {
      const userRef = doc(db, 'users', profile.uid);
      
      // Defensively clean the track object to ensure no undefined values are sent to Firestore
      const cleanTrack = {
        id: track.id || '',
        name: track.name || 'Unknown Track',
        artist: track.artist || 'Unknown Artist',
        albumArt: track.albumArt || '',
        previewUrl: track.previewUrl || null
      };

      await updateDoc(userRef, { anthem: cleanTrack });
      setIsMusicPickerOpen(false);
    } catch (error) {
      console.error("Error saving anthem:", error);
    }
  };

  const togglePreview = (previewUrl: string | null, trackId: string) => {
    if (!previewUrl) return; // Cant play if no url
    
    if (isPlayingPreview === trackId) {
      togglePlay();
    } else {
      playTrack(previewUrl, trackId);
    }
  };

  const captureComparison = async () => {
    if (!comparisonRef.current) return;
    try {
      const canvas = await html2canvas(comparisonRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `kinetic-progress-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Error capturing comparison:", error);
      alert("Failed to export comparison. Please try again.");
    }
  };

  const handleDownloadTrack = (url: string | null, name: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}.mp3`;
    link.target = "_blank";
    link.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File too large. Please keep below 2MB for demo storage.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, {
          vault: arrayUnion({
            id: `photo-${Date.now()}`,
            url: dataUrl,
            date: Date.now()
          })
        });
      } catch (err) {
        console.error("Error adding photo to vault:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File too large. Please keep below 2MB for profile photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, { photoURL: dataUrl });
      } catch (err) {
        console.error("Error updating profile photo:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddProfilePhotoFromUrl = async () => {
    if (!newPhotoUrl.trim() || !profile) return;
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, { photoURL: newPhotoUrl.trim() });
      setNewPhotoUrl('');
      setIsProfileUrlModalOpen(false);
    } catch (err) {
      console.error("Error updating profile photo via URL:", err);
    }
  };

  const handleAddPhotoFromUrl = async () => {
    if (!newPhotoUrl.trim() || !profile) return;
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        vault: arrayUnion({
          id: `link-${Date.now()}`,
          url: newPhotoUrl.trim(),
          date: Date.now()
        })
      });
      setNewPhotoUrl('');
      setIsPhotoUrlModalOpen(false);
    } catch (err) {
      console.error("Error adding URL photo to vault:", err);
    }
  };

  const handleImportSplit = async (split: any) => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        customSplits: arrayUnion({
          ...split,
          id: `imported-${Date.now()}`,
          isPublic: false // Imported one starts private
        })
      });
      alert(`Imported ${split.name}!`);
    } catch (error) {
      console.error("Error importing split:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSplitPrivacy = async (splitId: string, currentStatus: boolean) => {
    if (!profile) return;
    try {
      const userRef = doc(db, 'users', profile.uid);
      const updatedSplits = profile.customSplits.map(s => 
        s.id === splitId ? { ...s, isPublic: !currentStatus } : s
      );
      await updateDoc(userRef, { customSplits: updatedSplits });
    } catch (error) {
      console.error("Error toggling privacy:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-48 w-full rounded-[40px] bg-white/5" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-3xl bg-white/5" />)}
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 rounded-[32px] bg-white/5" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Not Logged In</h2>
        <p className="mt-2 text-white/40">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-32">
      {/* Steam-Style Header */}
      <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[#121212] p-8 shadow-2xl">
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-br from-[#CCFF00]/10 to-transparent opacity-50" />
        
        <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-end">
          <div className="group relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#CCFF00] to-[#00FFCC] opacity-30 blur transition duration-500 group-hover:opacity-100" />
            <div className="relative">
              <img 
                src={profile.photoURL || 'https://picsum.photos/seed/avatar/200/200'} 
                alt={profile.displayName || 'User'} 
                className="h-32 w-32 rounded-full border-4 border-[#121212] object-cover shadow-2xl transition-all group-hover:brightness-50"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer pointer-events-none">
                <button 
                  onClick={() => profilePhotoInputRef.current?.click()}
                  className="pointer-events-auto rounded-full bg-[#CCFF00] p-2 text-black shadow-xl"
                >
                  <Camera size={20} />
                </button>
                <button 
                  onClick={() => setIsProfileUrlModalOpen(true)}
                  className="pointer-events-auto mt-2 text-[8px] font-black uppercase tracking-widest text-white/60 hover:text-white"
                >
                  Or use URL
                </button>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#CCFF00] text-black shadow-lg">
              <span className="text-xs font-black">{profile.level}</span>
            </div>
            <input 
              type="file" 
              ref={profilePhotoInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleProfilePhotoUpload}
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
              <h2 className="text-4xl font-black tracking-tighter text-white uppercase">{profile.displayName}</h2>
              <span className="rounded-full bg-white/10 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-[#CCFF00] border border-[#CCFF00]/20 backdrop-blur-md">
                {profile.rank}
              </span>
            </div>
            <div className="mt-4 flex flex-col md:flex-row items-center gap-6">
              <p className="max-w-md text-sm font-medium leading-relaxed text-white/40 shrink-0">
                {profile.bio || "No bio yet. Edit your profile to add one."}
              </p>
              
              {/* Instagram-style Music HUD */}
              <div className="w-full md:mt-0 md:max-w-[240px] flex-shrink-0">
                {profile.anthem ? (
                  <div 
                    onClick={() => profile.anthem?.previewUrl && togglePreview(profile.anthem.previewUrl, profile.anthem.id)}
                    className="relative group overflow-hidden rounded-2xl bg-[#121212]/60 backdrop-blur-md border border-white/10 p-2.5 transition-all hover:border-white/20 cursor-pointer active:scale-[0.99]"
                    role="button"
                    aria-label={`Play ${profile.anthem.name}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Vinyl Effect */}
                      <div className="relative h-10 w-10 flex-shrink-0">
                        <img 
                          src={profile.anthem.albumArt} 
                          className={`h-full w-full rounded-full object-cover border border-white/10 shadow-lg ${isPlaying && isPlayingPreview === profile.anthem.id ? 'animate-spin-slow' : ''}`} 
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-black/80 border border-white/20" />
                        </div>
                      </div>

                      {/* Info & Marquee */}
                      <div className="flex-1 min-w-0 pr-1 select-none">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className={`whitespace-nowrap flex gap-8 ${profile.anthem.name.length > 20 ? 'animate-marquee' : ''}`}>
                            <span className="text-xs font-bold tracking-tight text-white flex items-center gap-2">
                              {profile.anthem.name}
                              {isPlaying && isPlayingPreview === profile.anthem.id && (
                                <div className="flex items-end gap-[2px] h-3 mb-0.5">
                                  {[1, 2, 3].map(i => (
                                    <div 
                                      key={i}
                                      className="w-[2px] bg-[#CCFF00] animate-wave"
                                      style={{ animationDelay: `${i * 0.15}s` }}
                                    />
                                  ))}
                                </div>
                              )}
                            </span>
                            {profile.anthem.name.length > 20 && (
                              <span className="text-xs font-bold tracking-tight text-white">{profile.anthem.name}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.1em] truncate transition-colors group-hover:text-white/60">{profile.anthem.artist}</p>
                      </div>

                      {/* Interaction Area */}
                      <div className="flex items-center gap-2 pr-1">
                        {profile.anthem.previewUrl ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePreview(profile.anthem!.previewUrl, profile.anthem!.id);
                            }}
                            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all shadow-md ${isPlaying && isPlayingPreview === profile.anthem.id ? 'bg-[#CCFF00] text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                          >
                            {isLoading && isPlayingPreview === profile.anthem.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : isPlaying && isPlayingPreview === profile.anthem.id ? (
                              <Pause size={16} strokeWidth={3} />
                            ) : (
                              <Play size={16} strokeWidth={3} className="ml-0.5" />
                            )}
                          </button>
                        ) : (
                          <a 
                            href={`https://open.spotify.com/track/${profile.anthem.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/40 hover:bg-[#CCFF00] hover:text-black transition-all border border-white/5"
                            title="Open in Spotify"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button 
                          onClick={() => setIsMusicPickerOpen(true)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/20 hover:bg-white/10 transition-all border border-white/5"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Neon Progress Line */}
                    {isPlaying && isPlayingPreview === profile.anthem.id && (
                      <div className="absolute bottom-0 left-0 h-[2px] bg-[#CCFF00] transition-all duration-300 shadow-[0_0_8px_#CCFF00]" style={{ width: `${progress}%` }} />
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsMusicPickerOpen(true)}
                    className="group w-full rounded-2xl bg-[#121212]/40 border border-dashed border-white/10 p-4 transition-all hover:bg-[#121212]/60 hover:border-[#CCFF00]/40"
                  >
                    <Plus className="mx-auto mb-2 text-white/10 group-hover:text-[#CCFF00] transition-colors" size={20} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-[#CCFF00] transition-colors">Connect Profile Anthem</p>
                  </button>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white"
          >
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* Stats Grid - Glassmorphism */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-white/20 mb-2">
            <Target size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Sets Done</span>
          </div>
          <p className="text-2xl font-black text-white">{profile.totalSets}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-white/20 mb-2">
            <Flame size={14} className="text-[#CCFF00]" />
            <span className="text-[10px] font-black uppercase tracking-widest">Streak</span>
          </div>
          <p className="text-2xl font-black text-white">{profile.streak} <span className="text-xs font-medium text-white/40">Days</span></p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-white/20 mb-2">
            <Trophy size={14} className="text-[#CCFF00]" />
            <span className="text-[10px] font-black uppercase tracking-widest">Rank</span>
          </div>
          <p className="text-2xl font-black text-white">{profile.rank.slice(0, 3)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 italic">PR Trophy Case</h3>
          <span className="text-[10px] font-mono text-white/20">WALL OF FAME</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Bench', value: profile.topLifts.bench || 0, icon: 'B', color: '#CCFF00' },
            { label: 'Squat', value: profile.topLifts.squat || 0, icon: 'S', color: '#CCFF00' },
            { label: 'Deadlift', value: profile.topLifts.deadlift || 0, icon: 'D', color: '#CCFF00' },
            { label: 'Overhead', value: profile.topLifts.overhead || 0, icon: 'O', color: '#CCFF00' },
          ].map((pr) => (
            <motion.div 
              key={pr.label}
              whileHover={{ scale: 1.05 }}
              className="group relative h-32 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-[20px]"
            >
              <div className="absolute top-0 right-0 p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button 
                  onClick={() => setSharingPR(pr.label)}
                  className="rounded-full bg-white/10 p-1.5 text-white/40 hover:bg-[#CCFF00] hover:text-black"
                >
                  <Share2 size={12} />
                </button>
              </div>
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="h-6 w-6 rounded-md flex items-center justify-center font-black text-[10px]" style={{ backgroundColor: `${pr.color}20`, color: pr.color }}>
                    {pr.icon}
                  </div>
                  <p className="mt-1.5 text-[8px] font-black uppercase tracking-widest text-white/40">{pr.label}</p>
                </div>
                <div>
                  <p className="font-mono text-xl font-black text-white leading-none">{pr.value}</p>
                  <p className="mt-0.5 text-[7px] font-black uppercase tracking-widest text-[#CCFF00]">KG</p>
                </div>
              </div>
              {/* Accent Glow */}
              <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full blur-[30px] opacity-20" style={{ backgroundColor: pr.color }} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* HUD: Macro Progress Rings (Moving above Vault) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid grid-cols-3 gap-4 rounded-[40px] border border-white/5 bg-white/[0.02] p-8 backdrop-blur-md"
      >
        <MacroRing label="Protein" current={macroCurrent.protein} goal={macroGoals.protein} colors="#CCFF00 #CCFF0099" />
        <MacroRing label="Carbs" current={macroCurrent.carbs} goal={macroGoals.carbs} colors="#CCFF00 #CCFF00" />
        <MacroRing label="Fats" current={macroCurrent.fats} goal={macroGoals.fats} colors="#CCFF00 #CCFF00" />
      </motion.div>

      {/* The Vault - Privacy Gallery */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 italic">Progress Vault</h3>
          <div className="flex items-center gap-2">
            <Lock size={12} className="text-white/20" />
            <span className="text-[10px] font-mono text-white/20 uppercase">Encrypted</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.01] p-1">
          <AnimatePresence mode="wait">
            {isVaultLocked ? (
              <motion.div 
                key="locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-64 flex-col items-center justify-center gap-6"
              >
                <div className="relative">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -inset-4 rounded-full bg-[#CCFF00]/10 blur-xl"
                  />
                  <button 
                    onClick={() => setIsVaultLocked(false)}
                    className="group relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-[#121212] transition-all hover:border-[#CCFF00]/50"
                  >
                    <Lock size={32} className="text-white/20 transition-all group-hover:text-[#CCFF00] group-hover:scale-110" />
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-sm font-black uppercase tracking-widest text-white">Unlock Vault</p>
                  <p className="text-[10px] font-medium text-white/20">Private Progress Gallery</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="unlocked"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Unlock size={14} className="text-[#CCFF00]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Vault Active</span>
                  </div>
                  <button 
                    onClick={() => setIsVaultLocked(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white"
                  >
                    Lock
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 aspect-[3/4] rounded-3xl border border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 text-white/20 hover:text-[#CCFF00] hover:border-[#CCFF00]/40 transition-all cursor-pointer group"
                    >
                      <Plus size={24} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Add Local</span>
                    </div>
                    <button 
                      onClick={() => setIsPhotoUrlModalOpen(true)}
                      className="w-full py-2 rounded-xl bg-white/5 border border-white/5 text-[8px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors"
                    >
                      Import from URL
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                    />
                  </div>
                  {vaultImages.map((img, idx) => (
                    <div 
                      key={img.id} 
                      onClick={() => {
                        // Simple selection logic: oldest selection becomes new second, new becomes first
                        setComparisonIndices([idx, comparisonIndices[0]]);
                      }}
                      className={`relative aspect-[3/4] rounded-3xl overflow-hidden group cursor-pointer border-2 transition-all ${comparisonIndices.includes(idx) ? 'border-[#CCFF00]' : 'border-transparent'}`}
                    >
                      <img src={img.url} alt="Vault" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] font-black tracking-widest text-white">{new Date(img.date).toLocaleDateString()}</p>
                      </div>
                      {comparisonIndices[0] === idx && (
                        <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[#CCFF00] text-black flex items-center justify-center text-[10px] font-bold">1</div>
                      )}
                      {comparisonIndices[1] === idx && (
                        <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[#CCFF00]/50 text-white flex items-center justify-center text-[10px] font-bold">2</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Side-by-Side Comparison Tool */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#CCFF00]/10 flex items-center justify-center text-[#CCFF00]">
                      <ChevronRight size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-white">Compare Tool</p>
                      <p className="text-[10px] text-white/40">Select two photos above to compare</p>
                    </div>
                  </div>
                  <button 
                    onClick={captureComparison}
                    className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#CCFF00] hover:text-black transition-all"
                  >
                    <Download size={14} />
                    Export Image
                  </button>
                </div>
                <div 
                  ref={comparisonRef} 
                  style={{ backgroundColor: '#000000' }}
                  className="p-4 rounded-3xl border border-white/5"
                >
                  <div className="grid grid-cols-2 gap-2 relative">
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' }} className="aspect-[3/4] rounded-2xl overflow-hidden border">
                      {vaultImages[comparisonIndices[1]] && (
                        <img src={vaultImages[comparisonIndices[1]].url} className="h-full w-full object-cover grayscale opacity-50" />
                      )}
                      <div style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.4)' }} className="absolute top-2 left-2 px-2 py-1 rounded text-[8px] font-black">BEFORE</div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' }} className="aspect-[3/4] rounded-2xl overflow-hidden border">
                      {vaultImages[comparisonIndices[0]] && (
                        <img src={vaultImages[comparisonIndices[0]].url} className="h-full w-full object-cover" />
                      )}
                      <div style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.4)' }} className="absolute top-2 right-2 px-2 py-1 rounded text-[8px] font-black">AFTER</div>
                    </div>
                    {/* Watermark */}
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)' }} className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2">
                       <span style={{ color: '#ffffff' }} className="text-[8px] font-black italic tracking-tighter uppercase">KINETIC</span>
                       <div style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="w-px h-2" />
                       <span style={{ color: '#CCFF00' }} className="text-[8px] font-bold">PROGRESS VAULT</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Settings Modal ... */}

      {/* Photo URL Import Modal */}
      <AnimatePresence>
        {isPhotoUrlModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPhotoUrlModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm rounded-[32px] border border-white/10 bg-[#121212] p-8 shadow-2xl"
            >
               <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">Import Photo</h3>
               <p className="text-xs text-white/40 mb-6 font-medium">Paste direct image URL from Google Drive, Unsplash, or personal hosting.</p>
               
               <input 
                 autoFocus
                 type="text" 
                 value={newPhotoUrl}
                 onChange={(e) => setNewPhotoUrl(e.target.value)}
                 placeholder="https://..."
                 className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#CCFF00]/50 focus:outline-none mb-6"
               />
               
               <div className="flex gap-3">
                 <button 
                   onClick={() => setIsPhotoUrlModalOpen(false)}
                   className="flex-1 rounded-xl bg-white/5 py-3 text-[10px] font-black uppercase tracking-widest text-white/40"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleAddPhotoFromUrl}
                   className="flex-1 rounded-xl bg-[#CCFF00] py-3 text-[10px] font-black uppercase tracking-widest text-black"
                 >
                   Import
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Photo URL Modal */}
      <AnimatePresence>
        {isProfileUrlModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileUrlModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm rounded-[32px] border border-white/10 bg-[#121212] p-8 shadow-2xl"
            >
               <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">Profile Avatar</h3>
               <p className="text-xs text-white/40 mb-6 font-medium">Paste a direct image URL to update your profile picture.</p>
               
               <input 
                 autoFocus
                 type="text" 
                 value={newPhotoUrl}
                 onChange={(e) => setNewPhotoUrl(e.target.value)}
                 placeholder="https://..."
                 className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#CCFF00]/50 focus:outline-none mb-6"
               />
               
               <div className="flex gap-3">
                 <button 
                   onClick={() => setIsProfileUrlModalOpen(false)}
                   className="flex-1 rounded-xl bg-white/5 py-3 text-[10px] font-black uppercase tracking-widest text-white/40"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleAddProfilePhotoFromUrl}
                   className="flex-1 rounded-xl bg-[#CCFF00] py-3 text-[10px] font-black uppercase tracking-widest text-black"
                 >
                   Update
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Music Picker Modal */}
      <AnimatePresence>
        {isMusicPickerOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMusicPickerOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg rounded-[40px] border border-white/10 bg-[#121212] p-8 shadow-2xl h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Music Engine</h3>
                  <p className="text-xs text-white/40">Powered by Spotify</p>
                </div>
                <button 
                  onClick={() => setIsMusicPickerOpen(false)}
                  className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative mb-6">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search tracks..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSearchMusic()}
                   className="w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 text-sm text-white focus:border-[#CCFF00]/50 focus:outline-none"
                 />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar">
                {isSearching ? (
                  <div className="flex py-10 justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#CCFF00] border-t-transparent" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((track) => (
                    <div 
                      key={track.id}
                      className="group flex items-center gap-4 rounded-3xl bg-white/5 p-3 border border-transparent hover:border-[#CCFF00]/30 hover:bg-white/10 transition-all cursor-pointer"
                      onClick={() => handleSelectAnthem(track)}
                    >
                      <div className="relative h-14 w-14 flex-shrink-0">
                        <img src={track.albumArt} className="h-full w-full rounded-xl object-cover" />
                {track.previewUrl && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePreview(track.previewUrl, track.id);
                    }}
                    className={`absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-xl transition-all ${isPlayingPreview === track.id ? 'bg-[#CCFF00]/20' : ''}`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 shadow-xl">
                      {isLoading && isPlayingPreview === track.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#CCFF00] border-t-transparent" />
                      ) : isPlaying && isPlayingPreview === track.id ? (
                        <Pause size={16} className="text-[#CCFF00]" />
                      ) : (
                        <Play size={16} className="ml-0.5" />
                      )}
                    </div>
                  </button>
                )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{track.name}</p>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] text-white/40 uppercase tracking-widest truncate">{track.artist}</p>
                           {track.isFallback && (
                             <span className="text-[7px] px-1.5 py-0.5 rounded-md bg-[#CCFF00]/10 text-[#CCFF00] font-black border border-[#CCFF00]/10 uppercase tracking-tighter">Backup Audio</span>
                           )}
                           {!track.previewUrl && (
                             <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 font-black border border-white/5 uppercase">No Preview</span>
                           )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {track.previewUrl && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadTrack(track.previewUrl, track.name);
                            }}
                            className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/10 text-white/40 hover:bg-[#CCFF00] hover:text-black transition-all"
                            title="Download Preview"
                          >
                            <Download size={14} />
                          </button>
                        )}
                        <div className="text-[10px] font-black uppercase text-[#CCFF00]">Select</div>
                      </div>
                    </div>
                  ))
                ) : searchQuery && (
                  <p className="py-10 text-center text-xs text-white/20">No tracks found</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Overlay (Mock) */}
      <AnimatePresence>
        {sharingPR && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-6 backdrop-blur-xl"
          >
            <div className="relative w-full max-w-sm aspect-[9/16] rounded-[40px] overflow-hidden border border-white/10 bg-[#050505] p-10 flex flex-col justify-between">
              <div className="absolute inset-0 opacity-20">
                 <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-[#CCFF00] blur-[100px]" />
                 <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-[#CCFF00]/40 blur-[100px]" />
              </div>
              
              <div className="relative space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#CCFF00]">New Personal Record</p>
                <h4 className="text-4xl font-black italic tracking-tighter">KINETIC</h4>
              </div>

              <div className="relative text-center space-y-4">
                <p className="text-sm font-black uppercase tracking-[0.4em] text-white/40">{sharingPR} PRESS</p>
                <p className="font-mono text-8xl font-black text-white leading-none">
                  {sharingPR === 'Bench' ? profile.topLifts.bench || 0 : 
                   sharingPR === 'Squat' ? profile.topLifts.squat || 0 : 
                   sharingPR === 'Deadlift' ? profile.topLifts.deadlift || 0 :
                   profile.topLifts.overhead || 0}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-px w-8 bg-white/20" />
                  <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00]">Verified Strength</span>
                  <div className="h-px w-8 bg-white/20" />
                </div>
              </div>

              <div className="relative flex items-center justify-between pt-10">
                <div className="flex items-center gap-3">
                  <img src={profile.photoURL!} className="h-10 w-10 rounded-full border border-white/20" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight text-white">{profile.displayName}</p>
                    <p className="text-[8px] font-bold text-white/40 uppercase">Elite Level {profile.level}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-mono text-white/20">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <button 
                onClick={() => setSharingPR(null)}
                className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            <p className="absolute bottom-10 text-[10px] font-black uppercase tracking-widest text-white/20">Saved to Story Gallery</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Public Blueprints */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Public Blueprints</h3>
          <button className="text-[10px] font-black uppercase tracking-widest text-[#CCFF00]">View All</button>
        </div>
        <div className="grid gap-4">
          {profile.customSplits.filter(s => (s as any).isPublic).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-[32px] border border-dashed border-white/5">
              <Share2 size={24} className="text-white/10 mb-3" />
              <p className="text-xs font-medium text-white/20">No public splits yet.</p>
            </div>
          ) : (
            profile.customSplits.filter(s => (s as any).isPublic).map((split: any) => (
              <div key={split.id} className="flex items-center justify-between rounded-[32px] border border-white/5 bg-white/5 p-6">
                <div>
                  <h4 className="font-bold text-white">{split.name}</h4>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#CCFF00]">{split.workoutDays.length} Days</p>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Shared by You</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleImportSplit(split)}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black transition-all"
                >
                  <Download size={14} />
                  Import
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Slide-over Settings Menu */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-[70] h-full w-full max-w-sm border-l border-white/10 bg-[#121212] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Settings</h3>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {isEditingBio ? (
                  <div className="space-y-4 rounded-2xl bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest text-[#CCFF00]">Edit Bio</p>
                      <button onClick={() => setIsEditingBio(false)} className="text-white/20 hover:text-white">
                        <X size={16} />
                      </button>
                    </div>
                    <textarea
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      placeholder="Tell the community about your goals..."
                      className="w-full h-32 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white placeholder:text-white/20 focus:border-[#CCFF00]/50 focus:outline-none resize-none"
                      maxLength={500}
                    />
                    <button
                      onClick={handleSaveBio}
                      disabled={isSaving}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#CCFF00] py-3 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : (
                        <>
                          <Check size={16} />
                          Save Bio
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditingBio(true)}
                    className="flex w-full items-center gap-4 rounded-2xl bg-white/5 p-4 text-left transition-all hover:bg-white/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CCFF00]/10 text-[#CCFF00]">
                      <Edit2 size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-white">Edit Bio</p>
                      <p className="text-[10px] font-medium text-white/40">Change your public description</p>
                    </div>
                  </button>
                )}

                {isEditingPRs ? (
                  <div className="space-y-4 rounded-2xl bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest text-[#CCFF00]">Edit Top Lifts</p>
                      <button onClick={() => setIsEditingPRs(false)} className="text-white/20 hover:text-white">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.keys(newPRs).map((lift) => (
                        <div key={lift} className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-white/40">{lift}</label>
                          <input
                            type="number"
                            value={(newPRs as any)[lift]}
                            onChange={(e) => setNewPRs({ ...newPRs, [lift]: parseInt(e.target.value) || 0 })}
                            className="w-full rounded-xl border border-white/10 bg-black/20 p-2 text-sm text-white focus:border-[#CCFF00]/50 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleSavePRs}
                      disabled={isSaving}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#CCFF00] py-3 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save PRs'}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditingPRs(true)}
                    className="flex w-full items-center gap-4 rounded-2xl bg-white/5 p-4 text-left transition-all hover:bg-white/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CCFF00]/10 text-[#CCFF00]">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-white">Edit PRs</p>
                      <p className="text-[10px] font-medium text-white/40">Update your top lift records</p>
                    </div>
                  </button>
                )}

                <div className="space-y-4 pt-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20 px-2">Manage Splits</p>
                  {profile.customSplits.length === 0 ? (
                    <p className="px-2 text-xs text-white/40 italic">No custom splits created yet.</p>
                  ) : (
                    profile.customSplits.map(split => (
                      <div key={split.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                        <div>
                          <p className="text-sm font-bold text-white">{split.name}</p>
                          <p className="text-[10px] text-white/40 italic">{(split as any).isPublic ? 'Public' : 'Private'}</p>
                        </div>
                        <button 
                          onClick={() => toggleSplitPrivacy(split.id, (split as any).isPublic)}
                          className={`h-6 w-11 rounded-full p-1 transition-colors ${ (split as any).isPublic ? 'bg-[#CCFF00]' : 'bg-white/10'}`}
                        >
                          <div className={`h-4 w-4 rounded-full bg-black transition-transform ${(split as any).isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-10">
                  <button 
                    onClick={logout}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5 py-4 font-black uppercase tracking-widest text-white/60 transition-all hover:bg-white/10 hover:text-white"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
