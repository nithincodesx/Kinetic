import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  signIn: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const signIn = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Sign-in cancelled by user.");
      } else if (error.code === 'auth/cancelled-combined-assertion') {
        // Internal Firebase assertion error, often happens with multiple popups
        console.warn("Auth assertion error, usually safe to ignore if it works on next attempt.");
      } else {
        console.error("Login error:", error);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      
      if (firebaseUser) {
        // Check if profile exists, if not create it
        const profileRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          } else {
            // Initialize new profile
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              email: firebaseUser.email,
              bio: 'New KINETIC athlete.',
              rank: 'Novice',
              level: 1,
              totalSets: 0,
              streak: 0,
              topLifts: {},
              macroGoals: { protein: 180, carbs: 250, fats: 70 },
              macroCurrent: { protein: 120, carbs: 180, fats: 45 }, // Initial mock values
              vault: [],
              customSplits: [],
              createdAt: Date.now(),
            };
            setDoc(profileRef, newProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile snapshot error:", error);
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
