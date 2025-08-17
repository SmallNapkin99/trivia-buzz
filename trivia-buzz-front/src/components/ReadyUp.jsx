import React from "react";
import { useWebSocket } from "./WebSocketContext";
import BigButton from "./BigButton";
import { useParams, useNavigate } from "react-router-dom";

const ReadyUp = () => {
  const socket = useWebSocket();
  const { id: gameId } = useParams();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = React.useState("");
  const [gameInProgress, setGameInProgress] = React.useState(false);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.action === "game_in_progress") {
          setGameInProgress(data.gameInProgress);
        }
      };
      socket.send(
        JSON.stringify({
          action: "check_game_in_progress",
        })
      );
    }
    return () => {
      //clear listener on unmount
      if (socket) {
        socket.onmessage = null;
      }
    };
  }, [socket]);

  const handleReadyUp = () => {
    if (socket && playerName) {
      //make sure player name is not empty
      if (!playerName.trim()) {
        alert("Please enter a valid name.");
        return;
      }
      let playerId = localStorage.getItem("playerId");
      if (!playerId) {
        //generate unique playerId if it doesn't exist
        playerId = crypto.randomUUID();
        localStorage.setItem("playerId", playerId);
      }

      if (gameInProgress) {
        //do not allow player to join if game is in progress
        alert("The game is already in progress. You cannot join now");
      } else {
        //Send the player info to the server
        socket.send(
          JSON.stringify({
            action: "player_ready",
            playerId: playerId,
            playerName: playerName,
          })
        );
        console.log(`${playerName} is ready with ID: ${playerId}`);

        // Trigger Fullscreen API before navigating to the Buzzer component
        const requestFullscreen = () => {
          const element = document.documentElement; // Full page
          if (element.requestFullscreen) {
            // Chrome
            element.requestFullscreen();
          } else if (element.mozRequestFullScreen) {
            // Firefox
            element.mozRequestFullScreen();
          } else if (element.webkitRequestFullscreen) {
            // Safari
            element.webkitRequestFullscreen();
          } else if (element.msRequestFullscreen) {
            // IE/Edge
            element.msRequestFullscreen();
          }
        };

        // Trigger fullscreen when the user clicks the "Ready Up" button
        requestFullscreen();

        navigate(`/game/${gameId}/buzzer`, { state: { playerId } });
      }
    }
  };

  return (
    <div
      className="flex flex-col min-h-0 items-center justify-between pt-safe pb-safe overflow-hidden"
      style={{ height: "100dvh" }}
    >
      <div className="relative z-10 flex flex-col h-screen w-full">
        {/* Header Section */}
        <div className="relative bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 shadow-2xl">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative px-6 py-8 text-center">
            <div className="text-xs font-semibold text-yellow-900 mb-1 tracking-widest uppercase">
              Join the Game
            </div>
            <div className="text-4xl md:text-5xl font-black text-black drop-shadow-lg">
              {playerName.trim() ? playerName : "Player Name"}
            </div>
          </div>
          {/* Decorative bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 to-pink-600"></div>
        </div>

        {/* Input Area - Center */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-6 text-2xl text-center bg-white bg-opacity-10 backdrop-blur-lg border-4 border-white border-opacity-30 rounded-3xl text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 shadow-2xl"
              style={{
                boxShadow:
                  "0 0 30px rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(0,0,0,0.2)",
              }}
            />
          </div>
        </div>

        {/* Button Footer */}
        <div className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 shadow-2xl">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="relative px-6 py-8 text-center">
            <BigButton text="Ready Up" onClick={handleReadyUp} />
          </div>
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
        </div>
      </div>
    </div>
  );
};

export default ReadyUp;
