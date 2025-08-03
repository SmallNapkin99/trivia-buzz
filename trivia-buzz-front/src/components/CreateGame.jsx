import React from "react";
import { useNavigate } from "react-router-dom";
import BigButton from "./BigButton";

const CreateGame = () => {
  const [gameName, setGameName] = React.useState("");
  const [categoriesPerRound, setCategoriesPerRound] = React.useState(5);
  const [questionsPerCategory, setQuestionsPerCategory] = React.useState(5);
  const [rounds, setRounds] = React.useState(2);
  const [categories, setCategories] = React.useState({
    0: [
      { name: "", description: "", round: 1 },
      { name: "", description: "", round: 1 },
      { name: "", description: "", round: 1 },
      { name: "", description: "", round: 1 },
      { name: "", description: "", round: 1 },
    ],
    1: [
      { name: "", description: "", round: 2 },
      { name: "", description: "", round: 2 },
      { name: "", description: "", round: 2 },
      { name: "", description: "", round: 2 },
      { name: "", description: "", round: 2 },
    ],
  });
  const [showNotification, setShowNotification] = React.useState(false);
  const navigate = useNavigate();

  const createGame = async (gameData) => {
    fetch(`${process.env.REACT_APP_API_URL}/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gameData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Game created:", data);
        setShowNotification(true);
        setTimeout(() => {
          navigate(`/game/${data._id}/edit`);
        }, 1500);
      })

      .catch((error) => {
        console.error("Error creating game:", error);
      });
  };

  const handleRoundsChange = (value) => {
    if (value > rounds) {
      const newCategories = [];
      for (let i = 0; i < categoriesPerRound; i++) {
        newCategories.push({ name: "", description: "", round: value });
      }
      setCategories((prevCategories) => ({
        ...prevCategories,
        [value - 1]: newCategories,
      }));
    } else if (value < rounds) {
      setCategories((prevCategories) => {
        const newCategories = { ...prevCategories };
        delete newCategories[value];
        return newCategories;
      });
    }
    setRounds(value);
  };

  const handleCategoriesPerRoundChange = (value) => {
    setCategories((prevCategories) => {
      const newCategories = { ...prevCategories };
      if (value > categoriesPerRound) {
        for (let key in newCategories) {
          for (let i = 0; i < value - newCategories[key].length; i++) {
            newCategories[key].push({
              name: "",
              description: "",
              round: Number(key),
            });
          }
        }
      } else if (value < categoriesPerRound) {
        for (let key in categories) {
          newCategories[key].splice(value);
        }
      }
      return newCategories;
    });
    setCategoriesPerRound(value);
  };

  const handleCategoryChange = (roundIndex, categoryIndex, field, value) => {
    setCategories((prevCategories) => {
      const newCategories = { ...prevCategories };
      newCategories[roundIndex][categoryIndex][field] = value;
      return newCategories;
    });
  };
  return (
    <div className="flex flex-col items-center justify-start min-h-screen h-full w-full overflow-y-auto space-y-12 p-8">
      <h1 className="font-sans font-extrabold text-6xl text-shadows">
        Create Game
      </h1>
      {/* Input Row */}
      <div className="flex flex-row justify-between w-full max-w-5xl space-x-8">
        <div className="flex flex-col items-center w-1/4">
          <label className="font-medium text-yellow-500 text-lg text-center mb-2">
            Game Name
          </label>
          <input
            type="text"
            placeholder="Enter name"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            className="p-4 text-xl text-center w-full rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col items-center w-1/4">
          <label className="font-medium text-yellow-500 text-lg text-center mb-2">
            Rounds
          </label>
          <input
            type="number"
            value={rounds}
            step={1}
            onChange={(e) => handleRoundsChange(Number(e.target.value))}
            className="p-4 text-xl text-center w-full rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col items-center w-1/4">
          <label className="font-medium text-yellow-500 text-lg text-center mb-2">
            Categories per Round
          </label>
          <input
            type="number"
            value={categoriesPerRound}
            step={1}
            onChange={(e) =>
              handleCategoriesPerRoundChange(Number(e.target.value))
            }
            className="p-4 text-xl text-center w-full rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col items-center w-1/4">
          <label className="font-medium text-yellow-500 text-lg text-center mb-2">
            Questions per Category
          </label>
          <input
            type="number"
            value={questionsPerCategory}
            onChange={(e) => setQuestionsPerCategory(Number(e.target.value))}
            className="p-4 text-xl text-center w-full rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {/* Rounds and Categories */}
      {Array.from({ length: rounds }).map((_, roundIndex) => (
        <div key={roundIndex} className="w-full max-w-5xl space-y-4">
          {/* Round Title */}
          <h2 className="text-2xl font-bold text-center text-yellow-500">
            Round {roundIndex + 1} Categories
          </h2>
          {/* Categories Row */}
          <div className="flex flex-row justify-between space-x-4">
            {Array.from({ length: categoriesPerRound }).map(
              (_, categoryIndex) => (
                <div
                  key={categoryIndex}
                  className="flex flex-col items-center w-1/5"
                >
                  <input
                    type="text"
                    placeholder={`Category Name`}
                    value={categories[roundIndex]?.[categoryIndex]?.name || ""}
                    onChange={(e) =>
                      handleCategoryChange(
                        roundIndex,
                        categoryIndex,
                        "name",
                        e.target.value
                      )
                    }
                    className="p-2 text-lg text-center w-full rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder={`Category Description`}
                    value={
                      categories[roundIndex]?.[categoryIndex]?.description || ""
                    }
                    onChange={(e) =>
                      handleCategoryChange(
                        roundIndex,
                        categoryIndex,
                        "description",
                        e.target.value
                      )
                    }
                    className="mt-2 p-2 text-lg text-center w-full rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )
            )}
          </div>
        </div>
      ))}
      <div className="flex justify-center">
        <BigButton
          text="Create Game"
          onClick={() =>
            createGame({
              name: gameName,
              questionTotal: questionsPerCategory * categoriesPerRound * rounds,
              categories: Object.values(categories).flat(),
              rounds: rounds,
            })
          }
        />
      </div>

      {showNotification && (
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-4 rounded-md shadow-lg">
          <p>Game created</p>
        </div>
      )}
    </div>
  );
};

export default CreateGame;
