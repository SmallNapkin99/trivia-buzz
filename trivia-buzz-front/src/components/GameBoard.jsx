import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWebSocket } from "./WebSocketContext";
import QCard from "./QCard";

const GameBoard = () => {
  const { id: gameId } = useParams();
  const socket = useWebSocket();
  const navigate = useNavigate();
  const [game, setGame] = React.useState(null);
  const [questions, setQuestions] = React.useState([]);
  const [players, setPlayers] = React.useState([
    { name: "TEST1", id: 1, score: 0 },
    { name: "TEST2", id: 2, score: 0 },
    { name: "TEST3", id: 3, score: 0 },
    { name: "TEST4", id: 4, score: 0 },
    { name: "TEST5", id: 5, score: 0 },
    { name: "TEST6", id: 6, score: 0 },
    { name: "TEST7", id: 7, score: 0 },
    { name: "TEST8", id: 8, score: 0 },
    { name: "TEST9", id: 9, score: 0 },
    { name: "TEST10", id: 10, score: 0 },
    { name: "TEST11", id: 11, score: 0 },
  ]);
  const [buzzedPlayer, setBuzzedPlayer] = React.useState(null);
  const [currentRound, setCurrentRound] = React.useState(1);
  const [focusedCategory, setFocusedCategory] = React.useState(null);
  const [focusedQuestion, setFocusedQuestion] = React.useState(null);
  const [answeredQuestions, setAnsweredQuestions] = React.useState([]);
  const [screenWidth, setScreenWidth] = React.useState(1200);

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
        return data;
      } catch (error) {
        console.log(error.message);
      }
    };
    const fetchQuestions = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/questions/${gameId}`
        );
        if (!response.ok) {
          throw new Error("Error fetching questions");
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.log(error.message);
      }
    };
    const setDailyDoubles = (questions, game) => {
      for (let round = 1; round <= game.rounds; round++) {
        const roundQuestions = questions.filter((q) => q.round === round);

        const roundCategories = game.categories
          .filter((cat) => cat.round === round)
          .map((cat) => cat.name);

        let dailyDoubleCategories = [];
        while (dailyDoubleCategories.length < 2 && roundCategories.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * roundCategories.length
          );
          const selectedCategory = roundCategories[randomIndex];
          if (!dailyDoubleCategories.includes(selectedCategory)) {
            dailyDoubleCategories.push(selectedCategory);
          }
        }
        for (const category of dailyDoubleCategories) {
          const categoryQuestions = roundQuestions.filter(
            (q) => q.category === category
          );

          if (categoryQuestions.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * categoryQuestions.length
            );
            const selectedQuestion = categoryQuestions[randomIndex];

            selectedQuestion.double = true;
            setQuestions((prevQuestions) =>
              prevQuestions.map((q) =>
                q._id === selectedQuestion._id ? selectedQuestion : q
              )
            );
          }
        }
      }
    };

    // const fetchData = async () => {
    //   const gameData = await fetchGame();
    //   const questionsData = await fetchQuestions();
    //   if (questionsData.length < gameData.questionTotal) {
    //     alert(
    //       `There are ${
    //         gameData.questionTotal - questionsData.length
    //       } questions missing. Rerouting to edit page.`
    //     );
    //     navigate(`/game/${gameId}/edit`);
    //   } else {
    //     setGame(gameData);
    //     setQuestions(questionsData);
    //     setDailyDoubles(questionsData, gameData);
    //   }
    // };

    const fetchData = async () => {
      const gameData = await fetchGame();
      const questionsData = await fetchQuestions();
      setGame(gameData);
      setQuestions(questionsData);
      setDailyDoubles(questionsData, gameData);
    };
    fetchData();
  }, [gameId]);

  const handleCloseBuzzers = React.useCallback(() => {
    if (socket) {
      socket.send(
        JSON.stringify({
          action: "close_buzzers",
        })
      );
    }
  }, [socket]);

  const handleOpenBuzzers = () => {
    if (socket) {
      socket.send(
        JSON.stringify({
          action: "open_buzzers",
        })
      );
    }
  };

  React.useEffect(() => {
    const buzzedInSound = new Audio("/buzzed_in.mp3");
    //set socket listener
    if (socket) {
      handleCloseBuzzers();
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        //set listener to set player state
        if (data.action === "set_player_list") {
          const { players: playerList } = data;
          setPlayers(playerList);
        }
        if (data.action === "set_answered_questions") {
          console.log("Answered questions: ", data.questions);
          const { questions } = data;
          setAnsweredQuestions(questions);
        }
        if (data.action === "buzzed_in") {
          buzzedInSound.play();
          const { playerId } = data;
          setPlayers((prevPlayers) => {
            const player = prevPlayers.find((player) => player.id === playerId);
            if (player) {
              setBuzzedPlayer(player);
            }
            return prevPlayers;
          });
        }
      };
      //send ws message to get signify game start
      socket.send(
        JSON.stringify({
          action: "start_game",
        })
      );
      //send ws message to get player list
      socket.send(
        JSON.stringify({
          action: "get_players",
        })
      );
      //send ws message to get answered questions
      socket.send(
        JSON.stringify({
          action: "get_answered_questions",
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
  }, [socket, handleCloseBuzzers]);

  React.useEffect(() => {
    const updateScreenWidth = () => setScreenWidth(window.innerWidth);
    updateScreenWidth();
    window.addEventListener("resize", updateScreenWidth);
    return () => window.removeEventListener("resize", updateScreenWidth);
  }, []);

  // Calculate if we need conveyor belt
  const cardWidth = 176; // 160px width + 16px gap
  const headerPadding = 48; // Account for container padding
  const availableWidth = screenWidth - headerPadding;
  const totalCardsWidth = cardWidth * players.length;
  const needsConveyorBelt = totalCardsWidth > availableWidth;

  // For conveyor belt, create enough copies to ensure seamless scrolling
  const copiesNeeded = Math.ceil((availableWidth * 2) / totalCardsWidth) + 1;
  const displayPlayers = needsConveyorBelt
    ? Array(copiesNeeded).fill(players).flat()
    : players;

  const updateScore = (scoreUpdate) => {
    if (!buzzedPlayer) {
      return;
    }
    const _newScore = buzzedPlayer.score + scoreUpdate;
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === buzzedPlayer.id
          ? { ...player, score: player.score + scoreUpdate }
          : player
      )
    );
    if (socket) {
      socket.send(
        JSON.stringify({
          action: "score_update",
          playerId: buzzedPlayer.id,
          newScore: _newScore,
        })
      );
    }
    setBuzzedPlayer(null);
  };

  const handleEndGame = () => {
    console.log("Ending game...");
    if (socket) {
      socket.send(
        JSON.stringify({
          action: "end_game",
        })
      );
    }
    //navigate to podium
    navigate(`/game/${gameId}/podium`, { state: { players } });
  };

  const handleCategoryClick = (category) => {
    setFocusedCategory((prev) =>
      prev === category.name ? null : category.name
    );
    setFocusedQuestion((prev) =>
      prev === category.sampleQuestion ? null : category.sampleQuestion
    );
  };

  const handleQuestionClick = (question) => {
    setFocusedQuestion((prev) => {
      if (prev === question) {
        return null;
      }
      if ("value" in question) {
        return { ...question, value: question.value * currentRound };
      }
      return question;
    });
    setFocusedCategory((prev) =>
      prev === question.category ? null : question.category
    );
  };

  const handleAnswerQuestion = (questionId) => {
    const roundQuestions = questions.filter((q) => q.round === currentRound);
    if (
      roundQuestions.length ===
      (answeredQuestions.length + 1) / currentRound
    ) {
      if (currentRound === game.rounds) {
        handleEndGame();
      } else {
        setCurrentRound((prev) => prev + 1);
      }
    }
    if (!buzzedPlayer) {
      return;
    } else {
      //send ws message to update answered questions
      socket.send(
        JSON.stringify({
          action: "question_answered",
          questionId: questionId,
        })
      );
      setAnsweredQuestions((prev) => [...prev, questionId]);
      setFocusedQuestion(null);
      setFocusedCategory(null);
      handleCloseBuzzers();
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen h-full w-full overflow-y-auto space-y-8 p-6">
      {/* Players Section */}
      <div className="w-screen -m-6">
        {/* Header with Player Cards */}
        <div className="relative bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 overflow-hidden">
          <div className="absolute inset-0"></div>
          <div className="relative py-6">
            {/* Show buzzed player in center if exists */}
            {buzzedPlayer ? (
              <div className="flex justify-center items-center">
                <div className="font-bold px-6 py-4 rounded-2xl shadow-lg flex items-center justify-center w-[160px] border-4 bg-gradient-to-br from-purple-600 to-pink-600 border-pink-400 text-white">
                  <div className="text-center flex-grow">
                    <p className="text-2xl font-bold truncate mb-1">
                      {buzzedPlayer.name}
                    </p>
                    <p className="text-xl font-black">
                      {buzzedPlayer.score?.toLocaleString() || 0}
                      <span className="text-sm ml-1 opacity-70">pts</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : needsConveyorBelt ? (
              /* Conveyor belt animation when too many players */
              <div
                className="relative flex items-center justify-center overflow-hidden"
                style={{ height: "104px" }}
              >
                <div
                  className="flex items-center gap-4"
                  style={{
                    animation: `scroll ${
                      totalCardsWidth / 60
                    }s linear infinite`,
                    width: "max-content",
                  }}
                >
                  {displayPlayers.map((player, idx) => (
                    <div
                      key={`conveyor-${idx}`}
                      className="font-bold px-6 py-4 rounded-2xl shadow-lg flex items-center justify-center w-[160px] border-4 bg-white bg-opacity-20 backdrop-blur-lg border-white border-opacity-40 text-black flex-shrink-0"
                    >
                      <div className="text-center flex-grow">
                        <p className="text-2xl font-bold truncate mb-1">
                          {player.name}
                        </p>
                        <p className="text-xl font-black">
                          {player.score?.toLocaleString() || 0}
                          <span className="text-sm ml-1 opacity-70">pts</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Static centered display when players fit on screen */
              <div
                className="flex items-center justify-center gap-4 px-6"
                style={{ height: "104px" }}
              >
                {players.map((player) => (
                  <div
                    key={`static-${player.id}`}
                    className="font-bold px-6 py-4 rounded-2xl shadow-lg flex items-center justify-center w-[160px] border-4 bg-white bg-opacity-20 backdrop-blur-lg border-white border-opacity-40 text-black flex-shrink-0"
                  >
                    <div className="text-center flex-grow">
                      <p className="text-2xl font-bold truncate mb-1">
                        {player.name}
                      </p>
                      <p className="text-xl font-black">
                        {player.score?.toLocaleString() || 0}
                        <span className="text-sm ml-1 opacity-70">pts</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Decorative bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 to-pink-600"></div>
        </div>

        {/* Conveyor Belt Animation */}
        {needsConveyorBelt && (
          <style jsx>{`
            @keyframes scroll {
              0% {
                transform: translateX(0px);
              }
              100% {
                transform: translateX(-${totalCardsWidth}px);
              }
            }
          `}</style>
        )}
      </div>

      {/* Game Grid */}
      {game && (
        <div className="flex justify-center w-full">
          <div
            className="grid gap-6 w-full max-w-screen-xl mt-6"
            style={{
              gridTemplateColumns: `repeat(${
                game.categories.filter((cat) => cat.round === currentRound)
                  .length
              }, 1fr)`,
              gridTemplateRows: `auto auto 1fr`,
            }}
          >
            {/* Categories */}
            {focusedCategory ? (
              <div className="col-span-full flex items-center justify-center h-[80px] animate-fadeIn">
                <h3
                  className="text-4xl font-bold text-transparent bg-gradient-to-r from-yellow-400 via-yellow-400 to-yellow-400 hover:from-pink-600 hover:via-yellow-400 hover:to-purple-600 bg-clip-text p-3 rounded-md cursor-pointer transition-all duration-300"
                  onClick={() => handleCategoryClick(focusedCategory)}
                >
                  {focusedCategory}
                </h3>
              </div>
            ) : (
              <div className="col-span-full flex items-center justify-between h-[80px]">
                {game.categories
                  .filter((cat) => cat.round === currentRound)
                  .map((category, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center w-full"
                    >
                      <h3
                        className="text-2xl font-bold text-center text-transparent bg-gradient-to-r from-yellow-400 via-yellow-400 to-yellow-400 hover:from-pink-600 hover:via-yellow-400 hover:to-purple-600 bg-clip-text p-3 rounded-md w-full cursor-pointer transition-all duration-300 flex items-center justify-center h-full animate-fadeIn"
                        onClick={() => handleCategoryClick(category)}
                      >
                        {category.name}
                      </h3>
                    </div>
                  ))}
              </div>
            )}

            {/* Horizontal Line */}
            <div className="col-span-full flex items-center justify-center mb-4">
              <div className="w-full h-1 bg-gradient-to-r from-pink-600 via-yellow-400 to-purple-600 relative"></div>
            </div>

            {/* Questions */}
            {focusedQuestion ? (
              <div
                className="col-span-full flex h-full justify-center min-h-[65vh] animate-fadeIn"
                style={{
                  gridRow: "3 / 4",
                }}
              >
                <QCard
                  question={focusedQuestion}
                  onAnswer={() => handleAnswerQuestion(focusedQuestion._id)}
                  onCloseBuzzers={() => handleCloseBuzzers()}
                  onOpenBuzzers={() => handleOpenBuzzers()}
                  onScoreUpdate={(scoreUpdate) => updateScore(scoreUpdate)}
                  socket={socket}
                />
              </div>
            ) : (
              <div
                className="col-span-full min-h-[65vh]"
                style={{
                  gridRow: "3 / 4",
                  display: "grid",
                  gridTemplateColumns: `repeat(${
                    game.categories.filter((cat) => cat.round === currentRound)
                      .length
                  }, 1fr)`,
                  gap: "1.5rem",
                }}
              >
                {game.categories
                  .filter((cat) => cat.round === currentRound)
                  .map((category, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center w-full h-full"
                    >
                      <div className="space-y-10 w-full h-full flex flex-col justify-center">
                        {questions
                          .filter(
                            (q) =>
                              q.round === currentRound &&
                              q.category === category.name
                          )
                          .sort((a, b) => a.value - b.value)
                          .map((question, idx) => (
                            <div
                              key={idx}
                              className={`transition-all duration-500 flex-1 ${
                                answeredQuestions.includes(question._id)
                                  ? "opacity-0 pointer-events-none"
                                  : ""
                              }`}
                              onClick={() => handleQuestionClick(question)}
                            >
                              <div className="p-1 bg-gradient-to-r from-pink-600 via-yellow-400 to-purple-600 rounded-3xl hover:from-pink-700 hover:via-yellow-500 hover:to-purple-700 transition-all duration-300 ease-in-out">
                                <div className="flex items-center justify-center w-full h-full text-center p-6 bg-amber-400 bg-opacity-80 backdrop-blur-lg text-black rounded-3xl hover:bg-yellow-300 cursor-pointer animate-fadeIn">
                                  <h4 className="text-xl">
                                    {question.value * currentRound}
                                  </h4>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
