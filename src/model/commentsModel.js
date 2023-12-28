const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
    },
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
    },
    content: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
