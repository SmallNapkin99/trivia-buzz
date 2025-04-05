import React from "react";
import { useWebSocket } from "./WebSocketContext";
import BigButton from "./BigButton";
import { useParams, useNavigate } from "react-router-dom";

const ReadyUp = () => {
  const socket = useWebSocket();
  const { id: gameId } = useParams();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = React.useState("");

  React.useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 10);
    }, 100);
  }, []);

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
      navigate(`/game/${gameId}/buzzer`, { state: { playerId } });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-16 min-h-screen">
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
