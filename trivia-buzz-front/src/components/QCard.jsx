import React from "react";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { LockOpenIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { XCircleIcon } from "@heroicons/react/24/solid";

const QCard = ({
  question,
  onAnswer,
  onCloseBuzzers,
  onOpenBuzzers,
  onScoreUpdate,
  socket,
}) => {
  const [questionState, setQuestionState] = React.useState("question");
  const [questionLocked, setQuestionLocked] = React.useState(true);
  const [isDailyDouble, setIsDailyDouble] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(null);
  const [imageModalOpen, setImageModalOpen] = React.useState(false);
  const [modalImage, setModalImage] = React.useState(null);
  const [isBuzzedPlayer, setIsBuzzedPlayer] = React.useState(false);

  const openBuzzerSound = new Audio("/open_buzzers.mp3");
  const rightAnswerSound = new Audio("/correct_answer.mp3");
  const wrongAnswerSound = new Audio("/wrong_answer.mp3");

  React.useEffect(() => {
    if (question?.imageId) {
      setImageSrc(
        `${process.env.REACT_APP_API_URL}/images/${question.imageId}`
      );
    }
    if (question?.double) {
      const dailyDoubleSound = new Audio("/daily_double.mp3");
      dailyDoubleSound.play();
      setIsDailyDouble(true);
    }
  }, [question]);

  React.useEffect(() => {
    //set socket listener
    if (socket) {
      //message handler
      const handleMessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.action === "buzzed_in") {
          setIsBuzzedPlayer(true);
        }
      };
      socket.addEventListener("message", handleMessage);
      //clean up listener on unmount
      return () => {
        socket.removeEventListener("message", handleMessage);
      };
    }
  }, [socket]);

  const handleQuestionClick = () => {
    if (questionState === "question") {
      if (
        (question.value && questionLocked) ||
        (question.value && !isBuzzedPlayer)
      ) {
        return;
      } else {
        setQuestionState("answer");
      }
    } else {
      setQuestionState("question");
    }
  };

  const handleLockClick = () => {
    if (questionLocked) {
      handleOpenBuzzers();
    } else {
      handleCloseBuzzers();
    }
    setQuestionLocked(!questionLocked);
  };

  const handleOpenBuzzers = () => {
    openBuzzerSound.play();
    onOpenBuzzers();
  };

  const handleCloseBuzzers = () => {
    onCloseBuzzers();
  };

  const handleUpdateScore = (scoreUpdate) => {
    const _scoreUpdate = !isDailyDouble ? scoreUpdate : scoreUpdate * 2;
    if (_scoreUpdate > 0) {
      rightAnswerSound.play();
    } else {
      wrongAnswerSound.play();
    }
    onScoreUpdate(_scoreUpdate);
    onAnswer();
  };

  const handleImageClick = (image) => {
    setModalImage(image);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
  };

  return (
    <div
      className={`relative flex items-center justify-center w-full text-center p-6 font-bold rounded-3xl cursor-pointer ${
        isDailyDouble
          ? "bg-red-500 text-yellow-300"
          : "bg-yellow-500 text-purple-800"
      }`}
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
          {/* Daily Double Banner */}
          {isDailyDouble && (
            <h3 className="absolute top-2 left-2 bg-red-700 text-white px-2 py-1 rounded-full text-center text-3xl font-bold">
              Daily Double
            </h3>
          )}

          {/* Question Text */}
          <h4 className="text-3xl max-w-[80%]">{`${question.question}`}</h4>

          {/* Lock Icon in Bottom Right */}
          {question.value ? (
            <div
              className="absolute bottom-4 right-4 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleLockClick();
              }}
            >
              {questionLocked ? (
                <LockClosedIcon className="w-8 h-8" />
              ) : (
                <LockOpenIcon className="w-8 h-8" />
              )}
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center max-h-[65vh] overflow-hidden animate-fadeIn">
          <h4 className="text-3xl mb-4">{`${question.answer}`}</h4>
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
        </div>
      )}

      {/* Modern Gameshow Style Buttons */}
      {question.value && questionState === "answer" && (
        <div className="absolute top-1/2 right-8 flex flex-col space-y-6 transform -translate-y-1/2">
          <div className="w-20 h-20 flex items-center justify-center">
            <div
              className={`p-1 rounded-2xl hover:p-2 transition-all duration-300 ease-in-out animate-fadeIn ${
                isDailyDouble
                  ? "bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400"
                  : "bg-gradient-to-r from-pink-400 via-purple-500 to-pink-600"
              }`}
            >
              <button
                className="p-4 bg-green-600 bg-opacity-90 backdrop-blur-lg text-white rounded-2xl hover:bg-green-500 hover:bg-opacity-95 transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={() => handleUpdateScore(question.value)}
              >
                <CheckCircleIcon className="w-10 h-10" />
              </button>
            </div>
          </div>
          <div className="w-20 h-20 flex items-center justify-center">
            <div
              className={`p-1 rounded-2xl hover:p-2 transition-all duration-300 ease-in-out animate-fadeIn ${
                isDailyDouble
                  ? "bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400"
                  : "bg-gradient-to-r from-pink-400 via-purple-500 to-pink-600"
              }`}
            >
              <button
                className="p-4 bg-red-600 bg-opacity-90 backdrop-blur-lg text-white rounded-2xl hover:bg-red-500 hover:bg-opacity-95 transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={() => handleUpdateScore(question.value * -1)}
              >
                <XCircleIcon className="w-10 h-10" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QCard;
