import React from 'react';
import Navbar from './Navbar';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signIn } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#CCFF00] selection:text-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-black/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link to="/" className="text-xl font-black tracking-tighter italic">KINETIC</Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/profile" className="group flex items-center gap-2">
                <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10 transition-colors group-hover:border-[#CCFF00]/50">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/5">
                      <span className="text-[10px] font-black uppercase">{user.email?.charAt(0)}</span>
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <button 
                onClick={signIn}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#CCFF00] hover:text-black"
              >
                <LogIn size={14} />
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-6 pt-24 pb-32">
        {children}
      </main>

      {/* Navigation */}
      <Navbar />
    </div>
  );
}
