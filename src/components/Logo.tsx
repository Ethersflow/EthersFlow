import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  theme?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className, size = 'md', showText = false, theme = 'light' }) => {
  const sizes = {
    sm: 'w-8 h-8 sm:w-10 sm:h-10',
    md: 'w-10 h-10 sm:w-12 sm:h-12',
    lg: 'w-28 h-28',
    xl: 'w-44 h-44',
    '2xl': 'w-60 h-60'
  };

  return (
    <div className={`flex items-center gap-1.5 ${className || ''}`}>
      <div className={`${sizes[size]} relative flex items-center justify-center`}>
         {/* Using an img tag pointing to a relative path. The user should upload their logo.png to /logo.png */}
         <img 
           src="/EthersFlow Logo - Edited.png" 
           alt="EthersFlow" 
           className="w-full h-full object-contain"
           onError={(e) => {
             // Fallback to a stylised SVG if the image is not found
             e.currentTarget.style.display = 'none';
             const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
             if (fallback) (fallback as HTMLElement).style.display = 'flex';
           }}
         />
         <div className={cn(
           "logo-fallback hidden w-full h-full items-center justify-center rounded-xl overflow-hidden shadow-lg",
           theme === 'dark' ? "bg-white/10 backdrop-blur-md" : "bg-indigo-600 shadow-indigo-100"
         )}>
           <svg viewBox="0 0 100 100" className="w-2/3 h-2/3" fill="none" xmlns="http://www.w3.org/2000/svg">
             <g transform="translate(50,50)">
               {[...Array(32)].map((_, i) => {
                 const angle = i * 0.6;
                 const radius = 5 + (i * 1.2);
                 const x = radius * Math.cos(angle);
                 const y = radius * Math.sin(angle);
                 return (
                   <circle 
                     key={i} 
                     cx={x} cy={y} 
                     r={1 + (i * 0.08)} 
                     fill={theme === 'dark' ? "white" : "white"} 
                     opacity={0.4 + (i * 0.02)}
                   />
                 );
               })}
             </g>
           </svg>
         </div>
      </div>
      {showText && (
        <span className={cn(
          "font-black tracking-tighter text-gray-900 italic",
          size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-4xl' : size === 'xl' ? 'text-5xl' : 'text-6xl'
        )}>
          EthersFlow
        </span>
      )}
    </div>
  );
};

// Helper for conditional classes since we can't import it here directly without potential issues
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
