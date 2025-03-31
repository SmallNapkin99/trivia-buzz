import React from "react";
import { useLocation } from "react-router-dom";
import { useWebSocket } from "./WebSocketContext";

const Buzzer = () => {
  const socket = useWebSocket();
  const location = useLocation();
  const { playerId } = location.state || {};
  const [player, setPlayer] = React.useState(null);
  const [lockBuzzer, setLockBuzzer] = React.useState(false);

  React.useEffect(() => {
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
    <div className="flex flex-col items-center justify-between h-screen px-6 py-6">
      <div className="text-5xl text-yellow-500 font-extrabold border-b-4 border-purple-600 text-center py-6 w-full">
        {player?.name}
      </div>
      <div className="flex-grow flex justify-center items-center w-full h-full">
        <button
          className="font-extrabold rounded-3xl font-sans text-purple-700 h-[80%] w-full text-5xl shadow-lg"
          onClick={() => handleBuzz(playerId)}
          disabled={lockBuzzer}
          style={{
            backgroundColor: lockBuzzer ? "#d1d5db" : "#eab308",
          }}
        >
          {lockBuzzer ? "Locked" : "Buzzer"}
        </button>
      </div>
      <div className="text-5xl text-yellow-500 font-extrabold border-t-4 border-purple-600 text-center py-6 w-full">
        {player?.score}
      </div>
    </div>
  );
};

export default Buzzer;
