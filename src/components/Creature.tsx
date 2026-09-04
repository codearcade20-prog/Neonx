import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type GameState = 'start' | 'choosing' | 'reveal';

interface CreatureProps {
  gameState: GameState;
  activeDifficulty?: string;
}

export const Creature = ({ gameState, activeDifficulty }: CreatureProps) => {
  const [speech, setSpeech] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (gameState === 'start') {
      setSpeech('Ready to test your fate?');
    } else if (gameState === 'choosing') {
      setSpeech('Pick a door... if you dare!');
    } else if (gameState === 'reveal') {
      if (activeDifficulty === 'joker') setSpeech('Oh no... the Joker!');
      else if (activeDifficulty === 'impossible') setSpeech('Impossible?! Good luck...');
      else if (activeDifficulty === 'dare') setSpeech('A dare! You got this!');
      else if (activeDifficulty === 'crazy') setSpeech('This is crazy!');
      else setSpeech('Looks easy enough! Do it!');

      // Hide the speech bubble after 2 seconds when the door opens
      timeoutId = setTimeout(() => {
        setSpeech('');
      }, 3000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [gameState, activeDifficulty]);

  const getImage = () => {
    // When hovering, make it talk!
    if (isHovered && gameState !== 'choosing') return '/creature_talking.jpg';

    if (gameState === 'start') return '/creature_idle.jpg';
    if (gameState === 'choosing') return '/creature_talking.jpg';
    if (gameState === 'reveal') return '/creature_excited.jpg';
    return '/creature_idle.jpg';
  };

  return (
    <>
      {/* Creature Sprite Container (with mix-blend-screen applied to the fixed stacking context) */}
      <div className="fixed bottom-4 left-4 sm:bottom-8 sm:left-8 z-40 pointer-events-none mix-blend-screen">
        <motion.div
          className="relative pointer-events-auto cursor-pointer"
          animate={{ y: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => {
            const lines = [
              "I'm made of pure neon!",
              "Keep going!",
              "Don't back down!",
              "This is getting crazy!",
              "My ears are made of energy!"
            ];
            setSpeech(lines[Math.floor(Math.random() * lines.length)]);
          }}
        >
          <div className="relative">
            <img
              src={getImage()}
              alt="Neon Creature"
              className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-full"
            />
          </div>
        </motion.div>
      </div>

      {/* Speech Bubble Container (Normal blending, placed directly next to the creature's head) */}
      <div className="fixed bottom-[100px] left-[110px] sm:bottom-[160px] sm:left-[190px] z-50 pointer-events-none">
        <AnimatePresence>
          {speech && (
            <motion.div
              key={speech}
              initial={{ opacity: 0, scale: 0.8, x: -10, y: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="relative pointer-events-auto origin-bottom-left"
            >
              <div className="bg-black/60 backdrop-blur-md border border-neon-blue shadow-[0_0_15px_rgba(59,130,246,0.5)] text-white px-4 py-2 sm:px-5 sm:py-3 rounded-2xl rounded-bl-none text-sm sm:text-base font-bold tracking-wide max-w-[180px] sm:max-w-[250px] leading-tight">
                {speech}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
