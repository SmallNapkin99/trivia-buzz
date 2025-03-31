import React from "react";
import { Link } from "react-router-dom";
import BigButton from "./BigButton";

const GameList = () => {
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
      <h1 className="font-sans font-extrabold text-6xl text-shadows">Games</h1>
      <ul className="space-y-16">
        {games &&
          games.map((game) => (
            <li key={game._id}>
              {
                <Link to={`/game/${game._id}`}>
                  <BigButton text={game.name} />
                </Link>
              }
            </li>
          ))}
      </ul>
    </div>
  );
};

export default GameList;
