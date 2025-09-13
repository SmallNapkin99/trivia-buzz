import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const Podium = () => {
  const location = useLocation();
  const { players = [] } = location.state || {};
  players.push(
    { id: "1", name: "Test1", score: 100 },
    { id: "2", name: "Test2", score: 200 },
    { id: "3", name: "Test3", score: 300 },
    { id: "4", name: "Test4", score: 400 },
    { id: "5", name: "Test5", score: 500 },
    { id: "6", name: "Test6", score: 600 }
  );
  const topPlayers = [...players].sort((a, b) => a.score - b.score).slice(0, 5);
  const [revealedCount, setRevealedCount] = useState(0);

  const revealNext = () => {
    if (revealedCount < topPlayers.length) {
      setRevealedCount(revealedCount + 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl mb-10 font-bold text-yellow-400">🏆 Podium</h1>
      {/* Render players in a vertical list */}
      {/* hide and reveal each player in reverse order for DRAMA */}
      <div className="flex flex-col gap-4">
        {topPlayers.map((player, index) => (
          <div key={player.id} className="flex flex-col items-center">
            <h2 className="font-bold">{`#${index + 1}`}</h2>
            <p>{player.name}</p>
            <p className="text-sm">Score: {player.score}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Podium;
