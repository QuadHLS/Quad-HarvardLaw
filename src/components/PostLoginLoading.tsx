import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';

// ==================== Configuration ====================
const MOVEMENT_DURATION = 2.0; // Letters finish moving within 2.0 seconds
const SWARM_DURATION = 1.0; // Swarming phase duration
const SETTLE_DURATION = MOVEMENT_DURATION - SWARM_DURATION; // Settling phase duration (1.0s)
const TOTAL_PARTICLES = 60; // Increased by 1.5x (40 * 1.5 = 60)
const TARGET_WORD = "quad";

// Brand Colors
const COLORS = {
  GREEN: '#04913A',
  RED: '#F22F21',
  YELLOW: '#FFBB06',
  BLUE: '#0080BD',
};

const TARGET_COLORS = [COLORS.GREEN, COLORS.RED, COLORS.YELLOW, COLORS.BLUE];
const ALL_COLORS = Object.values(COLORS);

// ==================== Types ====================
interface Particle {
  id: string;
  char: string;
  isTarget: boolean;
  targetIndex?: number;
  color: string;
}

interface SwarmingLetterProps {
  particle: Particle;
  settled: boolean;
  windowWidth: number;
  windowHeight: number;
  gridIndex: number;
}

// ==================== Particle Generation ====================
const generateParticles = (): Particle[] => {
  const particles: Particle[] = [];
  const alphabet = "abcdefghijklmnopqrstuvwxyz";

  // Add Target Letters with specific colors
  TARGET_WORD.split('').forEach((char, index) => {
    particles.push({
      id: `target-${index}`,
      char,
      isTarget: true,
      targetIndex: index,
      color: TARGET_COLORS[index % TARGET_COLORS.length],
    });
  });

  // Add Decoy Letters with random Google colors
  for (let i = 0; i < TOTAL_PARTICLES - TARGET_WORD.length; i++) {
    particles.push({
      id: `decoy-${i}`,
      char: alphabet[Math.floor(Math.random() * alphabet.length)],
      isTarget: false,
      color: ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)],
    });
  }

  return particles;
};

// ==================== SwarmingLetter Component ====================
const SwarmingLetter: React.FC<SwarmingLetterProps> = React.memo(({
  particle,
  settled,
  windowWidth,
  windowHeight,
  gridIndex,
}) => {
  // Ensure initial positions are within viewport with padding
  const padding = 50;
  
  // Use grid-based distribution for more even spread
  // Calculate grid dimensions based on window aspect ratio for better distribution
  const availableWidth = Math.max(padding * 2, windowWidth - padding * 2);
  const availableHeight = Math.max(padding * 2, windowHeight - padding * 2);
  const aspectRatio = availableWidth / availableHeight;
  
  // Calculate grid dimensions that match the window aspect ratio
  const gridCols = Math.ceil(Math.sqrt(TOTAL_PARTICLES * aspectRatio));
  const gridRows = Math.ceil(TOTAL_PARTICLES / gridCols);
  const cellWidth = availableWidth / gridCols;
  const cellHeight = availableHeight / gridRows;
  
  const initialX = useMemo(() => {
    const col = gridIndex % gridCols;
    // Add small randomness within each grid cell (reduced to 30% for less clustering)
    const cellOffset = (Math.random() - 0.5) * cellWidth * 0.3;
    return padding + (col * cellWidth) + (cellWidth / 2) + cellOffset;
  }, [windowWidth, gridIndex, gridCols, cellWidth]);
  
  const initialY = useMemo(() => {
    const row = Math.floor(gridIndex / gridCols);
    // Add small randomness within each grid cell (reduced to 30% for less clustering)
    const cellOffset = (Math.random() - 0.5) * cellHeight * 0.3;
    return padding + (row * cellHeight) + (cellHeight / 2) + cellOffset;
  }, [windowHeight, gridIndex, gridCols, gridRows, cellHeight]);
  
  // Limit swarm movement to stay within viewport bounds
  const maxSwarmX = useMemo(() => {
    const availableWidth = Math.max(padding * 2, windowWidth - padding * 2);
    const maxMove = Math.min(300, availableWidth / 2);
    return (Math.random() - 0.5) * maxMove;
  }, [windowWidth]);
  const maxSwarmY = useMemo(() => {
    const availableHeight = Math.max(padding * 2, windowHeight - padding * 2);
    const maxMove = Math.min(300, availableHeight / 2);
    return (Math.random() - 0.5) * maxMove;
  }, [windowHeight]);
  const swarmX = maxSwarmX;
  const swarmY = maxSwarmY;
  const swarmRotate = useMemo(() => (Math.random() - 0.5) * 180, []);

  let animateState: any = {};
  
  if (!settled) {
    // Phase 1: Swarming - simplified to 2 keyframes for better performance
    // Clamp positions to stay within viewport
    const clampX = (val: number) => Math.max(padding, Math.min(windowWidth - padding, val));
    const clampY = (val: number) => Math.max(padding, Math.min(windowHeight - padding, val));
    
    // Simplified animation - only 2 keyframes instead of 3 for better performance
    animateState = {
      x: [
        clampX(initialX), 
        clampX(initialX + swarmX * 0.5) // Simplified movement
      ],
      y: [
        clampY(initialY), 
        clampY(initialY + swarmY * 0.5) // Simplified movement
      ],
      rotate: [0, swarmRotate * 0.5], // Simplified rotation
      opacity: [0, 1],
      scale: 1,
      transition: {
        duration: SWARM_DURATION,
        ease: [0.4, 0, 0.2, 1], // Simpler easing curve
        delay: 0,
      }
    };
  } else {
    // Phase 2: All letters fade out (no settling into QUAD formation)
    const maxMoveX = Math.min(500, windowWidth - padding);
    const maxMoveY = Math.min(500, windowHeight - padding);
    animateState = {
      x: Math.max(padding, Math.min(windowWidth - padding, initialX + (Math.random() - 0.5) * maxMoveX)),
      y: Math.max(padding, Math.min(windowHeight - padding, initialY + (Math.random() - 0.5) * maxMoveY)),
      opacity: 0,
      scale: 0,
      transition: {
        duration: SETTLE_DURATION,
        ease: [0.68, -0.55, 0.265, 1.55], // Custom cubic bezier instead of physics-based backIn
      }
    };
  }

  return (
    <motion.div
      initial={{ x: initialX, y: initialY, opacity: 0, scale: 1 }}
      animate={animateState}
      className="absolute"
      style={{
        top: 0,
        left: 0,
        willChange: "transform, opacity",
        color: particle.color,
        fontFamily: 'American Typewriter, "Cutive Mono", monospace',
        fontWeight: 'normal',
        fontStyle: 'normal',
        fontSize: '36px', // Match sidebar logo letter visual size
        backfaceVisibility: 'hidden', // Performance optimization
        WebkitFontSmoothing: 'antialiased', // Performance optimization
        transform: 'translateZ(0)', // Force GPU acceleration
        isolation: 'isolate', // Create new stacking context
      }}
    >
      {particle.char}
    </motion.div>
  );
}, (prev, next) => (
  prev.settled === next.settled &&
  prev.windowWidth === next.windowWidth &&
  prev.windowHeight === next.windowHeight
));

