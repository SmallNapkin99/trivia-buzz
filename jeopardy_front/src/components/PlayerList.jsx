import React from "react";
import { useParams, Link } from "react-router-dom";
import { useWebSocket } from "./WebSocketContext";
import { QRCodeSVG } from "qrcode.react";
import BigButton from "./BigButton";

const PlayerList = () => {
  const { id: gameId } = useParams();
  const [players, setPlayers] = React.useState([]);
  const socket = useWebSocket();

  React.useEffect(() => {
    if (socket) {
      console.log("WebSocket is connected:", socket);
      //reset players map
      socket.send(
        JSON.stringify({
          action: "new_game",
        })
      );
      //set socket listener
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.action === "update_player_list") {
          setPlayers(data.players);
        }
      };
    } else {
      console.log("WebSocket is not connected");
    }

    return () => {
      // Clean up the event listener when the component unmounts
      if (socket) {
        socket.onmessage = null;
      }
    };
  }, [socket]);

  const handleRemovePlayer = (playerId) => {
    //send remove player action to server
    if (socket) {
      socket.send(
        JSON.stringify({
          action: "remove_player",
          playerId: playerId,
        })
      );
      console.log(`Removed player with ID: ${playerId}`);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left section for QR Code THE QR IS TOO FAR TO THE LEFT && CHANGE THE TEXT COLOR*/}
      <div className="flex flex-1 justify-center items-center p-6">
        <div className="text-center">
          <h3 className="text-4xl font-extrabold font-sans text-yellow-500 mb-12">
            Join Game
          </h3>
          <QRCodeSVG
            value={`${process.env.REACT_APP_FRONTEND_URL}/game/${gameId}/readyup`}
            size={256}
            fgColor="#eab308"
            bgColor="transparent"
            style={{
              padding: "12px",
              borderRadius: "16px",
              border: "8px solid #eab308",
            }}
          />
        </div>
      </div>
      {/* Vertical divider */}
      <div className="w-2 bg-yellow-500"></div>
      {/* Right section for Player List */}
      <div className="flex flex-1 justify-center items-center p-6">
        <div className="text-center flex flex-col items-center gap-6">
          <h2 className="text-4xl font-extrabold font-sans text-yellow-500">
            Players
          </h2>
          <ul className="list-disc text-yellow-500 text-2xl">
            {players.map((player, index) => (
              <li key={index} className="flex justify-between items-center">
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  className="text-yellow-500 cursor-pointer text-xl mr-4"
                >
                  x
                </button>
                <span className="flex-1 text-left">{player.name}</span>
              </li>
            ))}
          </ul>
          {players.length > 0 && (
            <Link to={`/game/${gameId}/gameboard`}>
              <BigButton text="Players Ready" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerList;
