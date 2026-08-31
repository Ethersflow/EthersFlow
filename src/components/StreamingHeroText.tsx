import React, { useState, useEffect } from 'react';

interface StreamingHeroTextProps {
  text?: string;
  className?: string;
  cursorClassName?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  emptyPauseDuration?: number;
}

export const StreamingHeroText: React.FC<StreamingHeroTextProps> = ({
  text = 'before they execute.',
  className = 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 font-black',
  cursorClassName = 'text-indigo-600',
  typingSpeed = 65,
  deletingSpeed = 35,
  pauseDuration = 2600,
  emptyPauseDuration = 600,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'paused_full' | 'deleting' | 'paused_empty'>('typing');

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (phase === 'typing') {
      if (displayedText.length < text.length) {
        // Realistic AI token streaming variance
        const nextChar = text[displayedText.length];
        const variance = nextChar === ' ' ? 80 : (Math.random() * 30 - 15);
        const delay = Math.max(30, typingSpeed + variance);

        timer = setTimeout(() => {
          setDisplayedText(text.slice(0, displayedText.length + 1));
        }, delay);
      } else {
        timer = setTimeout(() => {
          setPhase('paused_full');
        }, 100);
      }
    } else if (phase === 'paused_full') {
      timer = setTimeout(() => {
        setPhase('deleting');
      }, pauseDuration);
    } else if (phase === 'deleting') {
      if (displayedText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedText(prev => prev.slice(0, -1));
        }, deletingSpeed);
      } else {
        timer = setTimeout(() => {
          setPhase('paused_empty');
        }, 100);
      }
    } else if (phase === 'paused_empty') {
      timer = setTimeout(() => {
        setPhase('typing');
      }, emptyPauseDuration);
    }

    return () => clearTimeout(timer);
  }, [displayedText, phase, text, typingSpeed, deletingSpeed, pauseDuration, emptyPauseDuration]);

  return (
    <span className="inline-block relative whitespace-nowrap align-baseline">
      <span className={className}>
        {displayedText}
      </span>
      {/* Streaming Agent Cursor */}
      <span
        aria-hidden="true"
        className={`inline-block ml-0.5 w-[3px] h-[0.85em] align-middle rounded-full bg-gradient-to-b from-indigo-500 to-violet-600 shadow-[0_0_8px_rgba(99,102,241,0.6)] ${
          phase === 'paused_full' || phase === 'paused_empty'
            ? 'animate-pulse'
            : 'opacity-100'
        }`}
      />
    </span>
  );
};
