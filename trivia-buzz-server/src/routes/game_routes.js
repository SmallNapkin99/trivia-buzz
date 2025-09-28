import express from "express";
import Game from "../models/game_model.js";
import Question from "../models/question_model.js";
import multer from "multer";
import StringMatcher from "../utils/string_matcher.js";

const router = express.Router();
const upload = multer();

//Fetch all games
router.get("/", async (req, res) => {
  try {
    const games = await Game.find();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: "Error fetching games" });
  }
});

//Fetch a single game by ID
router.get("/:id", async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: "Error fetching game" });
  }
});

//update a game by ID
router.put("/:id", upload.none(), async (req, res) => {
  try {
    const { updatedCategoryIdx, categoryUpdates, round, gameId } = req.body;

    const parsedUpdates = JSON.parse(categoryUpdates);

    const fullCategoryUpdate = {
      name: parsedUpdates.name,
      description: parsedUpdates.description,
      round: round,
      sampleQuestion: {
        question: parsedUpdates.sampleQuestion,
        answer: parsedUpdates.sampleAnswer,
        imageId: parsedUpdates.imageId ?? null,
      },
    };

    if (parsedUpdates.imageId === "null") {
      fullCategoryUpdate.sampleQuestion.imageId = null;
    }

    const updatedGame = await Game.findByIdAndUpdate(
      gameId,
      { $set: { [`categories.${updatedCategoryIdx}`]: fullCategoryUpdate } },
      { new: true }
    );

    if (!updatedGame) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json(updatedGame);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error updating game", message: err.message });
  }
});

//update final trivia for a game by ID
router.put("/:id/final-trivia", upload.none(), async (req, res) => {
  try {
    const { question, answer, imageId } = req.body;
    const gameId = req.params.id;

    const finalTriviaUpdate = {
      question: question,
      answer: answer,
      imageId: imageId ?? null,
    };

    if (imageId === "null") {
      finalTriviaUpdate.imageId = null;
    }

    const updatedGame = await Game.findByIdAndUpdate(
      gameId,
      { $set: { finalTrivia: finalTriviaUpdate } },
      { new: true }
    );

    if (!updatedGame) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json(updatedGame);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error updating final trivia", message: err.message });
  }
});

//check final trivia answer
router.post("/:id/check-final-answer", upload.none(), async (req, res) => {
  try {
    const gameId = req.params.id;
    const { userAnswer, playerId } = req.body;

    // Validate input
    if (!userAnswer || !playerId) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["userAnswer", "playerId"],
      });
    }

    // Get the game and its final trivia
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (!game.finalTrivia || !game.finalTrivia.answer) {
      return res
        .status(400)
        .json({ error: "No final trivia question configured for this game" });
    }

    const correctAnswer = game.finalTrivia.answer;

    // Check answer using advanced matching
    const matchResult = StringMatcher.advancedMatch(userAnswer, correctAnswer, {
      strictThreshold: 0.85, // 85% similarity for strict match
      lenientThreshold: 0.7, // 70% similarity for partial match
      enableWordOrder: true, // Check word-by-word for multi-word answers
      enablePartialMatch: true, // Allow partial matches
    });

    // Prepare response
    const response = {
      isCorrect: matchResult.isMatch,
      userAnswer: userAnswer.trim(),
      correctAnswer: correctAnswer,
      similarity: matchResult.score,
      strategy: matchResult.strategy,
      playerId: playerId,
      gameId: gameId,
      timestamp: new Date().toISOString(),
    };

    // Add debug info in development
    if (process.env.NODE_ENV === "development") {
      response.debug = {
        threshold: matchResult.threshold,
        method: matchResult.method,
        allResults: matchResult.allResults,
      };
    }

    // Log for analytics/debugging
    console.log(
      `Final Answer Check - Game: ${gameId}, Player: ${playerId}, Correct: ${matchResult.isMatch}, Score: ${matchResult.score}, Strategy: ${matchResult.strategy}`
    );

    res.json(response);
  } catch (err) {
    console.error("Error checking final trivia answer:", err);
    res.status(500).json({
      error: "Error checking answer",
      message: err.message,
    });
  }
});

//Add a new game
router.post("/", async (req, res) => {
  try {
    const newGame = new Game(req.body);
    await newGame.save();
    res.json(newGame);
  } catch (err) {
    console.error("Error details:", err);

    if (err.name === "ValidationError") {
      res.status(400).json({
        error: "Validation error",
        details: err.message,
        errors: err.errors,
      });
    } else {
      res.status(500).json({
        error: "Error adding game",
        details: err.message,
      });
    }
  }
});

//delete a game by ID
router.delete("/:id", async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    // Get all questions associated with this game
    const questions = await Question.find({ gameId: req.params.id });

    // Collect image IDs from questions
    const questionImageIds = questions
      .filter((question) => question.imageId)
      .map((question) => question.imageId);

    // Collect image IDs from categories' sample questions
    const categoryImageIds = (game.categories || [])
      .map((category) => category.sampleQuestion?.imageId)
      .filter((imageId) => imageId); // Remove undefined values

    // Combine all image IDs to delete
    const allImageIds = [...questionImageIds, ...categoryImageIds];

    // Delete all associated images concurrently
    const deleteImagePromises = allImageIds.map((imageId) =>
      fetch(`${process.env.API_URL}/images/delete/${imageId}`, {
        method: "DELETE",
      })
    );

    try {
      await Promise.all(deleteImagePromises);
    } catch (error) {
      console.error("Error deleting images:", error);
    }

    // Delete all questions associated with the game
    await Question.deleteMany({ gameId: req.params.id });

    res.json({ message: "Game deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting game" });
  }
});

export default router;
