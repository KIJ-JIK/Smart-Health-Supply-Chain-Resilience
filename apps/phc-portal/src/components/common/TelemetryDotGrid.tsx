import React, { useEffect, useRef } from 'react';

interface TelemetryDotGridProps {
  className?: string;
  dotSpacing?: number;
  dotBaseRadius?: number;
  dotColor?: string;
  glowColor?: string;
}

export const TelemetryDotGrid: React.FC<TelemetryDotGridProps> = ({
  className = '',
  dotSpacing = 24,
  dotBaseRadius = 1.2,
  dotColor = 'rgba(45, 212, 191, 0.25)',
  glowColor = 'rgba(94, 234, 212, 0.85)',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 200);

    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
    }

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    let time = 0;

    const render = () => {
      time += 0.025;
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / dotSpacing);
      const rows = Math.ceil(height / dotSpacing);

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const originX = i * dotSpacing;
          const originY = j * dotSpacing;

          // Medical wave sinusoidal motion (Paper Shaders / Haikei wave pattern)
          const wave = Math.sin(time + originX * 0.015 + originY * 0.02) * 2;
          const posX = originX;
          const posY = originY + wave;

          // Distance to mouse cursor
          const dx = mouse.x - posX;
          const dy = mouse.y - posY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 120;

          let radius = dotBaseRadius;
          let fill = dotColor;

          if (dist < maxDist) {
            const factor = 1 - dist / maxDist;
            radius = dotBaseRadius + factor * 2.2;
            fill = glowColor;
          }

          ctx.beginPath();
          ctx.arc(posX, posY, radius, 0, Math.PI * 2);
          ctx.fillStyle = fill;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [dotSpacing, dotBaseRadius, dotColor, glowColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${className}`}
    />
  );
};
