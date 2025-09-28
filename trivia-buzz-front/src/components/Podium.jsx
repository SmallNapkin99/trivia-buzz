import React from "react";
import { useLocation } from "react-router-dom";
import { useWebSocket } from "./WebSocketContext";

const Podium = () => {
  const location = useLocation();
  const socket = useWebSocket();
  const { players = [] } = location.state || {};

  // Sort players by score and take top 3
  const topPlayers = [...players].sort((a, b) => b.score - a.score).slice(0, 3);
  const [revealedCount, setRevealedCount] = React.useState(0);
  const [isRevealing, setIsRevealing] = React.useState(false);

  const revealOrder = topPlayers.map((_, index) => index).reverse();

  const getRevealButtonText = () => {
    if (revealedCount >= topPlayers.length) return "All Revealed!";

    const nextPlayerIndex = revealOrder[revealedCount];

    switch (nextPlayerIndex) {
      case 0:
        return "Reveal 1st Place";
      case 1:
        return "Reveal 2nd Place";
      case 2:
        return "Reveal 3rd Place";
      default:
        return "Reveal Next";
    }
  };

  const handleAllPlayersRevealed = () => {
    if (socket) {
      socket.send(
        JSON.stringify({
          action: "end_game",
        })
      );
    }
  };

  const revealNext = () => {
    if (revealedCount < topPlayers.length && !isRevealing) {
      setIsRevealing(true);
      setTimeout(() => {
        const newRevealedCount = revealedCount + 1;
        setRevealedCount(newRevealedCount);
        setIsRevealing(false);

        // Check if this was the last player
        if (newRevealedCount >= topPlayers.length) {
          // All players now revealed - run your logic here
          console.log("All players revealed!");
          handleAllPlayersRevealed();
        }
      }, 300);
    }
  };

  const resetReveal = () => {
    setRevealedCount(0);
    setIsRevealing(false);
  };

  const getRankEmoji = (index) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return "🏆";
    }
  };

  const getRankColor = (index) => {
    switch (index) {
      case 0:
        return "from-yellow-400 to-amber-600";
      case 1:
        return "from-gray-300 to-gray-500";
      case 2:
        return "from-amber-600 to-orange-700";
      default:
        return "from-purple-500 to-pink-600";
    }
  };

  const getBorderColor = (index) => {
    switch (index) {
      case 0:
        return "border-yellow-400";
      case 1:
        return "border-gray-400";
      case 2:
        return "border-amber-500";
      default:
        return "border-purple-400";
    }
  };

  // Check if a player should be visible based on reveal order
  const shouldShowPlayer = (playerIndex) => {
    const revealPosition = revealOrder.indexOf(playerIndex);
    return revealedCount > revealPosition;
  };

  // Check if a player is currently being revealed
  const isPlayerCurrentlyRevealing = (playerIndex) => {
    const revealPosition = revealOrder.indexOf(playerIndex);
    return revealedCount === revealPosition + 1 && isRevealing;
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 min-h-screen">
      <div
        className="flex flex-col min-h-0 items-center justify-between pt-safe pb-safe overflow-hidden"
        style={{ height: "100vh" }}
      >
        {/* Header Section */}
        <div className="relative bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 shadow-2xl w-full">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative px-6 py-8 text-center">
            <div className="text-xs font-semibold text-yellow-900 mb-1 tracking-widest uppercase">
              Final Results
            </div>
            <div className="text-4xl md:text-5xl font-black text-black drop-shadow-lg">
              🏆 PODIUM 🏆
            </div>
          </div>
          {/* Decorative bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 to-pink-600"></div>
        </div>

        {/* Players List - Center Section */}
        <div className="flex-1 w-full max-w-2xl flex flex-col justify-center p-4 min-h-0">
          {topPlayers.length === 0 ? (
            <div className="text-center text-white text-xl opacity-60">
              No players found...
            </div>
          ) : (
            <div className="flex flex-col justify-center h-full">
              <div
                className={`space-y-2 ${
                  topPlayers.length > 3 ? "space-y-1" : "space-y-6"
                }`}
              >
                {/* Display players in their final positions (1st, 2nd, 3rd) */}
                {topPlayers.map((player, index) => {
                  const shouldShow = shouldShowPlayer(index);
                  const isCurrentlyRevealing =
                    isPlayerCurrentlyRevealing(index);

                  return (
                    <div
                      key={player.id}
                      className={`transform transition-all duration-500 ${
                        shouldShow
                          ? "opacity-100 translate-y-0 scale-100"
                          : "opacity-0 translate-y-8 scale-95"
                      } ${isCurrentlyRevealing ? "animate-pulse" : ""}`}
                    >
                      <div
                        className={`flex items-center bg-gradient-to-r ${getRankColor(
                          index
                        )} backdrop-blur-lg border-4 ${getBorderColor(
                          index
                        )} rounded-2xl ${
                          topPlayers.length <= 3
                            ? "p-6"
                            : topPlayers.length === 4
                            ? "p-4"
                            : "p-3"
                        } shadow-2xl relative overflow-hidden`}
                        style={{
                          boxShadow:
                            index === 0
                              ? "0 0 30px rgba(251, 191, 36, 0.5)"
                              : index === 1
                              ? "0 0 30px rgba(156, 163, 175, 0.5)"
                              : index === 2
                              ? "0 0 30px rgba(217, 119, 6, 0.5)"
                              : "0 0 20px rgba(147, 51, 234, 0.3)",
                        }}
                      >
                        {/* Rank Badge */}
                        <div
                          className={`flex items-center justify-center ${
                            topPlayers.length <= 3
                              ? "w-16 h-16"
                              : topPlayers.length === 4
                              ? "w-12 h-12"
                              : "w-10 h-10"
                          } bg-black bg-opacity-20 rounded-full mr-4 backdrop-blur-sm`}
                        >
                          <div className="text-center">
                            <div
                              className={`${
                                topPlayers.length <= 3
                                  ? "text-5xl"
                                  : topPlayers.length === 4
                                  ? "text-xl"
                                  : "text-lg"
                              }`}
                            >
                              {getRankEmoji(index)}
                            </div>
                          </div>
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 text-left">
                          <div
                            className={`${
                              topPlayers.length <= 3
                                ? "text-2xl"
                                : topPlayers.length === 4
                                ? "text-xl"
                                : "text-lg"
                            } font-black text-white drop-shadow-lg mb-1`}
                          >
                            {player.name}
                          </div>
                          <div
                            className={`${
                              topPlayers.length <= 3
                                ? "text-lg"
                                : topPlayers.length === 4
                                ? "text-base"
                                : "text-sm"
                            } text-white opacity-90 font-semibold`}
                          >
                            {player.score.toLocaleString()} points
                          </div>
                        </div>

                        {/* Winner Crown */}
                        {index === 0 && (
                          <div
                            className={
                              topPlayers.length <= 3
                                ? "text-5xl"
                                : topPlayers.length === 4
                                ? "text-3xl"
                                : "text-2xl"
                            }
                          >
                            👑
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Controls - Footer Section */}
        <div className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 shadow-2xl w-full">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="relative px-6 py-6 flex justify-center gap-4 mt-4">
            <button
              onClick={revealNext}
              disabled={revealedCount >= topPlayers.length || isRevealing}
              className="px-8 py-3 text-lg font-bold rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:from-yellow-300 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl"
            >
              {getRevealButtonText()}
            </button>
            <button
              onClick={resetReveal}
              className="px-8 py-3 text-lg font-bold rounded-2xl bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-white border-opacity-30"
            >
              Reset
            </button>
          </div>
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
        </div>
      </div>
    </div>
  );
};

export default Podium;
