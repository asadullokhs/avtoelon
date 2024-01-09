const mongoose = require("mongoose");

const carsSchema = new mongoose.Schema(
  {
    title: String,
    year: Number,
    price: String,
    class: String,
    location: String,
    description: String,
    isActive: Boolean,
    image: {
      type: String,
      default: "",
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Car", carsSchema);
