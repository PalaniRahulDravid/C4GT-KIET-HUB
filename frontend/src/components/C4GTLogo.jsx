import React from 'react';
import logoImg from '../assets/c4gt-logo.png';

export default function C4GTLogo({ 
  className = "h-11", 
  showText = true, 
  textBeside = true, 
  variant = "default",
  imgClassName = "h-11" 
}) {
  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official C4GT HUB @KIET Logo Image */}
      <div className={`flex-shrink-0 flex items-center justify-center ${isDark ? 'bg-white p-1 rounded-xl shadow-xs border border-white/20' : ''}`}>
        <img
          src={logoImg}
          alt="C4GT HUB @KIET Logo"
          className={`${imgClassName} w-auto object-contain`}
        />
      </div>

      {/* C4GT KIET HUB Brand Text */}
      {showText && (
        <span className={`font-bold text-[18px] tracking-tight leading-none ${isDark ? 'text-white' : 'text-[#1C1B1A]'}`}>
          C4GT KIET HUB
        </span>
      )}
    </div>
  );
}


