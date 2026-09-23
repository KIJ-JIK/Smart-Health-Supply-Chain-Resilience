'use client';

import React, { useState, useEffect, useRef } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  className?: string;
  revealDirection?: 'start' | 'end' | 'center';
  animateOn?: 'view' | 'hover';
}

const GLYPHS = '0123456789ABCDEF_~-+#/\\*[]{}<>';

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 40,
  maxIterations = 12,
  characters = GLYPHS,
  className = '',
  revealDirection = 'start',
  animateOn = 'view',
}) => {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(false);

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(() =>
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('')
      );

      iteration += 1 / (maxIterations / text.length);

      if (iteration >= text.length) {
        setDisplayText(text);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, maxIterations, characters, isHovering]);

  return (
    <span
      className={`inline-block font-mono tracking-tight ${className}`}
      onMouseEnter={() => {
        if (animateOn === 'hover') {
          setIsHovering((prev) => !prev);
        }
      }}
    >
      {displayText}
    </span>
  );
};
