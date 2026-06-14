import React from 'react';
import { motion } from 'motion/react';

interface ThemeCardProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function ThemeCard({ title, subtitle, children, className = '', onClick }: ThemeCardProps) {
  return (
    <motion.div
      whileHover={onClick ? { scale: 0.98 } : {}}
      whileTap={onClick ? { scale: 0.96 } : {}}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-[#121212] p-6 transition-colors hover:border-white/20 ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#CCFF00]">{title}</h3>
        {subtitle && <p className="mt-1 text-2xl font-bold tracking-tight text-white">{subtitle}</p>}
      </div>
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.div>
  );
}
