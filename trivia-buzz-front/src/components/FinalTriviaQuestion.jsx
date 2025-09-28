import React from "react";
import { useWebSocket } from "./WebSocketContext";
import { useNavigate, useParams } from "react-router-dom";
import { CountdownCircleTimer } from "react-countdown-circle-timer";

const FinalTriviaQuestion = () => {
  const socket = useWebSocket();
  const navigate = useNavigate();
  const { id: gameId } = useParams();
  const [game, setGame] = React.useState(null);
  const [wagersSubmitted, setWagersSubmitted] = React.useState(false);
  const [finalAnswersSubmitted, setFinalAnswersSubmitted] =
    React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(null);
  const [imageModalOpen, setImageModalOpen] = React.useState(false);
  const [modalImage, setModalImage] = React.useState(null);
  const [questionState, setQuestionState] = React.useState("question");
  const [timerKey, setTimerKey] = React.useState(0);
  const [isTimerActive, setIsTimerActive] = React.useState(false);
  const [players, setPlayers] = React.useState([]);

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
        console.log("Fetched game:", data);
        setGame(data);
      } catch (error) {
        console.log(error.message);
      }
    };
    fetchGame();
  }, [gameId]);

  React.useEffect(() => {
    if (game?.finalTrivia?.imageId) {
      setImageSrc(
        `${process.env.REACT_APP_API_URL}/images/${game.finalTrivia.imageId}`
      );
    }
    if (socket) {
      //set socket listener
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        //handle set wagers submitted
        if (data.action === "wagers_submitted") {
          setWagersSubmitted(true);
          setIsTimerActive(true);
        }
        //handle set final answers submitted
        if (data.action === "final_answers_submitted") {
          setFinalAnswersSubmitted(true);
          setPlayers(data.players || []);
          setIsTimerActive(false);
        }
      };
    } else {
      console.log("WebSocket is not connected");
    }

    return () => {
      //clear listener on unmount
      if (socket) {
        socket.onmessage = null;
      }
    };
  }, [socket, game]);

  const handleQuestionClick = () => {
    if (questionState === "question") {
      if (!finalAnswersSubmitted || !game.finalTrivia) {
        return;
      } else {
        setQuestionState("answer");
      }
    } else {
      setQuestionState("question");
      setTimerKey((prev) => prev + 1);
      setIsTimerActive(true);
    }
  };

  const handleImageClick = (image) => {
    setModalImage(image);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
  };

  const handlePodiumClick = () => {
    navigate(`/game/${gameId}/podium`, { state: { players: players } });
  };

  const handleTimerComplete = () => {
    setIsTimerActive(false);
    //all players that have not yet answered are marked as incorrect
    if (socket) {
      socket.send(
        JSON.stringify({
          action: "final_trivia_time_up",
          gameId: gameId,
        })
      );
    }
    setFinalAnswersSubmitted(true);
    return { shouldRepeat: false };
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen h-full w-full overflow-y-auto space-y-8 p-6">
      <h1 className="text-8xl font-bold bg-gradient-to-r text-transparent bg-clip-text from-yellow-400 via-amber-400 to-amber-600">
        FINAL TRIVIA
      </h1>
      {/* Horizontal Line */}
      <div className="w-full col-span-full mb-4">
        <div className="w-full h-1 bg-gradient-to-r from-pink-600 via-yellow-400 to-purple-600 relative"></div>
      </div>

      <div
        className="h-full relative flex items-center justify-center w-full text-center p-6 font-bold rounded-3xl cursor-pointer bg-yellow-500 text-purple-800"
        onClick={() => handleQuestionClick()}
      >
        {/* Fullscreen Image Modal */}
        {imageModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center cursor-zoom-out"
            onClick={() => closeImageModal()}
          >
            <img
              src={modalImage}
              alt="Zoomed"
              className="max-w-[90%] max-h-[90%] object-contain rounded-2xl"
            />
          </div>
        )}

        {questionState === "question" ? (
          <>
            {/* Question Text */}
            {wagersSubmitted && (
              <h4 className="text-3xl max-w-[80%] animate-fadeIn">{`${game?.finalTrivia?.question}`}</h4>
            )}

            {/* Timer in Top Right */}
            {wagersSubmitted && isTimerActive && (
              <div className="absolute top-4 right-4">
                <CountdownCircleTimer
                  key={timerKey}
                  isPlaying={isTimerActive}
                  duration={30}
                  colors={["#10B981", "#F59E0B", "#EF4444", "#DC2626"]}
                  colorsTime={[30 * 0.6, 30 * 0.4, 30 * 0.2, 0]}
                  size={80}
                  strokeWidth={6}
                  onComplete={handleTimerComplete}
                >
                  {({ remainingTime }) => (
                    <div className="text-white text-sm font-bold">
                      {remainingTime}
                    </div>
                  )}
                </CountdownCircleTimer>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center max-h-[65vh] overflow-hidden animate-fadeIn">
            <h4 className="text-3xl mb-4">{`${game?.finalTrivia?.answer}`}</h4>
            {imageSrc && (
              <div className="flex justify-center items-center w-full h-full">
                <img
                  src={imageSrc}
                  alt="answer_image"
                  className="max-w-[70%] max-h-[calc(65vh-2rem)] object-contain cursor-zoom-in rounded-2xl"
                  onClick={() => handleImageClick(imageSrc)}
                />
              </div>
            )}
            {/* button to go to Podium */}
            <button
              onClick={handlePodiumClick}
              className="mt-8 px-6 py-3 bg-purple-700 text-white text-xl font-bold rounded-full hover:bg-purple-800 transition-colors duration-300 shadow-lg"
              disabled={!finalAnswersSubmitted}
            >
              Podium
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalTriviaQuestion;
