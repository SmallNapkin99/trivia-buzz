import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Game",
    required: true,
  },
  category: { type: String, required: true },
  value: { type: Number, required: true },
  round: { type: Number, required: true },
  imageId: { type: mongoose.Schema.Types.ObjectId, required: false },
});

const Question = mongoose.model("Question", questionSchema);

export default Question;
