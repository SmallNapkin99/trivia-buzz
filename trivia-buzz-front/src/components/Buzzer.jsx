import React from "react";
import { HandRaisedIcon } from "@heroicons/react/24/outline";
import { useLocation } from "react-router-dom";
import { useWebSocket } from "./WebSocketContext";

const Buzzer = () => {
  const socket = useWebSocket();
  const location = useLocation();
  const { playerId } = location.state || {};
  const [player, setPlayer] = React.useState(null);
  const [lockBuzzer, setLockBuzzer] = React.useState(false);
  const [buzzPressed, setBuzzPressed] = React.useState(false);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    if (socket) {
      //set socket listener
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        //handle score updates
        if (data.action === "update_score") {
          const { playerId: updatedPlayerId, newScore } = data;
          if (updatedPlayerId === playerId) {
            setPlayer((prevPlayer) => ({ ...prevPlayer, score: newScore }));
          }
        }
        //handle buzzer lock
        if (data.action === "lock_buzzer") {
          const { playerId: lockedPlayerId } = data;
          if (lockedPlayerId === playerId) {
            setLockBuzzer(true);

            setTimeout(() => {
              setLockBuzzer(false);
            }, 5000);
          }
        }
        //set listener to set player state
        if (data.action === "set_player_list") {
          const { players: playerList } = data;
          const currentPlayer = playerList.find((p) => p.id === playerId);
          setPlayer(currentPlayer);
        }
        if (data.action === "game_ended") {
          alert("The game has ended.");
          //navigate to a podium screen
        }
      };
      socket.send(
        JSON.stringify({
          action: "get_players",
        })
      );
    } else {
      console.log("WebSocket is not connected");
    }

    return () => {
      //clear listener on unmount
      if (socket) {
        socket.onmessage = null;
      }
    };
  }, [socket, playerId]);

  const handleBuzz = (playerId) => {
    setBuzzPressed(true);
    setTimeout(() => setBuzzPressed(false), 200);
    if (socket) {
      socket.send(
        JSON.stringify({
          action: "buzzed",
          playerId: playerId,
        })
      );
    }
  };

  return (
    <div
      className="flex flex-col min-h-0 items-center justify-between pt-safe pb-safe overflow-hidden"
      style={{ height: "100dvh" }}
    >
      <div className="relative z-10 flex flex-col h-screen w-full">
        {/* Player Name Header */}
        <div className="relative bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 shadow-2xl">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative px-6 py-8 text-center">
            <div className="text-xs font-semibold text-yellow-900 mb-1 tracking-widest uppercase">
              Player
            </div>
            <div className="text-4xl md:text-5xl font-black text-black drop-shadow-lg">
              {player?.name || "Loading..."}
            </div>
          </div>
          {/* Decorative bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 to-pink-600"></div>
        </div>

        {/* Buzzer Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative">
            {/* Outer Ring - Animated */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-300 ${
                lockBuzzer
                  ? "bg-gradient-to-r from-red-500 to-red-700 animate-pulse"
                  : "bg-gradient-to-r from-green-400 to-emerald-600"
              }`}
              style={{
                transform: lockBuzzer ? "scale(1.1)" : "scale(1)",
                filter: "blur(8px)",
                opacity: 0.7,
              }}
            ></div>

            {/* Main Button */}
            <button
              onClick={() => handleBuzz(playerId)}
              disabled={lockBuzzer}
              className={`relative w-80 h-80 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 shadow-2xl border-8 ${
                lockBuzzer
                  ? "bg-gradient-to-br from-red-600 to-red-800 border-red-400 cursor-not-allowed"
                  : "bg-gradient-to-br from-green-500 to-emerald-700 border-green-300 hover:scale-105 active:scale-95 cursor-pointer"
              }`}
              style={{
                boxShadow: lockBuzzer
                  ? "0 0 50px rgba(239, 68, 68, 0.5), inset 0 0 30px rgba(0,0,0,0.3)"
                  : "0 0 50px rgba(34, 197, 94, 0.5), inset 0 0 30px rgba(0,0,0,0.2)",
              }}
            >
              {/* Inner Glow */}
              <div
                className={`absolute inset-4 rounded-full ${
                  lockBuzzer
                    ? "bg-gradient-to-br from-red-400 to-red-600"
                    : "bg-gradient-to-br from-green-400 to-emerald-500"
                } opacity-30`}
              ></div>

              {/* Icon */}
              <HandRaisedIcon className="relative z-10 w-32 h-32 text-white drop-shadow-lg" />

              {/* Buzz Text */}
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
                <span className="text-2xl font-black text-white drop-shadow-lg tracking-wider">
                  {lockBuzzer ? "LOCKED" : "BUZZ!"}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Score Footer */}
        <div className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 shadow-2xl">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="relative px-6 py-8 text-center">
            <div className="text-xs font-semibold text-purple-200 mb-1 tracking-widest uppercase">
              Current Score
            </div>
            <div className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
              {player?.score?.toLocaleString() || 0}
              <span className="text-2xl ml-2 text-purple-200">pts</span>
            </div>
          </div>
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
        </div>
      </div>

      {/* Ripple Effect on Buzz */}
      {buzzPressed && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-80 h-80 border-4 border-white rounded-full opacity-70 animate-ping"></div>
        </div>
      )}

      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }

        .animate-ripple {
          animation: ripple 0.6s ease-out;
        }

        /* Mobile optimizations */
        @media (max-width: 480px) {
          .w-80 {
            width: 16rem;
          }
          .h-80 {
            height: 16rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Buzzer;
