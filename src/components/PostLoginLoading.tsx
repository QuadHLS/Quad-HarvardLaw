import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';

// ==================== Configuration ====================
const MOVEMENT_DURATION = 1.2; // Letters finish moving within 1.2 seconds (faster)
const SWARM_DURATION = 0.6; // Swarming phase duration (faster)
const SETTLE_DURATION = MOVEMENT_DURATION - SWARM_DURATION; // Settling phase duration (0.6s)
const TOTAL_PARTICLES = 100; // Increased for more dynamic animation
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

  // Add Target Letters with specific colors (lowercase for logo)
  TARGET_WORD.split('').forEach((char, index) => {
    particles.push({
      id: `target-${index}`,
      char: char.toLowerCase(), // Lowercase for logo
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
    // For target letters (QUAD), use completely random positions
    if (particle.isTarget) {
      return padding + Math.random() * (windowWidth - padding * 2);
    }
    // For other letters, use grid-based distribution
    const col = gridIndex % gridCols;
    // Add small randomness within each grid cell (reduced to 30% for less clustering)
    const cellOffset = (Math.random() - 0.5) * cellWidth * 0.3;
    return padding + (col * cellWidth) + (cellWidth / 2) + cellOffset;
  }, [windowWidth, gridIndex, gridCols, cellWidth, particle.isTarget]);
  
  const initialY = useMemo(() => {
    // For target letters (QUAD), use completely random positions
    if (particle.isTarget) {
      return padding + Math.random() * (windowHeight - padding * 2);
    }
    // For other letters, use grid-based distribution
    const row = Math.floor(gridIndex / gridCols);
    // Add small randomness within each grid cell (reduced to 30% for less clustering)
    const cellOffset = (Math.random() - 0.5) * cellHeight * 0.3;
    return padding + (row * cellHeight) + (cellHeight / 2) + cellOffset;
  }, [windowHeight, gridIndex, gridCols, gridRows, cellHeight, particle.isTarget]);
  
  // Limit swarm movement to stay within viewport bounds - increased for more movement
  const maxSwarmX = useMemo(() => {
    const availableWidth = Math.max(padding * 2, windowWidth - padding * 2);
    const maxMove = Math.min(600, availableWidth / 1.5); // Increased from 300 to 600, and from /2 to /1.5
    return (Math.random() - 0.5) * maxMove;
  }, [windowWidth]);
  const maxSwarmY = useMemo(() => {
    const availableHeight = Math.max(padding * 2, windowHeight - padding * 2);
    const maxMove = Math.min(600, availableHeight / 1.5); // Increased from 300 to 600, and from /2 to /1.5
    return (Math.random() - 0.5) * maxMove;
  }, [windowHeight]);
  const swarmX = maxSwarmX;
  const swarmY = maxSwarmY;
  const swarmRotate = useMemo(() => (Math.random() - 0.5) * 360, []); // Increased from 180 to 360 for full rotation

  let animateState: any = {};
  
  if (!settled) {
    // Phase 1: Swarming - simplified to 2 keyframes for better performance
    // Clamp positions to stay within viewport
    const clampX = (val: number) => Math.max(padding, Math.min(windowWidth - padding, val));
    const clampY = (val: number) => Math.max(padding, Math.min(windowHeight - padding, val));
    
    // Enhanced animation with more movement - using full movement range
    animateState = {
      x: [
        clampX(initialX), 
        clampX(initialX + swarmX) // Full movement instead of 0.5x
      ],
      y: [
        clampY(initialY), 
        clampY(initialY + swarmY) // Full movement instead of 0.5x
      ],
      rotate: [0, swarmRotate], // Full rotation instead of 0.5x
      opacity: [0, 1],
      scale: 1, // Keep consistent size throughout
      transition: {
        duration: SWARM_DURATION,
        ease: [0.4, 0, 0.2, 1], // Simpler easing curve
        delay: 0,
      }
    };
  } else {
    // Phase 2: Target letters (Q, U, A, D) move to top-left to form QUAD logo matching sidebar position, others fade out
    if (particle.isTarget && particle.targetIndex !== undefined) {
      // Position to match sidebar logo location (top-left)
      // Sidebar has p-4 (16px padding) and logo is h-12 (48px)
      const sidebarPadding = 16; // p-4 = 16px
      const logoSize = 48; // h-12 = 48px
      const letterSpacingX = 24; // Horizontal spacing between letter centers
      const letterSpacingY = 30; // Vertical spacing between rows (increased for more space)
      const offsetX = -16; // Move left a tiny bit more
      const offsetY = -28; // Move up more
      
      // 2x2 grid positions matching the QUAD logo:
      // Q (index 0) = top-left
      // U (index 1) = top-right
      // A (index 2) = bottom-left
      // D (index 3) = bottom-right
      const col = particle.targetIndex % 2; // 0 = left, 1 = right
      const row = Math.floor(particle.targetIndex / 2); // 0 = top, 1 = bottom
      
      // Calculate position: top-left corner + padding + letter position
      // Center the logo area, then position letters within it
      const logoStartX = sidebarPadding + (logoSize / 2) - (letterSpacingX / 2) + offsetX;
      const logoStartY = sidebarPadding + (logoSize / 2) - (letterSpacingY / 2) + offsetY;
      
      // Special adjustments for U (index 1) and D (index 3) - move down and left
      const letterOffsetX = (particle.targetIndex === 1 || particle.targetIndex === 3) ? -4 : 0; // Move U and D left
      const letterOffsetY = (particle.targetIndex === 1 || particle.targetIndex === 3) ? 3 : 0; // Move U and D down
      
      const targetX = logoStartX + (col * letterSpacingX) + letterOffsetX;
      const targetY = logoStartY + (row * letterSpacingY) + letterOffsetY;
      
      // Animate to position first, then fade out quickly on their own
      const moveDuration = SETTLE_DURATION * 2.2; // Slower movement (increased from 1.5 to 2.2)
      const holdDuration = 0.3; // Hold at final position (0.3 seconds - extended)
      const fadeDuration = 0.2; // Quick fade (0.2 seconds)
      const totalDuration = moveDuration + holdDuration + fadeDuration;
      
      animateState = {
        x: targetX,
        y: targetY,
        rotate: [swarmRotate, 0], // Animate from current rotation to 0 (straight)
        opacity: [1, 1, 1, 0], // Stay visible during movement and hold, then fade out quickly
        scale: 1, // Keep same size as rest of animation
        transition: {
          x: {
            duration: moveDuration,
            ease: [0.4, 0, 0.2, 1], // Smooth ease without overshoot
          },
          y: {
            duration: moveDuration,
            ease: [0.4, 0, 0.2, 1], // Smooth ease without overshoot
          },
          rotate: {
            duration: moveDuration,
            ease: [0.4, 0, 0.2, 1], // Smooth ease without overshoot
          },
          opacity: {
            times: [0, moveDuration / totalDuration, (moveDuration + holdDuration) / totalDuration, 1], // Stay visible during movement and hold, then fade
            duration: totalDuration,
            ease: [0.25, 0.1, 0.25, 1],
          }
        }
      };
    } else {
      // Non-target letters fade out with more movement
      const maxMoveX = Math.min(800, windowWidth - padding);
      const maxMoveY = Math.min(800, windowHeight - padding);
      animateState = {
        x: Math.max(padding, Math.min(windowWidth - padding, initialX + (Math.random() - 0.5) * maxMoveX)),
        y: Math.max(padding, Math.min(windowHeight - padding, initialY + (Math.random() - 0.5) * maxMoveY)),
        rotate: swarmRotate * 1.5,
        opacity: 0,
        scale: 0,
        transition: {
          duration: SETTLE_DURATION,
          ease: [0.68, -0.55, 0.265, 1.55],
        }
      };
    }
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
        fontFamily: 'American Typewriter, serif',
        fontWeight: 'normal',
        fontStyle: 'normal',
        fontSize: '32px',
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
        fontFamily: 'American Typewriter, serif',
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
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);

  // Start background fade earlier - after swarming phase completes
  useEffect(() => {
    const fadeStartDelay = SWARM_DURATION * 1000 + 200; // Start fading 200ms after swarming (sooner)
    const timer = setTimeout(() => {
      setBackgroundOpacity(0);
    }, fadeStartDelay);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Background that fades out - color stays constant, only opacity changes */}
      <motion.div
        className="fixed inset-0 z-50"
        style={{ 
          backgroundColor: 'var(--background-color, #f9f5f0)', // Keep color constant
          willChange: 'opacity',
          transform: 'translateZ(0)', // Force GPU acceleration
          isolation: 'isolate', // Create new stacking context
        }}
        initial={{ opacity: 1 }}
        animate={{ 
          opacity: isFadingOut ? 0 : backgroundOpacity,
          backgroundColor: 'var(--background-color, #f9f5f0)', // Explicitly maintain color
        }}
        transition={{ 
          opacity: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
          backgroundColor: { duration: 0 }, // No transition on color
        }}
      />
      {/* Letters fade out with the background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 51, pointerEvents: 'none' }}>
        <LetterSwarm />
      </div>
    </>
  );
};
