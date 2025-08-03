import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const Podium = () => {
  const location = useLocation();
  const { players = [] } = location.state || {};
  const sortedPlayers = [...players].sort((a, b) => a.score - b.score);
  const [revealedCount, setRevealedCount] = useState(0);

  const revealNext = () => {
    if (revealedCount < sortedPlayers.length) {
      setRevealedCount(revealedCount + 1);
    }
  };

  const baseHeight = 100;
  const heightStep = 20;
  const podiumHeights = sortedPlayers.map(
    (_, index) => `${baseHeight + index * heightStep}px`
  );

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl mb-10 font-bold text-yellow-400">🏆 Podium</h1>

      <div className="flex gap-4 items-end justify-center w-full max-w-4xl">
        {sortedPlayers.map((player, index) => {
          const isVisible = index < revealedCount;
          const dynamicHeight = podiumHeights[index];

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 50 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              style={{ height: dynamicHeight }}
              className="flex flex-col items-center justify-end bg-yellow-500 text-purple-900 rounded-lg w-24 p-2"
            >
              {isVisible && (
                <>
                  <h2 className="font-bold">{`#${players.length - index}`}</h2>
                  <p>{player.name}</p>
                  <p className="text-sm">Score: {player.score}</p>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {revealedCount < sortedPlayers.length && (
        <button
          onClick={revealNext}
          className="mt-10 px-6 py-2 bg-yellow-400 text-purple-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition"
        >
          Reveal Next
        </button>
      )}
    </div>
  );
};

export default Podium;
