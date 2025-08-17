import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import BigButton from "./BigButton";

const GameAction = () => {
  const { id: gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = React.useState(null);
  const [showNotification, setShowNotification] = React.useState(false);

  React.useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/games/${gameId}`
        );
        if (!response.ok) {
          throw new Error("Error fetching game");
        }
        const data = await response.json();
        setGame(data);
      } catch (error) {
        console.log(error.message);
      }
    };

    fetchGame();
  }, [gameId]);

  const deleteGame = (id) => {
    fetch(`${process.env.REACT_APP_API_URL}/games/${id}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Game deleted:", data);
        setShowNotification(true);
        setTimeout(() => {
          navigate("/gamelist");
        }, 1500);
      })

      .catch((error) => {
        console.error("Error deleting game:", error);
      });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {game && (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
          <h1 className="text-8xl md:text-9xl lg:text-[8rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 drop-shadow-2xl">
            {game.name}
          </h1>
          <ul className="space-y-8">
            <li>
              {
                <Link to={`/game/${game._id}/playerlist`}>
                  <BigButton text="Play Game" />
                </Link>
              }
            </li>
            <li>
              {
                <Link to={`/game/${game._id}/edit`}>
                  <BigButton text="Edit Game" />
                </Link>
              }
            </li>
            <li>
              <BigButton
                text="Delete Game"
                onClick={() => deleteGame(gameId)}
              />
            </li>
          </ul>
        </div>
      )}

      {showNotification && (
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-4 rounded-md shadow-lg">
          <p>Game deleted</p>
        </div>
      )}
    </div>
  );
};

export default GameAction;
