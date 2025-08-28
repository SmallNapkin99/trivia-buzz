import React from "react";
import { useParams } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Tooltip,
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import DeleteForever from "@mui/icons-material/DeleteForever";
import { styled } from "@mui/material/styles";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const EditGame = () => {
  const { id: gameId } = useParams();
  const [game, setGame] = React.useState(null);
  const [gameStructure, setGameStructure] = React.useState(null);
  const [currentRound, setCurrentRound] = React.useState(1);
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [categoryDetail, setCategoryDetail] = React.useState({
    name: "",
    description: "",
    sampleQuestion: "",
    sampleAnswer: "",
    imageId: null,
  });
  const [selectedQuestion, setSelectedQuestion] = React.useState(null);
  const [questionDetail, setQuestionDetail] = React.useState({
    question: "",
    answer: "",
    gameId: "",
    category: "",
    value: "",
    round: "",
    imageId: null,
  });
  const [modalImage, setModalImage] = React.useState(null);
  const [imageModalOpen, setImageModalOpen] = React.useState(false);
  const [imageFile, setImageFile] = React.useState(null);
  const [imageSrc, setImageSrc] = React.useState(null);

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

  const fetchQuestions = React.useCallback(async () => {
    // create game structure grid for frontend rendering
    const createGameStructureGrid = (game, questions) => {
      if (!game || !questions) return;

      const structuredGame = {
        id: game._id,
        rounds: {},
      };

      const questionsPerCategory = game.questionTotal / game.categories.length;
      const questionValues = [];
      for (let i = 1; i <= questionsPerCategory; i++) {
        questionValues.push(i * 100);
      }

      // Group questions by round and category
      const questionsByCategoryAndRound = {};
      questions.forEach((q) => {
        const key = `${q.round}-${q.category}`;
        if (!questionsByCategoryAndRound[key]) {
          questionsByCategoryAndRound[key] = {};
        }
        questionsByCategoryAndRound[key][q.value] = q;
      });

      game.categories.forEach((category) => {
        const roundKey = category.round;

        if (!structuredGame.rounds[roundKey]) {
          structuredGame.rounds[roundKey] = { categories: [] };
        }

        // Fill in questions, ensuring placeholders for missing values
        const categoryQuestions = questionValues.map((value) => {
          return (
            questionsByCategoryAndRound[`${roundKey}-${category.name}`]?.[
              value
            ] || {
              value,
              question: "",
              answer: "",
            }
          );
        });

        structuredGame.rounds[roundKey].categories.push({
          name: category.name,
          description: category.description,
          questions: categoryQuestions,
        });
      });

      setGameStructure(structuredGame);
    };

    if (!game) return;
    let questions;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/questions/${gameId}`
      );
      if (response.status === 500) {
        throw new Error("Error fetching questions");
      } else if (response.status === 404) {
        questions = [];
      } else if (response.status === 200) {
        questions = await response.json();
      }
      createGameStructureGrid(game, questions);
    } catch (error) {
      console.log(error.message);
    }
  }, [game, gameId]);

  React.useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleRoundChange = (direction) => {
    setCurrentRound((prevRound) => {
      let newRound = prevRound + direction;
      if (newRound < 1) newRound = 1;
      if (newRound > game.rounds) newRound = game.rounds;
      return newRound;
    });
  };

  const openCategoryDialog = (category, round) => {
    setSelectedCategory(category);
    const _category = game.categories.find(
      (cat) => cat.name === category.name && cat.round === round
    );
    setCategoryDetail({
      name: _category.name,
      description: _category.description,
      sampleQuestion: _category?.sampleQuestion?.question || "",
      sampleAnswer: _category?.sampleQuestion?.answer || "",
      imageId: _category?.sampleQuestion?.imageId || null,
    });
    if (_category.sampleQuestion?.imageId) {
      setImageSrc(
        `${process.env.REACT_APP_API_URL}/images/${_category.sampleQuestion.imageId}`
      );
    }
  };

  const openQuestionDialog = (question, category, round) => {
    setSelectedQuestion({
      ...question,
      category: category.name,
      round: round,
    });
    setQuestionDetail({
      question: question.question,
      answer: question.answer,
      gameId: gameId,
      category: category.name,
      value: question.value,
      round: round,
      imageId: question?.imageId,
    });
    if (question?.imageId) {
      setImageSrc(
        `${process.env.REACT_APP_API_URL}/images/${question.imageId}`
      );
    }
  };

  const closeCategoryDialog = () => {
    setImageFile(null);
    setImageSrc(null);
    setSelectedCategory(null);
  };

  const closeQuestionDialog = () => {
    setImageFile(null);
    setImageSrc(null);
    setSelectedQuestion(null);
  };

  const handleCategorySave = async () => {
    try {
      const categoryNameUnchanged =
        selectedCategory.name === categoryDetail.name;
      if (!categoryNameUnchanged) {
        updateQuestionsWithCategory();
      }
      const gameUpdate = await updateGameCategory();
      setGame(gameUpdate);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/games/${gameId}`
      );
      if (!response.ok) {
        throw new Error("Error fetching game");
      }
      const data = await response.json();
      setGame(data);
      closeCategoryDialog();
    } catch (err) {
      console.error("Error saving category:", err);
    }
  };

  const checkQuestionExistence = async (filter) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/questions/check-existence?gameId=${gameId}&category=${filter.category}&round=${filter.round}&value=${filter.value}`
      );
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Error checking existence:", error);
    }
  };

  const updateQuestion = async () => {
    try {
      //check for image
      const questionFormData = new FormData();
      const imageFormData = new FormData();
      if (imageFile) {
        if (questionDetail.imageId) {
          await handleDeleteImage(questionDetail.imageId);
        }
        imageFormData.append("file", imageFile);
        const upload_res = await fetch(
          `${process.env.REACT_APP_API_URL}/images/upload`,
          {
            method: "POST",
            body: imageFormData,
          }
        );
        questionFormData.append("imageId", (await upload_res.json()).fileId);
      }
      questionFormData.append("question", questionDetail.question);
      questionFormData.append("answer", questionDetail.answer);
      questionFormData.append("gameId", questionDetail.gameId);
      questionFormData.append("category", questionDetail.category);
      questionFormData.append("value", questionDetail.value);
      questionFormData.append("round", questionDetail.round);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/questions/update`,
        {
          method: "POST",
          body: questionFormData,
        }
      );
      closeQuestionDialog();
      return response.json();
    } catch (err) {
      console.error("Error checking existence:", err);
    }
  };

  const createQuestion = async () => {
    try {
      const questionFormData = new FormData();
      const imageFormData = new FormData();
      //check for image
      if (imageFile) {
        imageFormData.append("file", imageFile);
        const upload_res = await fetch(
          `${process.env.REACT_APP_API_URL}/images/upload`,
          {
            method: "POST",
            body: imageFormData,
          }
        );
        questionFormData.append("imageId", (await upload_res.json()).fileId);
      }
      questionFormData.append("question", questionDetail.question);
      questionFormData.append("answer", questionDetail.answer);
      questionFormData.append("gameId", questionDetail.gameId);
      questionFormData.append("category", questionDetail.category);
      questionFormData.append("value", questionDetail.value);
      questionFormData.append("round", questionDetail.round);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/questions`,
        {
          method: "POST",
          body: questionFormData,
        }
      );

      closeQuestionDialog();
      return response.json();
    } catch (err) {
      console.error("Error checking existence:", err);
    }
  };

  const handleQuestionSave = async () => {
    console.log("Saving changes:", questionDetail);
    const questionExists = await checkQuestionExistence({
      category: selectedQuestion.category,
      round: selectedQuestion.round,
      value: selectedQuestion.value,
    });

    const action = questionExists ? updateQuestion : createQuestion;

    return action()
      .then(() => fetchQuestions())
      .catch((err) => console.error("Error saving question:", err));
  };

  const updateGameCategory = async () => {
    const categoryUpdates = { ...categoryDetail };
    try {
      if (imageFile) {
        const imageFormData = new FormData();
        if (categoryDetail.imageId) {
          await handleDeleteImage(categoryDetail.imageId);
        }
        //upload new image
        imageFormData.append("file", imageFile);
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/images/upload`,
          {
            method: "POST",
            body: imageFormData,
          }
        );
        const data = await response.json();
        setCategoryDetail((prev) => ({
          ...prev,
          imageId: data.fileId,
        }));
        categoryUpdates.imageId = data.fileId;
      }

      const categoryFormData = new FormData();

      const updatedCategoryIdx = game.categories.findIndex(
        (cat) =>
          cat.name === selectedCategory.name && cat.round === currentRound
      );

      categoryFormData.append("updatedCategoryIdx", updatedCategoryIdx);
      categoryFormData.append(
        "categoryUpdates",
        JSON.stringify(categoryUpdates)
      );
      categoryFormData.append("round", currentRound);
      categoryFormData.append("gameId", gameId);

      console.log("Saving changes:", categoryUpdates);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/games/${gameId}`,
        {
          method: "PUT",
          body: categoryFormData,
        }
      );

      return response.json();
    } catch (err) {
      console.error("Error updating category:", err);
    }
  };

  const updateQuestionsWithCategory = async () => {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/questions/update-category`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: gameId,
          round: currentRound,
          category: selectedCategory.name,
          newCategory: categoryDetail.name,
        }),
      }
    );
    const updatedQuestions = await response.json();
    if (response.status === 404) {
      console.log("No questions found to update");
    } else {
      console.log("Questions updated:", updatedQuestions);
    }
  };

  const handleImageChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result);
      setImageFile(file);
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/images/delete/${imageId}`, {
        method: "DELETE",
      });
      setImageSrc(null);
      setImageFile(null);
      //update category or question to null the imageId
      if (selectedCategory) {
        setCategoryDetail((prev) => ({
          ...prev,
          imageId: null,
        }));
        //null out the imageId in the backend
        const categoryFormData = new FormData();
        const categoryUpdates = { ...categoryDetail, imageId: "null" };
        const updatedCategoryIdx = game.categories.findIndex(
          (cat) =>
            cat.name === selectedCategory.name && cat.round === currentRound
        );

        categoryFormData.append("updatedCategoryIdx", updatedCategoryIdx);
        categoryFormData.append(
          "categoryUpdates",
          JSON.stringify(categoryUpdates)
        );
        categoryFormData.append("round", currentRound);
        categoryFormData.append("gameId", gameId);

        await fetch(`${process.env.REACT_APP_API_URL}/games/${gameId}`, {
          method: "PUT",
          body: categoryFormData,
        });
      }
      if (selectedQuestion) {
        setQuestionDetail((prev) => ({
          ...prev,
          imageId: null,
        }));
        //null out the imageId in the backend
        const questionFormData = new FormData();
        questionFormData.append("question", questionDetail.question);
        questionFormData.append("answer", questionDetail.answer);
        questionFormData.append("gameId", questionDetail.gameId);
        questionFormData.append("category", questionDetail.category);
        questionFormData.append("value", questionDetail.value);
        questionFormData.append("round", questionDetail.round);
        questionFormData.append("imageId", "null");

        await fetch(`${process.env.REACT_APP_API_URL}/questions/update`, {
          method: "POST",
          body: questionFormData,
        });
      }
      //fetch game and set game state to run fetchQuestions
      const game_res = await fetch(
        `${process.env.REACT_APP_API_URL}/games/${gameId}`
      );
      const game_data = await game_res.json();
      setGame(game_data);
    } catch (err) {
      console.error("Error deleting image:", err);
    }
  };

  const handleImageClick = (image) => {
    setModalImage(image);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen h-full w-full overflow-y-auto">
      {game && (
        <div className="relative bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 shadow-2xl w-screen">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative px-6 py-8 text-center">
            <div className="text-xs font-semibold text-yellow-900 mb-1 tracking-widest uppercase">
              Game Editor
            </div>
            <div className="text-4xl md:text-5xl font-black text-black drop-shadow-lg">
              {game.name}
            </div>
          </div>
          {/* Decorative bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 to-pink-600"></div>
        </div>
      )}

      <div className="space-y-12 p-6 w-full flex flex-col items-center">
        {/* Fullscreen Image Modal */}
        {imageModalOpen && (
          <div
            className="h-full w-full"
            onClick={() => closeImageModal()}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              zIndex: 1301,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "zoom-out",
              width: "100vw",
              height: "100vh",
            }}
          >
            <img
              src={modalImage}
              alt="Zoomed"
              style={{
                maxWidth: "90%",
                maxHeight: "90%",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        {/* Round Navigation */}
        {gameStructure && (
          <div className="flex items-center gap-6 flex-row mt-4">
            <button
              className="text-purple-900 px-4 py-2 flex items-center justify-center font-bold text-xl
                         bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 
                         rounded-xl
                         hover:bg-gradient-to-br hover:from-yellow-300 hover:via-yellow-400 hover:to-yellow-500
                         cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1
                         active:scale-95 active:translate-y-0"
              onClick={() => handleRoundChange(-1)}
            >
              ◀
            </button>
            <h2 className="text-3xl font-bold text-yellow-400">
              Round {currentRound}
            </h2>
            <button
              className="text-purple-900 px-4 py-2 flex items-center justify-center font-bold text-xl
                         bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 
                         rounded-xl
                         hover:bg-gradient-to-br hover:from-yellow-300 hover:via-yellow-400 hover:to-yellow-500
                         cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1
                         active:scale-95 active:translate-y-0"
              onClick={() => handleRoundChange(1)}
            >
              ▶
            </button>
          </div>
        )}

        {/* Game Grid */}
        {gameStructure && gameStructure.rounds[currentRound] && (
          <div className="flex justify-center w-full">
            <div
              className="grid gap-4 w-full max-w-screen-xl"
              style={{
                gridTemplateColumns: `repeat(${gameStructure.rounds[currentRound].categories.length}, 1fr)`,
                gridAutoRows: "auto",
              }}
            >
              {/* Category Titles */}
              {gameStructure.rounds[currentRound].categories.map(
                (category, idx) => (
                  <div key={idx} className="flex flex-col items-center w-full">
                    <h3
                      className="text-lg font-medium text-center text-white 
                               bg-gradient-to-br from-purple-600 to-pink-600 
                               p-4 rounded-xl w-full 
                               shadow-lg 
                               hover:from-purple-500 hover:to-pink-500 hover:shadow-xl
                               cursor-pointer transition-all duration-200 hover:scale-[1.02]
                               flex items-center justify-center h-full min-h-[4rem]
                               font-sans"
                      onClick={() => openCategoryDialog(category, currentRound)}
                    >
                      {category.name}
                    </h3>
                  </div>
                )
              )}

              {/* Single Full-Width Line */}
              <div
                className="col-span-full h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 
                            w-full mt-4 mb-6 shadow-sm"
              />

              {/* Questions */}
              {gameStructure.rounds[currentRound].categories.map(
                (category, idx) => (
                  <div key={idx} className="flex flex-col items-center w-full">
                    <div className="space-y-3 w-full">
                      {category.questions.map((question, qIdx) => (
                        <div
                          key={qIdx}
                          className="w-full text-center p-6 
                                   bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 
                                   text-purple-900 font-bold rounded-xl 
                                   border-2 border-yellow-600
                                   hover:bg-gradient-to-br hover:from-yellow-300 hover:via-yellow-400 hover:to-yellow-500
                                hover:border-yellow-500
                                   cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1
                                   active:scale-95 active:translate-y-0
                                   h-32 flex flex-col justify-center"
                          onClick={() =>
                            openQuestionDialog(question, category, currentRound)
                          }
                        >
                          <h4 className="text-2xl font-black tracking-wider drop-shadow-sm">
                            {question.value}
                          </h4>
                          <p
                            className="text-sm opacity-80 overflow-hidden font-semibold mt-2 leading-tight
                                      line-clamp-2"
                          >
                            {question.question || "No question available"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Dialog for Editing Category */}
        <Dialog
          open={!!selectedCategory}
          onClose={closeCategoryDialog}
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            "& .MuiDialog-paper": {
              borderRadius: "16px",
            },
          }}
        >
          <DialogTitle
            variant="h5"
            className="text-white text-center font-semibold"
            sx={{
              background:
                "linear-gradient(135deg, rgb(250, 204, 21) 0%, rgb(245, 158, 11) 100%)",
              color: "rgb(88, 28, 135)",
              fontWeight: "600",
              wordBreak: "break-word",
              whiteSpace: "normal",
              padding: "1.5rem",
              fontSize: "1.5rem",
            }}
          >
            Edit Category
          </DialogTitle>
          <DialogContent
            className="max-w-md"
            sx={{
              width: "100%",
              height: "100%",
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              overflowY: "auto",
              background:
                "linear-gradient(90deg, rgb(147, 51, 234) 0%, rgb(219, 39, 119) 100%)",
              padding: "1.5rem 1.5rem 0.75rem 1.5rem",
            }}
          >
            <div className="space-y-4 mt-6">
              <TextField
                color="secondary"
                margin="dense"
                fullWidth
                value={categoryDetail.name}
                onChange={(e) =>
                  setCategoryDetail({ ...categoryDetail, name: e.target.value })
                }
                label="Category Name"
                variant="standard"
                multiline
                sx={{
                  "& .MuiInputLabel-root": {
                    color: "rgb(245, 158, 11)",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "rgb(234, 179, 8)", // yellow-500 color
                  },

                  // Focused underline
                  "& .MuiInput-underline:after": {
                    borderBottomColor: "rgb(234, 179, 8)", // match label focused
                  },
                  "& .MuiInputBase-input": {
                    color: "white",
                  },
                }}
              />
              <TextField
                color="secondary"
                margin="dense"
                fullWidth
                value={categoryDetail.description}
                onChange={(e) =>
                  setCategoryDetail({
                    ...categoryDetail,
                    description: e.target.value,
                  })
                }
                label="Category Description"
                variant="standard"
                multiline
                sx={{
                  "& .MuiInputLabel-root": {
                    color: "rgb(245, 158, 11)",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "rgb(234, 179, 8)", // yellow-500 color
                  },

                  // Focused underline
                  "& .MuiInput-underline:after": {
                    borderBottomColor: "rgb(234, 179, 8)", // match label focused
                  },
                  "& .MuiInputBase-input": {
                    color: "white",
                  },
                }}
              />
              <TextField
                color="secondary"
                margin="dense"
                fullWidth
                value={categoryDetail.sampleQuestion}
                onChange={(e) =>
                  setCategoryDetail({
                    ...categoryDetail,
                    sampleQuestion: e.target.value,
                  })
                }
                label="Sample Question"
                variant="standard"
                multiline
                sx={{
                  "& .MuiInputLabel-root": {
                    color: "rgb(245, 158, 11)",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "rgb(234, 179, 8)", // yellow-500 color
                  },

                  // Focused underline
                  "& .MuiInput-underline:after": {
                    borderBottomColor: "rgb(234, 179, 8)", // match label focused
                  },
                  "& .MuiInputBase-input": {
                    color: "white",
                  },
                }}
              />
              <TextField
                color="secondary"
                margin="dense"
                fullWidth
                value={categoryDetail.sampleAnswer}
                onChange={(e) =>
                  setCategoryDetail({
                    ...categoryDetail,
                    sampleAnswer: e.target.value,
                  })
                }
                label="Sample Answer"
                variant="standard"
                multiline
                sx={{
                  "& .MuiInputLabel-root": {
                    color: "rgb(245, 158, 11)",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "rgb(234, 179, 8)", // yellow-500 color
                  },

                  // Focused underline
                  "& .MuiInput-underline:after": {
                    borderBottomColor: "rgb(234, 179, 8)", // match label focused
                  },
                  "& .MuiInputBase-input": {
                    color: "white",
                  },
                }}
              />
              {/* Image Upload & Delete Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  className="flex-grow"
                  component="label"
                  variant="contained"
                  tabIndex={-1}
                  startIcon={<FileUploadIcon />}
                  sx={{
                    background:
                      "linear-gradient(135deg, rgb(250, 204, 21) 0%, rgb(245, 158, 11) 100%)",
                    color: "rgb(88, 28, 135)",
                    fontWeight: "600",
                    borderRadius: "12px",
                    padding: "12px 20px",
                    textTransform: "none",
                    boxShadow: "0 4px 14px 0 rgba(250, 204, 21, 0.3)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, rgb(254, 240, 138) 0%, rgb(250, 204, 21) 100%)",
                      boxShadow: "0 6px 20px 0 rgba(250, 204, 21, 0.4)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  Image
                  <VisuallyHiddenInput
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e.target.files[0])}
                  />
                </Button>
                <Tooltip title="Delete Image" arrow>
                  <span>
                    <Button
                      variant="contained"
                      disabled={!categoryDetail.imageId}
                      onClick={() => handleDeleteImage(categoryDetail.imageId)}
                      sx={{
                        background: categoryDetail.imageId
                          ? "linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(220, 38, 38) 100%)"
                          : "rgb(156, 163, 175)",
                        color: "white",
                        minWidth: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        border: categoryDetail.imageId
                          ? "2px solid rgb(153, 27, 27)"
                          : "none",
                        boxShadow: categoryDetail.imageId
                          ? "0 4px 14px 0 rgba(239, 68, 68, 0.3)"
                          : "none",
                        "&:hover": {
                          background: categoryDetail.imageId
                            ? "linear-gradient(135deg, rgb(248, 113, 113) 0%, rgb(239, 68, 68) 100%)"
                            : "rgb(156, 163, 175)",
                          border: categoryDetail.imageId
                            ? "2px solid rgb(127, 29, 29)"
                            : "none",
                          transform: categoryDetail.imageId
                            ? "translateY(-1px)"
                            : "none",
                        },
                        "&:disabled": {
                          background: "rgb(156, 163, 175)",
                          color: "rgb(107, 114, 128)",
                          border: "none",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <DeleteForever />
                    </Button>
                  </span>
                </Tooltip>
              </div>
              {imageSrc && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                    overflow: "auto",
                    backgroundColor: "transparent",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <img
                    src={imageSrc}
                    alt="Category Image"
                    style={{
                      maxWidth: "50%",
                      maxHeight: "50%",
                      objectFit: "contain",
                      cursor: "zoom-in",
                      borderRadius: "8px",
                    }}
                    onClick={() => handleImageClick(imageSrc)}
                  />
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions
            sx={{
              background:
                "linear-gradient(90deg, rgb(147, 51, 234) 0%, rgb(219, 39, 119) 100%)",
              padding: "0.75rem 1.5rem 1.5rem",
              gap: "12px",
            }}
          >
            <Button
              variant="outlined"
              onClick={closeCategoryDialog}
              sx={{
                borderColor: "rgb(250, 204, 21)",
                color: "rgb(250, 204, 21)",
                borderRadius: "12px",
                padding: "10px 24px",
                fontWeight: "500",
                textTransform: "none",
                "&:hover": {
                  color: "rgb(234, 179, 8)",
                  borderColor: "rgb(245, 158, 11)",
                  backgroundColor: "rgba(250, 204, 21, 0.04)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCategorySave}
              sx={{
                background:
                  "linear-gradient(135deg, rgb(250, 204, 21) 0%, rgb(245, 158, 11) 100%)",
                color: "rgb(88, 28, 135)",
                borderRadius: "12px",
                padding: "10px 24px",
                fontWeight: "600",
                textTransform: "none",
                boxShadow: "0 4px 14px 0 rgba(250, 204, 21, 0.3)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, rgb(254, 240, 138) 0%, rgb(250, 204, 21) 100%)",
                  boxShadow: "0 6px 20px 0 rgba(250, 204, 21, 0.4)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog for Editing Questions */}
        <Dialog
          open={!!selectedQuestion}
          onClose={closeQuestionDialog}
          fullWidth
          maxWidth="xs"
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            "& .MuiDialog-paper": {
              borderRadius: "16px",
            },
          }}
        >
          <DialogTitle
            variant="h5"
            className="text-white text-center font-semibold"
            sx={{
              background:
                "linear-gradient(135deg, rgb(250, 204, 21) 0%, rgb(245, 158, 11) 100%)",
              color: "rgb(88, 28, 135)",
              fontWeight: "600",
              wordBreak: "break-word",
              whiteSpace: "normal",
              padding: "1.5rem",
              fontSize: "1.5rem",
            }}
          >
            {questionDetail.category}
          </DialogTitle>
          <DialogContent
            className="max-w-md w-full flex"
            sx={{
              width: "100%",
              height: "100%",
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              overflowY: "auto",
              background:
                "linear-gradient(90deg, rgb(147, 51, 234) 0%, rgb(219, 39, 119) 100%)",
              padding: "1.5rem 1.5rem 0.75rem 1.5rem",
            }}
          >
            <div className="space-y-4 mt-6">
              <Typography
                variant="h5"
                className="text-center font-semibold"
                sx={{
                  fontWeight: "600",
                  color: "rgb(250, 204, 21)",
                  fontSize: "1.75rem",
                }}
              >
                {questionDetail.value}
              </Typography>
              <TextField
                color="secondary"
                margin="dense"
                fullWidth
                value={questionDetail.question}
                onChange={(e) =>
                  setQuestionDetail({
                    ...questionDetail,
                    question: e.target.value,
                  })
                }
                label="Question"
                variant="standard"
                multiline
                sx={{
                  "& .MuiInputLabel-root": {
                    color: "rgb(245, 158, 11)",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "rgb(234, 179, 8)", // yellow-500 color
                  },

                  // Focused underline
                  "& .MuiInput-underline:after": {
                    borderBottomColor: "rgb(234, 179, 8)", // match label focused
                  },
                  "& .MuiInputBase-input": {
                    color: "white",
                  },
                }}
              />
              <TextField
                color="secondary"
                margin="dense"
                fullWidth
                value={questionDetail.answer}
                onChange={(e) =>
                  setQuestionDetail({
                    ...questionDetail,
                    answer: e.target.value,
                  })
                }
                label="Answer"
                variant="standard"
                multiline
                sx={{
                  "& .MuiInputLabel-root": {
                    color: "rgb(245, 158, 11)",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "rgb(234, 179, 8)", // yellow-500 color
                  },

                  // Focused underline
                  "& .MuiInput-underline:after": {
                    borderBottomColor: "rgb(234, 179, 8)", // match label focused
                  },
                  "& .MuiInputBase-input": {
                    color: "white",
                  },
                }}
              />
              {/* Image Upload & Delete Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  className="flex-grow"
                  component="label"
                  variant="contained"
                  tabIndex={-1}
                  startIcon={<FileUploadIcon />}
                  sx={{
                    background:
                      "linear-gradient(135deg, rgb(250, 204, 21) 0%, rgb(245, 158, 11) 100%)",
                    color: "rgb(88, 28, 135)",
                    fontWeight: "600",
                    borderRadius: "12px",
                    padding: "12px 20px",
                    textTransform: "none",
                    boxShadow: "0 4px 14px 0 rgba(250, 204, 21, 0.3)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, rgb(254, 240, 138) 0%, rgb(250, 204, 21) 100%)",
                      boxShadow: "0 6px 20px 0 rgba(250, 204, 21, 0.4)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  Image
                  <VisuallyHiddenInput
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e.target.files[0])}
                  />
                </Button>
                <Tooltip title="Delete Image" arrow>
                  <span>
                    <Button
                      variant="contained"
                      disabled={!questionDetail.imageId}
                      onClick={() => handleDeleteImage(questionDetail.imageId)}
                      sx={{
                        background: questionDetail.imageId
                          ? "linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(220, 38, 38) 100%)"
                          : "rgb(156, 163, 175)",
                        color: "white",
                        minWidth: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        border: questionDetail.imageId
                          ? "2px solid rgb(153, 27, 27)"
                          : "none",
                        boxShadow: questionDetail.imageId
                          ? "0 4px 14px 0 rgba(239, 68, 68, 0.3)"
                          : "none",
                        "&:hover": {
                          background: questionDetail.imageId
                            ? "linear-gradient(135deg, rgb(248, 113, 113) 0%, rgb(239, 68, 68) 100%)"
                            : "rgb(156, 163, 175)",
                          border: questionDetail.imageId
                            ? "2px solid rgb(127, 29, 29)"
                            : "none",
                          transform: questionDetail.imageId
                            ? "translateY(-1px)"
                            : "none",
                        },
                        "&:disabled": {
                          background: "rgb(156, 163, 175)",
                          color: "rgb(107, 114, 128)",
                          border: "none",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <DeleteForever />
                    </Button>
                  </span>
                </Tooltip>
              </div>
              {imageSrc && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                    overflow: "auto",
                    backgroundColor: "transparent",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <img
                    src={imageSrc}
                    alt="Question Image"
                    style={{
                      maxWidth: "50%",
                      maxHeight: "50%",
                      objectFit: "contain",
                      cursor: "zoom-in",
                      borderRadius: "8px",
                    }}
                    onClick={() => handleImageClick(imageSrc)}
                  />
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions
            sx={{
              background:
                "linear-gradient(90deg, rgb(147, 51, 234) 0%, rgb(219, 39, 119) 100%)",
              padding: "0.75rem 1.5rem 1.5rem",
              gap: "12px",
            }}
          >
            <Button
              variant="outlined"
              onClick={closeQuestionDialog}
              sx={{
                borderColor: "rgb(250, 204, 21)",
                color: "rgb(250, 204, 21)",
                borderRadius: "12px",
                padding: "10px 24px",
                fontWeight: "500",
                textTransform: "none",
                "&:hover": {
                  color: "rgb(234, 179, 8)",
                  borderColor: "rgb(245, 158, 11)",
                  backgroundColor: "rgba(250, 204, 21, 0.04)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleQuestionSave}
              sx={{
                background:
                  "linear-gradient(135deg, rgb(250, 204, 21) 0%, rgb(245, 158, 11) 100%)",
                color: "rgb(88, 28, 135)",
                borderRadius: "12px",
                padding: "10px 24px",
                fontWeight: "600",
                textTransform: "none",
                boxShadow: "0 4px 14px 0 rgba(250, 204, 21, 0.3)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, rgb(254, 240, 138) 0%, rgb(250, 204, 21) 100%)",
                  boxShadow: "0 6px 20px 0 rgba(250, 204, 21, 0.4)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default EditGame;
