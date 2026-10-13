import React from 'react';

interface StayNestLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
}

export const StayNestLogo: React.FC<StayNestLogoProps> = ({
  size = 'md',
  showWordmark = false,
  className = '',
  wordmarkClassName = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const boxSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Custom Vector Emblem */}
      <div
        className={`${boxSize} relative rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center shrink-0 group transition-transform duration-200 hover:scale-105`}
      >
        {/* Subtle glossy glass overlay */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/10 via-transparent to-white/25 pointer-events-none" />

        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5 drop-shadow-xs"
          aria-hidden="true"
        >
          {/* Defs: Gradients for icon paths */}
          <defs>
            <linearGradient id="sn-roof-grad" x1="6" y1="8" x2="34" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#E0F2FE" />
            </linearGradient>
            <linearGradient id="sn-nest-grad" x1="8" y1="20" x2="32" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#93C5FD" />
              <stop offset="1" stopColor="#FFFFFF" />
            </linearGradient>
            <linearGradient id="sn-hearth-grad" x1="17" y1="18" x2="23" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>

          {/* Roof Peak / Gabled Shelter Line */}
          <path
            d="M8 18.5L20 8.5L32 18.5"
            stroke="url(#sn-roof-grad)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Stylized Nest Arc / Cradle Structure */}
          <path
            d="M10 21C10 26.8 14.5 31.5 20 31.5C25.5 31.5 30 26.8 30 21"
            stroke="url(#sn-nest-grad)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Cozy interwoven nest foundation bar */}
          <path
            d="M14 27C17 29 23 29 26 27"
            stroke="#BFDBFE"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Warm Golden Hearth / Community Core */}
          <circle
            cx="20"
            cy="19"
            r="3.2"
            fill="url(#sn-hearth-grad)"
          />
          <circle
            cx="20"
            cy="19"
            r="1.2"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {showWordmark && (
        <div className={`flex flex-col leading-none ${wordmarkClassName}`}>
          <div className="flex items-center text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
            <span>Stay</span>
            <span className="text-blue-600 dark:text-blue-400">Nest</span>
          </div>
          <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-400 tracking-wider uppercase mt-0.5">
            Student Housing
          </span>
        </div>
      )}
    </div>
  );
};
