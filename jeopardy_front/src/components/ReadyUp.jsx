import React from "react";
import { useWebSocket } from "./WebSocketContext";
import BigButton from "./BigButton";
import { useParams, useNavigate } from "react-router-dom";

const ReadyUp = () => {
  const socket = useWebSocket();
  const { id: gameId } = useParams();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = React.useState("");

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
  };

  return (
    <div
      className="flex flex-col items-center justify-center space-y-16 min-h-screen pt-safe pb-safe"
      style={{ height: "100dvh" }}
    >
      <h1 className="text-yellow-500 text-3xl font-extrabold">Player Name</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        className="p-4 text-2xl text-center"
      />
      <BigButton text="Ready Up" onClick={handleReadyUp} />
    </div>
  );
};

export default ReadyUp;
