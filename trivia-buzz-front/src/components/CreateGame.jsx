import React from "react";
import { useNavigate } from "react-router-dom";
import BigButton from "./BigButton";

const CreateGame = () => {
  const [gameName, setGameName] = React.useState("");
  const [categoriesPerRound, setCategoriesPerRound] = React.useState(5);
  const [questionsPerCategory, setQuestionsPerCategory] = React.useState(5);
  const [rounds, setRounds] = React.useState(2);
  const [showNotification, setShowNotification] = React.useState(false);
  const [notificationStatus, setNotificationStatus] = React.useState("success"); // "success" or "error"
  const navigate = useNavigate();

  const createGame = async (gameData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameData),
      });

      if (!response.ok) {
        // If response is not ok, throw an error
        const errorData = await response.json();
        throw new Error(
          errorData.details || errorData.error || "Failed to create game"
        );
      }

      const data = await response.json();
      console.log("Game created:", data);

      // Success notification
      setNotificationStatus("success");
      setShowNotification(true);

      setTimeout(() => {
        setShowNotification(false);
        navigate(`/game/${data._id}/edit`);
      }, 1500);
    } catch (error) {
      console.error("Error creating game:", error);

      // Error notification
      setNotificationStatus("error");
      setShowNotification(true);

      // Hide error notification after 3 seconds (no navigation)
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }
  };

  // Create categories structure for API
  const createCategoriesStructure = () => {
    const categories = [];
    for (let round = 1; round <= rounds; round++) {
      for (let i = 0; i < categoriesPerRound; i++) {
        categories.push({
          name: `Category ${i + 1}`,
          description: "",
          round: round,
        });
      }
    }
    return categories;
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen h-full w-full overflow-y-auto space-y-8 p-6">
      {/* Section 1: Header */}
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
          CREATE GAME
        </h1>
        <p className="text-xl text-white opacity-80 font-light">
          Customize your game!
        </p>
      </div>

      {/* Section 2: Game Configuration Card */}
      <div className="w-full max-w-4xl bg-black bg-opacity-40 backdrop-blur-lg rounded-3xl border border-white border-opacity-20 shadow-2xl p-8">
        {/* Game Name */}
        <div className="mb-8">
          <label className="block text-white text-lg font-semibold mb-3 text-center">
            Game Name
          </label>
          <input
            type="text"
            placeholder="Enter your game name..."
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            className="w-full p-4 text-xl text-center bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-30 rounded-2xl text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
          />
        </div>

        {/* Configuration Grid */}
        <div className="flex flex-col gap-6">
          {/* Rounds */}
          <div className="group w-full">
            <label className="block text-white text-lg font-semibold mb-4 text-center group-hover:text-yellow-300 transition-colors duration-300">
              Rounds
            </label>
            <div className="relative bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRounds(value)}
                    className={`w-12 h-12 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-110 ${
                      rounds === value
                        ? "bg-white text-purple-600 shadow-lg scale-105"
                        : "bg-white bg-opacity-20 text-white hover:bg-opacity-30"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Categories per Round */}
          <div className="group w-full">
            <label className="block text-white text-lg font-semibold mb-4 text-center group-hover:text-yellow-300 transition-colors duration-300">
              Categories per Round
            </label>
            <div className="relative bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-600 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-center space-x-2 flex-wrap gap-y-2">
                {[3, 4, 5, 6, 7, 8].map((value) => (
                  <button
                    key={value}
                    onClick={() => setCategoriesPerRound(value)}
                    className={`w-12 h-12 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-110 ${
                      categoriesPerRound === value
                        ? "bg-white text-teal-600 shadow-lg scale-105"
                        : "bg-white bg-opacity-20 text-white hover:bg-opacity-30"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Questions per Category */}
          <div className="group w-full">
            <label className="block text-white text-lg font-semibold mb-4 text-center group-hover:text-yellow-300 transition-colors duration-300">
              Questions per Category
            </label>
            <div className="relative bg-gradient-to-br from-rose-400 via-pink-400 to-purple-500 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-center space-x-2 flex-wrap gap-y-2">
                {[3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    onClick={() => setQuestionsPerCategory(value)}
                    className={`w-12 h-12 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-110 ${
                      questionsPerCategory === value
                        ? "bg-white text-pink-600 shadow-lg scale-105"
                        : "bg-white bg-opacity-20 text-white hover:bg-opacity-30"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Game Summary */}
        <div className="mt-8 p-6 bg-gradient-to-br from-yellow-300 via-amber-300 to-orange-200 rounded-2xl shadow-xl">
          <h3 className="text-xl font-black text-gray-800 text-center mb-2">
            Game Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-gray-800">{rounds}</div>
              <div className="text-sm font-semibold text-amber-800 opacity-90">
                Rounds
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-800">
                {categoriesPerRound * rounds}
              </div>
              <div className="text-sm font-semibold text-amber-800 opacity-90">
                Total Categories
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-800">
                {questionsPerCategory * categoriesPerRound * rounds}
              </div>
              <div className="text-sm font-semibold text-amber-800 opacity-90">
                Total Questions
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-800">
                ~
                {Math.round(
                  (questionsPerCategory * categoriesPerRound * rounds) / 2
                )}
              </div>
              <div className="text-sm font-semibold text-amber-800 opacity-90">
                Minutes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Create Button */}
      <div>
        <BigButton
          text="Create Game"
          onClick={() =>
            createGame({
              name: gameName,
              questionTotal: questionsPerCategory * categoriesPerRound * rounds,
              categories: createCategoriesStructure(),
              rounds: rounds,
            })
          }
          disabled={!gameName.trim()}
        />
      </div>

      {/* Success/Error Notification */}
      {showNotification && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className={`px-8 py-4 rounded-2xl shadow-2xl border animate-bounce ${
              notificationStatus === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-500 border-green-400 text-white"
                : "bg-gradient-to-r from-red-500 to-red-600 border-red-400 text-white"
            }`}
          >
            <div className="flex items-center space-x-3">
              {notificationStatus === "success" ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              )}
              <span className="text-lg font-bold">
                {notificationStatus === "success"
                  ? "Game Created Successfully!"
                  : "Error Creating Game"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateGame;
