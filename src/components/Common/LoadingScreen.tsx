// src/components/common/LoadingSplash.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import fbLogo from '../../assets/Facebook-Logosu.png';

export const LoadingScreen: React.FC = () => {
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    // Forces the loading screen to stay visible for a minimum of 4 seconds
    const timer = setTimeout(() => {
      setCanDismiss(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[9999] overflow-hidden pointer-events-auto"
    >
      {/* Subtle pulsing background blue gradient glow */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.06, 0.22, 0.06],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-[600px] h-[600px] rounded-full bg-[#1877f2] blur-3xl pointer-events-none"
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center relative z-10"
      >
        {/* Logo with pulsing effect & soft blue drop shadow */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-20 h-20 flex items-center justify-center mb-4 drop-shadow-[0_8px_25px_rgba(24,119,242,0.3)]"
        >
          <img 
            src={fbLogo} 
            alt="Facebook Logo" 
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }} 
          />
        </motion.div>

        <h2 className="text-[22px] font-semibold text-[#1c1e21] tracking-tight mb-1">
          Welcome to Facebook
        </h2>
        <p className="text-[14px] text-[#65676b]">
          Connecting with your world...
        </p>
      </motion.div>

      {/* Animated loading dots at the bottom */}
      <div className="absolute bottom-12 flex items-center gap-1.5 z-10">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.25,
              ease: 'easeInOut',
            }}
            className="w-2 h-2 rounded-full bg-[#1877f2]"
          />
        ))}
      </div>
    </motion.div>
  );
};