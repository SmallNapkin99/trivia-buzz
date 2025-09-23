import React from "react";
import { useNavigate } from "react-router-dom";
import BigButton from "./BigButton";

const GameList = () => {
  const navigate = useNavigate();
  const [games, setGames] = React.useState([]);

  React.useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/games`);
        if (!response.ok) {
          throw new Error("Error fetching games");
        }
        const data = await response.json();
        setGames(data);
      } catch (error) {
        console.log(error.message);
      }
    };

    fetchGames();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen h-full overflow-y-auto space-y-8">
      <h1 className="text-8xl md:text-9xl lg:text-[8rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 drop-shadow-2xl">
        Games
      </h1>
      <ul className="space-y-16">
        {games &&
          games.map((game) => (
            <li key={game._id}>
              {
                <BigButton
                  text={game.name}
                  onClick={() => navigate(`/game/${game._id}`)}
                />
              }
            </li>
          ))}
      </ul>
    </div>
  );
};

export default GameList;
