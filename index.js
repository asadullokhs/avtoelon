const express = require("express");
const mongoose = require("mongoose");
const fileupload = require("express-fileupload");
const dotenv = require("dotenv");
dotenv.config();

const path = require("path");

const carRouter = require("./src/router/carRouter");
const commentRouter = require("./src/router/commentRouter");
const userRouter = require("./src/router/userRouter");

const app = express();
const PORT = process.env.PORT || 4002;

// Static file
app.use(express.static(path.join(__dirname, "src", "files")));

//middlewear
app.use(fileupload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// router
app.use("/user", userRouter);
app.use("/car", carRouter);
app.use("/comment", commentRouter);

mongoose
  .connect("mongodb://localhost:27017/ElonApp")
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server responded at ${PORT} PORT...`);
    });
  })
  .catch((err) => console.log(err));
