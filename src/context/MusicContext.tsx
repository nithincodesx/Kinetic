import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface MusicContextType {
  isPlaying: boolean;
  isLoading: boolean;
  togglePlay: () => void;
  playTrack: (previewUrl: string | null, trackId: string) => void;
  currentTrackId: string | null;
  error: string | null;
  progress: number; // 0 to 100
  currentTime: number;
  duration: number;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      if (profile?.anthem?.previewUrl) {
        playTrack(profile.anthem.previewUrl, profile.anthem.id);
      }
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        setIsLoading(true);
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
            setError(null);
          })
          .catch(err => {
            console.error("Playback failed:", err);
            setIsPlaying(false);
            setIsLoading(false);
            setError("Playback blocked or failed. Try clicking again.");
          });
      }
    }
  };

  const playTrack = (previewUrl: string | null, trackId: string) => {
    if (!previewUrl) {
      console.warn("No preview URL provided for track:", trackId);
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onwaiting = null;
      audioRef.current.onplaying = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.ondurationchange = null;
      audioRef.current.src = ""; // Clear existing source
      audioRef.current.load();   // Force browser to stop loading old source
    }

    setIsLoading(true);
    setError(null);
    setCurrentTrackId(trackId);
    setProgress(0);
    setCurrentTime(0);

    const audio = new Audio();
    audio.src = previewUrl;
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTrackId(null);
      setIsLoading(false);
      setProgress(0);
    };

    audio.ontimeupdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        const prog = (audio.currentTime / audio.duration) * 100;
        setProgress(prog);
        setCurrentTime(audio.currentTime);
      }
    };

    audio.ondurationchange = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.onwaiting = () => setIsLoading(true);
    audio.onplaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };

    audio.onerror = () => {
      const errorDetails = audio.error 
        ? `Code ${audio.error.code}: ${audio.error.message}` 
        : "Unknown stream error";
      
      console.error(`[MusicEngine] Audio load error for "${trackId}":`, errorDetails, "URL:", previewUrl);
      
      if (audio.error?.code === 4) {
        setError("Format or expired source error. Please search again to play the stable version.");
      } else {
        setError("Audio stream currently restricted. Try searching again to refresh the source.");
      }

      setIsLoading(false);
      setIsPlaying(false);
      
      // Clean up broken object
      audio.onended = null;
      audio.onplaying = null;
      audio.onerror = null;
      audioRef.current = null;
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setError(null);
          console.log(`[MusicEngine] Playback started for: ${trackId}`);
        })
        .catch(err => {
          console.error(`[MusicEngine] Playback promise rejected for "${trackId}":`, err.name, err.message);
          setIsPlaying(false);
          setIsLoading(false);
          if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
            setError("Click to play (Browser interaction required)");
          } else {
            setError(`Playback error: ${err.message || 'No supported source'}`);
          }
        });
    }
  };

  // Sync with anthem changes
  useEffect(() => {
    if (audioRef.current && profile?.anthem?.previewUrl && audioRef.current.src !== profile.anthem.previewUrl) {
      // If the profile anthem changes, we might want to stop the old one
      // But let's only do it if the user was listening to their anthem
      // For now, let's keep it simple.
    }
  }, [profile?.anthem?.previewUrl]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <MusicContext.Provider value={{ 
      isPlaying, 
      isLoading, 
      error, 
      progress, 
      currentTime, 
      duration, 
      togglePlay, 
      playTrack, 
      currentTrackId 
    }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
