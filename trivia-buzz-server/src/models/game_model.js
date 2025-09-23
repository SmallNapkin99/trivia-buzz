import mongoose from "mongoose";

const sampleQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: false },
    answer: { type: String, required: false },
    imageId: { type: mongoose.Schema.Types.ObjectId, required: false },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: false },
    round: { type: Number, required: true },
    sampleQuestion: { type: sampleQuestionSchema, required: false },
  },
  { _id: false }
);

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  questionTotal: { type: Number, required: true },
  categories: { type: [categorySchema], required: true },
  rounds: { type: Number, required: true },
});

const Game = mongoose.model("Game", gameSchema);

export default Game;
