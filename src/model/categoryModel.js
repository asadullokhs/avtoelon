const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 3,
    },
    image: {
      type: Object,
      required: true,
    },
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
    },
  },
  {
    timeseries: true,
  }
);

module.exports = mongoose.model("categories", categorySchema);
