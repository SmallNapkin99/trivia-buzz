import express from "express";
import Question from "../models/question_model.js";
import { ObjectId } from "mongodb";
import multer from "multer";

const router = express.Router();
const upload = multer();

// Helper function to check if a document exists based on filters
const doesDocumentExist = async (filters) => {
  const count = await Question.countDocuments(filters);
  return count > 0;
};

//Fetch all questions
router.get("/", async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "Error fetching questions" });
  }
});

//Check if a question exists for a specific gameId and category
router.get("/check-existence", async (req, res) => {
  try {
    const { gameId, category, round, value } = req.query;

    const exists = await doesDocumentExist({
      gameId: new ObjectId(gameId),
      category,
      round,
      value,
    });

    res.json({ exists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error checking document existence" });
  }
});

//Fetch all questions by ID
router.get("/:id", async (req, res) => {
  try {
    const questions = await Question.find({
      gameId: new ObjectId(req.params.id),
    });

    if (questions.length === 0) {
      return res
        .status(404)
        .json({ error: "No questions found for this game" });
    }

    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching questions" });
  }
});

//Add a new question
router.post("/", upload.none(), async (req, res) => {
  try {
    const { question, answer, gameId, category, value, round, imageId } =
      req.body;

    const newQuestion = new Question({
      question,
      answer,
      gameId,
      category,
      value,
      round,
      ...(imageId ? { imageId: new ObjectId(imageId) } : {}),
    });

    await newQuestion.save();
    res.json(newQuestion);
  } catch (err) {
    res.status(500).json({ error: "Error adding question" });
  }
});

//update a question by filters
router.post("/update", upload.none(), async (req, res) => {
  try {
    const { gameId, category, round, value, question, answer, imageId } =
      req.body;

    // Build update object dynamically
    const updateData = {
      question,
      answer,
    };

    if (imageId === "null") {
      updateData.imageId = null;
    } else if (imageId) {
      updateData.imageId = new ObjectId(imageId);
    }

    const updatedQuestion = await Question.findOneAndUpdate(
      {
        gameId: new ObjectId(gameId),
        category,
        round,
        value,
      },
      updateData,
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json(updatedQuestion);
  } catch (err) {
    res.status(500).json({ error: "Error updating question" });
  }
});

//find questions based on filters and update category value
router.put("/update-category", upload.none(), async (req, res) => {
  try {
    const { gameId, category, round, newCategory } = req.body;
    const updatedQuestions = await Question.updateMany(
      { gameId: new ObjectId(gameId), round: round, category: category },
      { $set: { category: newCategory } }
    );

    if (updatedQuestions.matchedCount === 0) {
      return res.status(404).json({ message: "No questions found to update" });
    }

    res.json(updatedQuestions);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: "Error updating questions", message: err.message });
  }
});

export default router;
