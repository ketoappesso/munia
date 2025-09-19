'use client';

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  audioLevel: number;
  type: 'listening' | 'speaking';
  className?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isActive,
  audioLevel,
  type,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    radius: number;
    angle: number;
    speed: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = type === 'listening' ? 30 : 50;

      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          radius: Math.random() * 3 + 1,
          angle: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.5 + 0.2,
          opacity: Math.random() * 0.5 + 0.5
        });
      }
    };
    initParticles();

    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(17, 24, 39, 0.1)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      const centerX = canvas.offsetWidth / 2;
      const centerY = canvas.offsetHeight / 2;
      const baseRadius = isActive ? 40 + audioLevel * 60 : 20;

      // Draw central circle
      if (type === 'listening') {
        // Listening visualization - blue pulsing circle
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.4)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw waveform rings
        if (isActive) {
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius + i * 20, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.3 - i * 0.1})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      } else {
        // Speaking visualization - green radiating waves
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
        gradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.4)');
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');

        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw radiating lines
        if (isActive) {
          const lineCount = 12;
          for (let i = 0; i < lineCount; i++) {
            const angle = (Math.PI * 2 * i) / lineCount;
            const lineLength = baseRadius + audioLevel * 30;

            ctx.beginPath();
            ctx.moveTo(
              centerX + Math.cos(angle) * baseRadius * 0.8,
              centerY + Math.sin(angle) * baseRadius * 0.8
            );
            ctx.lineTo(
              centerX + Math.cos(angle) * lineLength,
              centerY + Math.sin(angle) * lineLength
            );
            ctx.strokeStyle = `rgba(34, 197, 94, ${audioLevel * 0.5})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Update position
        particle.angle += particle.speed * 0.01;
        const radiusOffset = isActive ? audioLevel * 50 : 0;
        const radius = 80 + radiusOffset + Math.sin(particle.angle * 2) * 30;

        particle.x = centerX + Math.cos(particle.angle) * radius;
        particle.y = centerY + Math.sin(particle.angle) * radius;

        // Update opacity
        if (isActive) {
          particle.opacity = Math.min(1, particle.opacity + 0.02);
        } else {
          particle.opacity = Math.max(0.2, particle.opacity - 0.02);
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = type === 'listening'
          ? `rgba(147, 197, 253, ${particle.opacity})`
          : `rgba(134, 239, 172, ${particle.opacity})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, audioLevel, type]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ background: 'transparent' }}
    />
  );
};

export default AudioVisualizer;