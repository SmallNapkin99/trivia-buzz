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
  const [players, setPlayers] = React.useState([]);
  const [buzzedPlayer, setBuzzedPlayer] = React.useState(null);
  const [currentRound, setCurrentRound] = React.useState(1);
  const [focusedCategory, setFocusedCategory] = React.useState(null);
  const [focusedQuestion, setFocusedQuestion] = React.useState(null);
  const [answeredQuestions, setAnsweredQuestions] = React.useState([]);

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
    if (roundQuestions.length === answeredQuestions.length + 1 / currentRound) {
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
      {/* Players */}
      <div className="flex justify-center items-stretch gap-4 w-full">
        {players.map((player, idx) => (
          <div
            key={idx}
            className={`font-bold px-6 py-3 rounded-3xl shadow-md flex items-center justify-center w-[150px] truncate border-4 border-yellow-500 transition ${
              buzzedPlayer?.id !== player.id
                ? "bg-transparent text-yellow-500"
                : "bg-yellow-500 text-purple-700"
            }`}
          >
            <div className="text-center flex-grow">
              <p className="text-xl whitespace-normal">{player.name}</p>
              <p className="text-2xl">{player.score}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Game Grid */}
      {game && (
        <div className="flex justify-center w-full">
          <div
            className="grid gap-6 w-full max-w-screen-xl"
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
                  className="text-4xl font-bold text-yellow-400 p-3 rounded-md cursor-pointer"
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
                        className="text-2xl font-bold text-center text-yellow-400 p-3 rounded-md w-full cursor-pointer transition flex items-center justify-center h-full animate-fadeIn"
                        onClick={() => handleCategoryClick(category)}
                      >
                        {category.name}
                      </h3>
                    </div>
                  ))}
              </div>
            )}

            {/* Horizontal Line */}
            <div className="col-span-full border-t-2 border-yellow-400 w-full mb-4" />

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
              game.categories
                .filter((cat) => cat.round === currentRound)
                .map((category, idx) => (
                  <div key={idx} className="flex flex-col items-center w-full">
                    <div className="space-y-10 w-full">
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
                            className={`transition-all duration-500 ${
                              answeredQuestions.includes(question._id)
                                ? "opacity-0 pointer-events-none"
                                : ""
                            }`}
                            onClick={() => handleQuestionClick(question)}
                          >
                            <div className="flex items-center justify-center w-full text-center p-6 bg-yellow-500 text-purple-800 font-bold rounded-3xl hover:bg-yellow-300 cursor-pointer animate-fadeIn">
                              <h4 className="text-xl">{`${
                                question.value * currentRound
                              }`}</h4>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
