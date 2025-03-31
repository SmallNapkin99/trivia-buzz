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
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
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

      const questionValues = [100, 200, 300, 400, 500];

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
          const delete_res = await fetch(
            `${process.env.REACT_APP_API_URL}/images/delete/${questionDetail.imageId}`,
            {
              method: "DELETE",
            }
          );
          if (!delete_res.ok) {
            throw new Error("Error deleting old image");
          }
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
          //delete old image
          const delete_res = await fetch(
            `${process.env.REACT_APP_API_URL}/images/delete/${categoryDetail.imageId}`,
            {
              method: "DELETE",
            }
          );
          if (!delete_res.ok) {
            throw new Error("Error deleting old image");
          }
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

  const handleImageClick = (image) => {
    setModalImage(image);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen h-full w-full overflow-y-auto space-y-12 p-6">
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

      {game && (
        <h1 className="text-3xl font-bold text-yellow-500">{game.name}</h1>
      )}

      {/* Round Navigation */}
      {gameStructure && (
        <div className="flex items-center gap-4 flex-row">
          <button
            className="text-yellow-500 px-4 py-2 flex items-center justify-center font-sans hover:text-yellow-300"
            onClick={() => handleRoundChange(-1)}
          >
            ◀
          </button>
          <h2 className="text-2xl font-bold text-yellow-500">
            Round {currentRound}
          </h2>
          <button
            className="text-yellow-500 px-4 py-2 flex items-center justify-center font-sans hover:text-yellow-400"
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
            className="grid gap-6 w-full max-w-6xl"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", // This will make the columns adjust and fill the space evenly
              justifyItems: "center", // Ensures the grid items are centered
            }}
          >
            {/* Category Titles */}
            {gameStructure.rounds[currentRound].categories.map(
              (category, idx) => (
                <div key={idx} className="flex flex-col items-center w-full">
                  <h3
                    className="text-lg font-bold text-center text-yellow-400 border border-yellow-400 p-3 rounded-md w-full hover:bg-purple-700 cursor-pointer transition 
                flex items-center justify-center h-full"
                    onClick={() => openCategoryDialog(category, currentRound)}
                  >
                    {category.name}
                  </h3>
                </div>
              )
            )}

            {/* Single Full-Width Line */}
            <div className="col-span-full border-t-2 border-yellow-400 w-full mt-2 mb-4" />

            {/* Questions */}
            {gameStructure.rounds[currentRound].categories.map(
              (category, idx) => (
                <div key={idx} className="flex flex-col items-center w-full">
                  <div className="space-y-4 w-full">
                    {category.questions.map((question, qIdx) => (
                      <div
                        key={qIdx}
                        className="w-full text-center p-6 bg-yellow-500 text-purple-700 font-bold rounded-lg hover:bg-yellow-300 cursor-pointer transition"
                        onClick={() =>
                          openQuestionDialog(question, category, currentRound)
                        }
                      >
                        <h4 className="text-xl">{`${question.value}`}</h4>
                        <p className="text-sm opacity-70 overflow-hidden line-clamp-2 min-h-[2.5rem]">
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
      <Dialog open={!!selectedCategory} onClose={closeCategoryDialog}>
        <DialogTitle className="bg-yellow-500 text-purple-700">
          Edit Category
        </DialogTitle>
        <DialogContent
          className="max-w-md bg-yellow-500"
          sx={{
            width: "100%",
            height: "100%",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            overflowY: "auto",
          }}
        >
          <div className="space-y-4 text-purple-700">
            <TextField
              color="secondary"
              margin="dense"
              fullWidth
              value={categoryDetail.name}
              onChange={(e) =>
                setCategoryDetail({ ...categoryDetail, name: e.target.value })
              }
              label="Category Name"
              variant="outlined"
              multiline
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
              variant="outlined"
              multiline
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
              variant="outlined"
              multiline
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
              variant="outlined"
              multiline
            />
            {/* Image Input */}
            <Button
              className="w-full"
              component="label"
              role={undefined}
              variant="contained"
              color="secondary"
              align="center"
              tabIndex={-1}
              startIcon={<FileUploadIcon />}
            >
              Image
              <VisuallyHiddenInput
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files[0])}
              />
            </Button>
            {imageSrc && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  height: "100%",
                  overflow: "auto",
                }}
              >
                <img
                  src={imageSrc}
                  alt="category_image"
                  style={{
                    maxWidth: "50%",
                    maxHeight: "50%",
                    objectFit: "contain",
                    cursor: "zoom-in",
                  }}
                  onClick={() => handleImageClick(imageSrc)}
                />
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions className="bg-yellow-500">
          <Button
            variant="outlined"
            color="secondary"
            onClick={closeCategoryDialog}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleCategorySave}
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
        sx={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <DialogTitle
          variant="h5"
          className="bg-yellow-500 text-purple-700 text-center"
          sx={{
            fontWeight: "medium",
            wordBreak: "break-word",
            whiteSpace: "normal",
          }}
        >
          {questionDetail.category}
        </DialogTitle>

        {/* Horizontal Line */}
        <div className="bg-yellow-500">
          <hr className="border-t-2 border-purple-700 my-4 mx-6" />
        </div>

        <DialogContent
          className="max-w-md bg-yellow-500 w-full flex"
          sx={{
            width: "100%",
            height: "100%",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            overflowY: "auto",
          }}
        >
          <div className="space-y-4 text-purple-700">
            <Typography
              variant="h5"
              className="text-center"
              sx={{ fontWeight: "medium" }}
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
              variant="outlined"
              multiline
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
              variant="outlined"
              multiline
            />
            {/* Image Upload */}
            <Button
              className="w-full"
              component="label"
              role={undefined}
              variant="contained"
              color="secondary"
              align="center"
              tabIndex={-1}
              startIcon={<FileUploadIcon />}
            >
              Image
              <VisuallyHiddenInput
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files[0])}
              />
            </Button>
            {imageSrc && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  height: "100%",
                  overflow: "auto",
                }}
              >
                <img
                  src={imageSrc}
                  alt="question_image"
                  style={{
                    maxWidth: "50%",
                    maxHeight: "50%",
                    objectFit: "contain",
                    cursor: "zoom-in",
                  }}
                  onClick={() => handleImageClick(imageSrc)}
                />
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions className="bg-yellow-500">
          <Button
            variant="outlined"
            color="secondary"
            onClick={closeQuestionDialog}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleQuestionSave}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EditGame;
