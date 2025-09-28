import React from "react";
import { useWebSocket } from "./WebSocketContext";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import BigButton from "./BigButton";

const FinalTriviaInput = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: gameId } = useParams();
  const { playerId } = location.state || {};
  const socket = useWebSocket();
  const [player, setPlayer] = React.useState(null);
  const [wager, setWager] = React.useState(0);
  const [wagerSubmitted, setWagerSubmitted] = React.useState(false);
  const [finalAnswer, setFinalAnswer] = React.useState("");
  const [finalAnswerSubmitted, setFinalAnswerSubmitted] = React.useState(false);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    if (socket) {
      //set socket listener
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        //set listener to set player state
        if (data.action === "set_player_list") {
          const { players: playerList } = data;
          const currentPlayer = playerList.find((p) => p.id === playerId);
          setPlayer(currentPlayer);
        }
        //handle score updates
        if (data.action === "update_score") {
          const { playerId: updatedPlayerId, newScore } = data;
          if (updatedPlayerId === playerId) {
            setPlayer((prevPlayer) => ({ ...prevPlayer, score: newScore }));
          }
        }
        if (data.action === "game_ended") {
          const { gameId } = data;
          //navigate to game end screen
          navigate(`/game/${gameId}/endgame`);
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

  const handleWagerSubmit = () => {
    if (socket && playerId && wager > 0) {
      //check if it's a whole number and if the wager is not more than the player's score
      if (!Number.isInteger(Number(wager)) || Number(wager) < 0) {
        alert("Please enter a valid whole number for your wager.");
        return;
      }
      if (Number(wager) > Math.abs(player.score)) {
        alert(`Your wager cannot exceed ${Math.abs(player.score)} points.`);
        return;
      }
      socket.send(
        JSON.stringify({
          action: "submit_wager",
          pointWager: parseInt(wager, 10),
          playerId: playerId,
        })
      );
      setWagerSubmitted(true);
    }
  };

  const handleFinalAnswerSubmit = async () => {
    if (socket && playerId && finalAnswer.trim() !== "") {
      //make API call to submit final answer
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/games/${gameId}/check-final-answer`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userAnswer: finalAnswer,
              playerId: playerId,
            }),
          }
        );
        if (!response.ok) {
          throw new Error("Error checking answer");
        }
        const data = await response.json();

        //call socket to submit final answer
        socket.send(
          JSON.stringify({
            action: "submit_final_answer",
            playerId: playerId,
            wager: parseInt(wager, 10),
            correct: data.isCorrect,
          })
        );

        setFinalAnswerSubmitted(true);
      } catch (error) {
        console.log(error.message);
      }
    }
  };

  return (
    <div
      className="flex flex-col min-h-0 items-center justify-between pt-safe pb-safe overflow-hidden"
      style={{ height: "100svh" }}
    >
      <div className="relative z-10 flex flex-col h-full w-full">
        {/* Player Name Header */}
        <div className="relative bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 shadow-2xl">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative px-6 py-8 text-center">
            <div className="text-xs font-semibold text-yellow-900 mb-1 tracking-widest uppercase">
              Final Trivia!
            </div>
            <div className="text-4xl md:text-5xl font-black text-black drop-shadow-lg">
              {player?.name || "Loading..."}
            </div>
          </div>
          {/* Decorative bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 to-pink-600"></div>
        </div>

        {/* Input Area */}
        <div className="flex-1 flex items-center justify-center p-4">
          {!wagerSubmitted ? (
            <div className="w-full max-w-md space-y-14 text-center">
              <h1 className="text-4xl text-white">Wager</h1>
              <input
                type="text"
                placeholder="Enter your wager"
                value={wager}
                onChange={(e) => setWager(e.target.value)}
                onBlur={() => window.scrollTo(0, 0)}
                className="p-6 text-2xl text-center bg-white bg-opacity-10 backdrop-blur-lg border-4 border-white border-opacity-30 rounded-3xl text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 shadow-2xl"
                style={{
                  boxShadow:
                    "0 0 30px rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(0,0,0,0.2)",
                }}
              />
              <BigButton text="Submit Wager" onClick={handleWagerSubmit} />
            </div>
          ) : finalAnswerSubmitted ? (
            <div className="text-center">
              <h1 className="text-4xl text-white">Final Answer Submitted</h1>
              <p className="text-2xl text-white mt-4">Calculating scores...</p>
            </div>
          ) : (
            <div className="w-full max-w-md space-y-14 text-center">
              <h1 className="text-4xl text-white">Final Answer</h1>
              <input
                type="text"
                placeholder="Enter your answer"
                value={finalAnswer}
                onChange={(e) => setFinalAnswer(e.target.value)}
                onBlur={() => window.scrollTo(0, 0)}
                className="p-6 text-2xl text-center bg-white bg-opacity-10 backdrop-blur-lg border-4 border-white border-opacity-30 rounded-3xl text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 shadow-2xl"
                style={{
                  boxShadow:
                    "0 0 30px rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(0,0,0,0.2)",
                }}
              />
              <BigButton
                text="Submit Final Answer"
                onClick={handleFinalAnswerSubmit}
              />
            </div>
          )}
        </div>

        {/* Score Footer */}
        <div className="relative bg-inherit">
          <div className="absolute inset-0"></div>
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
    </div>
  );
};

export default FinalTriviaInput;
