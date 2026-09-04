import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DoorClosed, ArrowRight, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import allTasks from '../data/tasks.json';
import { Creature } from '../components/Creature';
import { ContactModal } from '../components/ContactModal';
import { trackPageView, trackGameStart, trackDoorSelect } from '../lib/analytics';

type GameState = 'start' | 'choosing' | 'reveal';
export type Difficulty = 'easy' | 'crazy' | 'dare' | 'impossible' | 'joker';

export interface Task {
  id: number;
  difficulty: Difficulty;
  content: string;
  points: number;
}

const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const Particles = () => {
  const particles = Array.from({ length: 40 });
  return (
    <div className="particles-container">
      {particles.map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            animationDuration: `${Math.random() * 5 + 3}s`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: Math.random() * 0.5 + 0.2
          }}
        />
      ))}
    </div>
  );
};

export function Game() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [remainingTasks, setRemainingTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [openedDoorNum, setOpenedDoorNum] = useState<number | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [mobileDoorIndex, setMobileDoorIndex] = useState(0);
  const [isAutoHovering, setIsAutoHovering] = useState(false);

  useEffect(() => {
    if (gameState === 'reveal' && activeTask?.difficulty === 'joker') {
      setIsAutoHovering(true);
      const timer = setTimeout(() => setIsAutoHovering(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState, activeTask]);

  useEffect(() => {
    setRemainingTasks(shuffleArray(allTasks));
    trackPageView();
  }, []);

  useEffect(() => {
    // Set initial history state if not already set
    if (!window.history.state?.gameState) {
      window.history.replaceState({ gameState: 'start' }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      // If contact modal is open, close it
      if (isContactOpen) {
        setIsContactOpen(false);
        return;
      }

      const state = event.state;
      if (state?.gameState) {
        setGameState(state.gameState);
        if (state.gameState === 'choosing' || state.gameState === 'start') {
          setOpenedDoorNum(null);
        }
      } else {
        setGameState('start');
        setOpenedDoorNum(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isContactOpen]);

  const startGame = () => {
    trackGameStart();
    window.history.pushState({ gameState: 'choosing' }, '');
    setGameState('choosing');
    setOpenedDoorNum(null);
    setMobileDoorIndex(0);
  };

  const selectDoor = (num: number) => {
    if (openedDoorNum !== null) return; // Prevent double clicking

    trackDoorSelect(num);
    setOpenedDoorNum(num);

    let drawnTask;
    if (remainingTasks.length === 0) {
      const freshDeck = shuffleArray(allTasks);
      drawnTask = freshDeck[0];
      setRemainingTasks(freshDeck.slice(1));
    } else {
      drawnTask = remainingTasks[0];
      setRemainingTasks(prev => prev.slice(1));
    }

    setActiveTask(drawnTask);

    // Wait for the swing animation to finish before moving to reveal state
    setTimeout(() => {
      window.history.pushState({ gameState: 'reveal' }, '');
      setGameState('reveal');
    }, 1200);
  };

  const nextTask = () => {
    window.history.pushState({ gameState: 'choosing' }, '');
    setGameState('choosing');
    setOpenedDoorNum(null);
  };

  const handleBack = () => {
    if (isContactOpen) {
      closeContact();
      return;
    }
    window.history.back();
  };

  const openContact = () => {
    window.history.pushState({ modal: 'contact', gameState }, '');
    setIsContactOpen(true);
  };

  const closeContact = () => {
    if (isContactOpen) {
      setIsContactOpen(false);
      if (window.history.state?.modal === 'contact') {
        window.history.back();
      }
    }
  };

  const getStyles = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { text: 'text-neon-blue', bg: 'bg-neon-blue', border: 'border-neon-blue', shadow: 'shadow-glow-blue' };
      case 'crazy': return { text: 'text-neon-gold', bg: 'bg-neon-gold', border: 'border-neon-gold', shadow: 'shadow-glow-gold' };
      case 'dare': return { text: 'text-neon-purple', bg: 'bg-neon-purple', border: 'border-neon-purple', shadow: 'shadow-glow-purple' };
      case 'impossible': return { text: 'text-neon-green', bg: 'bg-neon-green', border: 'border-neon-green', shadow: 'shadow-glow-green' };
      case 'joker': return { text: 'text-neon-pink', bg: 'bg-neon-pink', border: 'border-neon-pink', shadow: 'shadow-glow-pink' };
      default: return { text: 'text-gray-500', bg: 'bg-gray-500', border: 'border-gray-500', shadow: '' };
    }
  };

  const getSuit = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '♣';
      case 'crazy': return '♠';
      case 'dare': return '♦';
      case 'impossible': return '♥';
      default: return '';
    }
  };

  const doors = [
    { num: 1, glow: 'shadow-glow-blue', border: 'border-neon-blue' },
    { num: 2, glow: 'shadow-glow-gold', border: 'border-neon-gold' },
    { num: 3, glow: 'shadow-glow-purple', border: 'border-neon-purple' }
  ];

  const handleNextDoor = () => {
    setMobileDoorIndex((prev) => (prev + 1) % doors.length);
  };

  const handlePrevDoor = () => {
    setMobileDoorIndex((prev) => (prev - 1 + doors.length) % doors.length);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-4 pt-20 sm:p-12 sm:pt-32 relative overflow-hidden bg-game-bg">
      
      <Particles />
      <div className="stage-glow" />

      {/* Background Watermark for Task ID */}
      <AnimatePresence>
        {gameState === 'reveal' && activeTask && (
          <motion.div
            key={`watermark-${activeTask.id}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
          >
            <span className="text-[20vw] font-black text-white leading-none drop-shadow-glow">
              #{activeTask.id}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="fixed top-0 left-0 w-full p-4 sm:p-6 flex justify-between items-center z-50 bg-transparent">
        <div className="flex items-center gap-2 sm:gap-3">
          <AnimatePresence>
            {gameState !== 'start' && (
              <motion.button
                key="header-back"
                initial={{ opacity: 0, x: -10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.9 }}
                onClick={handleBack}
                aria-label="Back"
                className="bg-black/40 backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white text-xs sm:text-sm font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-1.5 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all cursor-pointer group"
              >
                <ChevronLeft size={18} className="text-neon-blue group-hover:-translate-x-0.5 transition-transform" />
                <span className="inline-block tracking-wide">Back</span>
              </motion.button>
            )}
          </AnimatePresence>

          <div className="font-bold text-lg sm:text-xl tracking-tight text-white flex items-center gap-2 drop-shadow-glow">
            <DoorClosed className="text-neon-blue" />
            <span className="hidden sm:inline">NEONX DOORS</span>
          </div>
        </div>
        
        <button 
          onClick={openContact}
          className="bg-black/40 backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(168,85,247,0.3)] text-white font-bold p-2 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center border border-neon-purple/50 group-hover:bg-neon-purple/40 transition-colors">
            <MessageSquare size={16} className="text-neon-purple drop-shadow-glow" />
          </div>
          <span className="hidden sm:inline-block text-sm tracking-wide">Contact</span>
        </button>
      </header>

      <AnimatePresence mode="wait">

        {/* START STATE */}
        {gameState === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md -mt-24 sm:-mt-40 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.2)] text-center z-10 relative overflow-hidden"
          >
            {/* Subtle inner glow for the glass panel */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner border border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.4)] relative z-10">
              <DoorClosed size={40} className="text-neon-purple drop-shadow-[0_0_15px_rgba(168,85,247,1)] sm:w-12 sm:h-12" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 sm:mb-3 text-white drop-shadow-glow relative z-10">Neonx Challenge</h1>
            <p className="text-neon-blue/80 mb-6 sm:mb-10 uppercase tracking-wide sm:tracking-[0.2em] text-[10px] sm:text-xs font-bold relative z-10">
              choose your glowing fate.
            </p>

            <button
              onClick={startGame}
              className="relative w-full py-4 bg-gradient-to-r from-neon-purple to-neon-pink text-white rounded-2xl font-black text-lg uppercase tracking-wider shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_50px_rgba(236,72,153,0.6)] hover:scale-105 transition-all duration-300 active:scale-95 overflow-hidden group z-10"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">Enter the Arena</span>
            </button>
          </motion.div>
        )}

        {/* CHOOSING STATE */}
        {gameState === 'choosing' && (
          <motion.div
            key="choosing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-4xl text-center z-10 -mt-24 sm:-mt-40"
          >
            <div className="mb-8 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl font-black text-white drop-shadow-glow">Choose a Door</h2>
              <p className="text-gray-400 mt-2 sm:mt-3 text-sm sm:text-lg tracking-wide uppercase">Your fate awaits in the neon glow</p>
            </div>

            {/* DESKTOP: 3D Stage Grid (Hidden on mobile) */}
            <div className="hidden sm:flex justify-center gap-12 perspective-container px-2">
              {doors.map((door) => {
                const isOpened = openedDoorNum === door.num;
                return (
                  <motion.div
                    key={door.num}
                    className="relative w-40 aspect-[1/2] perspective-container cursor-pointer group shrink-0"
                    onClick={() => selectDoor(door.num)}
                    whileHover={{ scale: 1.05, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {/* The Task hidden behind the door (void/blackness) */}
                    <div className="absolute inset-0 bg-black rounded-lg shadow-inner border border-gray-800 -z-10 flex items-center justify-center">
                      <span className="text-gray-800 font-bold opacity-50">?</span>
                    </div>

                    {/* The 3D Swinging Door Front */}
                    <motion.div
                      className={`absolute inset-0 w-full h-full preserve-3d bg-[#2a1b15] rounded-md border-4 ${door.border} ${door.glow} flex flex-col justify-between p-3 origin-left`}
                      animate={{ rotateY: isOpened ? -105 : 0 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                    >
                      {/* Top Panel Emboss */}
                      <div className="flex-1 border-[3px] border-black/40 rounded-sm shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] mb-2 bg-[#33221a]" />

                      {/* Number */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <span className="text-7xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)]">
                          {door.num}
                        </span>
                      </div>

                      {/* Doorknob */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-600 rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.6),_0_2px_8px_rgba(0,0,0,0.8)] border border-yellow-400 z-20" />

                      {/* Bottom Panel Emboss */}
                      <div className="flex-[1.5] border-[3px] border-black/40 rounded-sm shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] mt-2 bg-[#33221a]" />
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* MOBILE: Single Door Carousel */}
            <div className="flex sm:hidden items-center justify-center gap-6 w-full px-2 perspective-container">
              <button 
                onClick={handlePrevDoor}
                className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] active:scale-90 transition-all z-20"
              >
                <ChevronLeft size={28} />
              </button>

              <div className="relative w-36 aspect-[1/2] perspective-container">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mobileDoorIndex}
                    initial={{ opacity: 0, x: 50, rotateY: 30 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    exit={{ opacity: 0, x: -50, rotateY: -30 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute inset-0 cursor-pointer group"
                    onClick={() => selectDoor(doors[mobileDoorIndex].num)}
                  >
                    {/* The Task hidden behind the door */}
                    <div className="absolute inset-0 bg-black rounded-lg shadow-inner border border-gray-800 -z-10 flex items-center justify-center">
                      <span className="text-gray-800 font-bold opacity-50">?</span>
                    </div>

                    {/* The 3D Swinging Door Front */}
                    <motion.div
                      className={`absolute inset-0 w-full h-full preserve-3d bg-[#2a1b15] rounded-md border-4 ${doors[mobileDoorIndex].border} ${doors[mobileDoorIndex].glow} flex flex-col justify-between p-3 origin-left`}
                      animate={{ rotateY: openedDoorNum === doors[mobileDoorIndex].num ? -105 : 0 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                    >
                      {/* Top Panel Emboss */}
                      <div className="flex-1 border-[3px] border-black/40 rounded-sm shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] mb-2 bg-[#33221a]" />

                      {/* Number */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <span className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)]">
                          {doors[mobileDoorIndex].num}
                        </span>
                      </div>

                      {/* Doorknob */}
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-yellow-600 rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.6),_0_2px_8px_rgba(0,0,0,0.8)] border border-yellow-400 z-20" />

                      {/* Bottom Panel Emboss */}
                      <div className="flex-[1.5] border-[3px] border-black/40 rounded-sm shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] mt-2 bg-[#33221a]" />
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <button 
                onClick={handleNextDoor}
                className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] active:scale-90 transition-all z-20"
              >
                <ChevronRight size={28} />
              </button>
            </div>
          </motion.div>
        )}

        {/* NORMAL REVEAL STATE (PLAYING CARD) */}
        {gameState === 'reveal' && activeTask && activeTask.difficulty !== 'joker' && (
          <motion.div 
            key="reveal"
            initial={{ opacity: 0, scale: 0.6, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", bounce: 0.4, duration: 1 }}
            className="flex flex-col items-center z-10 w-full -mt-10 sm:-mt-16"
          >
            <div className={`w-full max-w-[17rem] sm:max-w-[22rem] aspect-[2.5/3.5] bg-white rounded-[1.5rem] p-4 sm:p-6 ${getStyles(activeTask.difficulty).shadow} border-2 ${getStyles(activeTask.difficulty).border} text-center relative overflow-hidden flex flex-col justify-between`}>
              {/* Massive Background Suit Watermark */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] opacity-10 ${getStyles(activeTask.difficulty).text} pointer-events-none select-none font-serif leading-none`}>
                {getSuit(activeTask.difficulty)}
              </div>

              {/* Top Left Corner */}
              <div className={`absolute top-4 left-4 flex flex-col items-center ${getStyles(activeTask.difficulty).text} font-serif leading-none`}>
                <span className="text-xl sm:text-2xl font-bold">{activeTask.points}</span>
                <span className="text-3xl sm:text-4xl">{getSuit(activeTask.difficulty)}</span>
              </div>

              {/* Bottom Right Corner */}
              <div className={`absolute bottom-4 right-4 flex flex-col items-center ${getStyles(activeTask.difficulty).text} font-serif leading-none rotate-180`}>
                <span className="text-xl sm:text-2xl font-bold">{activeTask.points}</span>
                <span className="text-3xl sm:text-4xl">{getSuit(activeTask.difficulty)}</span>
              </div>

              {/* Content Container */}
              <div className="my-auto z-10 flex flex-col items-center justify-center px-2">
                <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 ${getStyles(activeTask.difficulty).bg} text-white shadow-[0_4px_10px_rgba(0,0,0,0.2)]`}>
                  {activeTask.difficulty}
                </span>

                <h3 className="text-xl sm:text-2xl font-black text-black leading-snug">
                  {activeTask.content}
                </h3>
              </div>

              {/* Action Button inside Card */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                <button
                  onClick={nextTask}
                  className={`px-8 py-3 sm:px-10 sm:py-3.5 ${getStyles(activeTask.difficulty).bg} text-white rounded-xl sm:rounded-2xl font-bold shadow-[0_0_15px_${getStyles(activeTask.difficulty).bg.replace('bg-', '')}] hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden group w-max`}
                >
                  <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                  <span className="relative z-10 flex items-center gap-1 sm:gap-2 text-sm sm:text-base whitespace-nowrap">Continue <ArrowRight size={16} /></span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* JOKER REVEAL STATE */}
        {gameState === 'reveal' && activeTask && activeTask.difficulty === 'joker' && (
          <motion.div
            key="reveal-joker"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
            className="flex flex-col items-center gap-6 z-10 w-full"
          >
            {/* The 3D Anime Card */}
            <div className={`joker-card mt-8 ${isAutoHovering ? 'auto-hover' : ''}`}>
              <div className="joker-wrapper">
                <img src="/joker_cover.jpg" className="joker-cover-image" alt="Mystical Aura" />
              </div>
              <img src="/joker_logo.jpg" className="joker-logo" alt="Wildcard Neon Logo" />
              <img src="/joker_character.jpg" className="joker-character" alt="Anime Trickster" />
            </div>

            {/* Task Content Below Card */}
            <div className="max-w-md text-center px-4">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight mb-6 drop-shadow-[0_0_10px_#ec4899]">
                {activeTask.content}
              </h3>
              <button
                onClick={nextTask}
                className="w-full sm:w-auto px-10 py-4 bg-neon-pink text-white rounded-2xl font-bold shadow-[0_0_20px_#ec4899] hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
              >
                Accept Fate <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <Creature gameState={gameState} activeDifficulty={activeTask?.difficulty} />
      <ContactModal isOpen={isContactOpen} onClose={closeContact} />
      
      {/* Footer */}
      <AnimatePresence>
        {gameState !== 'reveal' && (
          <motion.footer 
            key="footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-2 w-full text-center z-40 pointer-events-none"
          >
            <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold pointer-events-auto">
              developed by <a href="https://codearcade20.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-neon-purple hover:text-neon-pink transition-colors drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">codearcade</a>
            </p>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Game;
