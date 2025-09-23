import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWebSocket } from "./WebSocketContext";
import { QRCodeSVG } from "qrcode.react";
import BigButton from "./BigButton";

const PlayerList = () => {
  const navigate = useNavigate();
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
    <div
      className="flex flex-col min-h-0 overflow-hidden"
      style={{ height: "100vh" }}
    >
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 shadow-2xl">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative px-6 py-8 text-center">
          <div className="text-xs font-semibold text-yellow-900 mb-1 tracking-widest uppercase">
            Game Setup
          </div>
          <div className="text-4xl md:text-5xl font-black text-black drop-shadow-lg">
            Trivia Buzz
          </div>
        </div>
        {/* Decorative bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 to-pink-600"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left section for QR Code */}
        <div className="flex flex-1 flex-col justify-center items-center p-6">
          {/* Left Header */}
          <div className="text-center mb-8">
            <div className="text-xs font-semibold text-purple-200 mb-1 tracking-widest uppercase">
              Scan QR Code
            </div>
            <div className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
              Join Game
            </div>
          </div>

          {/* QR Code */}
          <div className="p-4 rounded-2xl shadow-2xl">
            <QRCodeSVG
              value={`${process.env.REACT_APP_FRONTEND_URL}/#/game/${gameId}/readyup`}
              size={400}
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
        <div className="w-1 bg-gradient-to-b from-yellow-400 via-purple-500 to-pink-600"></div>

        {/* Right section for Player List */}
        <div className="flex flex-1 flex-col justify-center items-center p-6">
          {/* Right Header */}
          <div className="text-center mb-8">
            <div className="text-xs font-semibold text-purple-200 mb-1 tracking-widest uppercase">
              Game Lobby
            </div>
            <div className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
              {players.length} Players Ready
            </div>
          </div>

          {/* Player List */}
          <div className="flex-1 w-full max-w-md flex flex-col min-h-0 mb-8">
            {players.length === 0 ? (
              <div className="text-center text-white text-xl opacity-60">
                Waiting for players...
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent">
                <ul className="space-y-4 pr-2">
                  {players.map((player, index) => (
                    <li
                      key={index}
                      className="flex items-center bg-white bg-opacity-10 backdrop-blur-lg border-2 border-white border-opacity-30 rounded-xl p-4"
                    >
                      <button
                        onClick={() => handleRemovePlayer(player.id)}
                        className="text-red-400 hover:text-red-300 cursor-pointer text-xl font-bold mr-4 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 bg-opacity-20 hover:bg-opacity-40 transition-all"
                      >
                        ×
                      </button>
                      <span className="flex-1 text-left text-white text-xl font-semibold">
                        {player.name}
                      </span>
                      <div className="w-3 h-3 bg-green-400 rounded-full ml-4"></div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Start Game Button */}
          {players.length > 0 && (
            <div className="mt-auto">
              <BigButton
                text="Start Game"
                onClick={() => navigate(`/game/${gameId}/gameboard`)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerList;