// ==================== LetterSwarm Component ====================
const LetterSwarm: React.FC = () => {
  const [hasSettled, setHasSettled] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  const particles = useMemo(() => generateParticles(), []);
  const resizeRaf = useRef<number | null>(null);

  // Track window size dynamically
  useEffect(() => {
    const handleResize = () => {
      if (resizeRaf.current) {
        cancelAnimationFrame(resizeRaf.current);
      }
      resizeRaf.current = requestAnimationFrame(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeRaf.current) {
        cancelAnimationFrame(resizeRaf.current);
      }
    };
  }, []);

  // Defer initial render to next frame to reduce startup lag
  useEffect(() => {
    // Use double RAF for smoother start
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsReady(true);
      });
    });
  }, []);

  useEffect(() => {
    if (!isReady) return;
    
    const timer = setTimeout(() => {
      setHasSettled(true);
    }, SWARM_DURATION * 1000);

    return () => clearTimeout(timer);
  }, [isReady]);

  // Don't render until ready to avoid initial lag
  if (!isReady) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      style={{
        fontFamily: 'American Typewriter, "Cutive Mono", monospace',
        transform: 'translateZ(0)', // Force GPU acceleration
        willChange: 'contents', // Performance hint
        isolation: 'isolate', // Create new stacking context for better performance
        contain: 'layout style paint', // CSS containment for better performance
      }}
    >
      {/* Removed AnimatePresence for better performance - direct rendering */}
      {particles.map((particle, index) => (
        <SwarmingLetter
          key={particle.id}
          particle={particle}
          settled={hasSettled}
          windowWidth={windowSize.width}
          windowHeight={windowSize.height}
          gridIndex={index}
        />
      ))}
    </div>
  );
};

// ==================== PostLoginLoading Component ====================
export const PostLoginLoading: React.FC<{ isFadingOut: boolean }> = ({ isFadingOut }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50"
      style={{ 
        backgroundColor: '#FAF9F5',
        willChange: 'opacity',
        transform: 'translateZ(0)', // Force GPU acceleration
        isolation: 'isolate', // Create new stacking context
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      transition={{ duration: 1.0, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <LetterSwarm />
    </motion.div>
  );
};
