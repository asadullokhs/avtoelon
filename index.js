const express = require("express");
const mongoose = require("mongoose");
const fileupload = require("express-fileupload");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();

const path = require("path");

const carRouter = require("./src/router/carRouter");
const commentRouter = require("./src/router/commentRouter");
const userRouter = require("./src/router/userRouter");
const categoryRouter = require("./src/router/categoryRouter");

const app = express();
const PORT = process.env.PORT || 4002;

// Static file
app.use(express.static(path.join(__dirname, "src", "files")));

//middlewear
app.use(fileupload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// router
app.use("/user", userRouter);
app.use("/car", carRouter);
app.use("/comment", commentRouter);
app.use("/category", categoryRouter);

const MONGO_URL = process.env.MONGO_URL;

mongoose
  .connect(MONGO_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server responded at ${PORT} PORT...`);
    });
  })
  .catch((error) => console.log(error));
