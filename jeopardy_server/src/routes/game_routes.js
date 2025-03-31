import express from "express";
import Game from "../models/game_model.js";
import Question from "../models/question_model.js";
import multer from "multer";

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

//Add a new game
router.post("/", async (req, res) => {
  try {
    const newGame = new Game(req.body);
    await newGame.save();
    res.json(newGame);
  } catch (err) {
    res.status(500).json({ error: "Error adding game" });
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
