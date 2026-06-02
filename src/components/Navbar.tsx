import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Activity, Dumbbell, Utensils, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { profile, user } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Activity, label: 'Anatomy', path: '/anatomy' },
    { icon: Dumbbell, label: 'Workout', path: '/workout' },
    { icon: Utensils, label: 'Nutrition', path: '/nutrition' },
    { 
      icon: User, 
      label: 'Profile', 
      path: '/profile',
      customIcon: user && profile?.photoURL ? (
        <img src={profile.photoURL} alt="Profile" className="h-6 w-6 rounded-full object-cover" referrerPolicy="no-referrer" />
      ) : null
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-4">
      <div className="mx-auto max-w-lg overflow-hidden rounded-full border border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center p-3 transition-colors ${
                  isActive ? 'text-[#CCFF00]' : 'text-white/40 hover:text-white/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.customIcon ? (
                    <div className={`transition-all ${isActive ? 'ring-2 ring-[#CCFF00] ring-offset-2 ring-offset-black rounded-full' : ''}`}>
                      {item.customIcon}
                    </div>
                  ) : (
                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute -bottom-1 h-1 w-1 rounded-full bg-[#CCFF00]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
