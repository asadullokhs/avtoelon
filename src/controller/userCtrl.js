const User = require("../model/userModel");
const Car = require("../model/carModel");
const Comment = require("../model/commentsModel");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary");
const fs = require("fs");

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const removeTemp = (path) => {
  fs.unlink(path, (err) => {
    if (err) {
      throw err;
    }
  });
};

const userCtrl = {
  register: async (req, res) => {
    const { email } = req.body;

    try {
      const author = await User.findOne({ email });

      if (author) {
        return res.status(400).json({ message: "This email is already taken" });
      }

      const hashdedPassword = await bcrypt.hash(req.body.password, 10);

      req.body.password = hashdedPassword;

      const newAuthor = await User.create(req.body);

      const { password, ...otherDetails } = newAuthor._doc;

      const token = JWT.sign(otherDetails, JWT_SECRET_KEY, { expiresIn: "1h" });

      res.status(201).json({
        message: "Created successfully",
        author: otherDetails,
        token,
      });
    } catch (error) {
      console.log(error);
      res.status(503).json(error.message);
    }
  },
  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      if (email && password) {
        const oldUser = await User.findOne({ email });
        if (!oldUser) {
          return res.status(404).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(
          req.body.password,
          oldUser.password
        );
        if (!isPasswordCorrect) {
          return res
            .status(400)
            .json({ message: "Email or password is incorrect" });
        }

        const token = JWT.sign(
          { email: oldUser.email, _id: oldUser._id, role: oldUser.role },
          JWT_SECRET_KEY
        );

        const { password, ...otherDetails } = oldUser._doc;
        res
          .status(200)
          .send({ message: "Login successfully", user: otherDetails, token });
      } else {
        res.status(403).send({ message: "Please fill all fields" });
      }
    } catch (error) {
      res.status(503).send({ message: error.message });
      console.log(error);
    }
  },
  getUsers: async (req, res) => {
    try {
      const authors = await User.find().select(
        "firstname lastname email avatar"
      );

      res.status(200).json({ message: "All authors", authors });
    } catch (error) {
      console.log(error);
      res.status(503).json(error.message);
    }
  },
  getUserById: async (req, res) => {
    const { id } = req.params;

    try {
      const user = await User.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        {
          $lookup: {
            from: "cars",
            let: { author: "$_id" },
            pipeline: [{ $match: { $expr: { $eq: ["$author", "$$author"] } } }],
            as: "cars",
          },
        },
      ]);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      delete user[0].password;

      res.status(200).json({ message: "User", user });
    } catch (error) {
      console.log(error);
      res.status(503).json(error.message);
    }
  },
  updateUser: async (req, res) => {
    try {
      const { password } = req.body;
      const { id } = req.params;
      const { token } = req.headers;

      if (!token) {
        return res.status(403).json({ message: "Token is required" });
      }
      const user = await User.findById(id);

      if (id == user._id || user.role == "admin") {
        if (password && password !== "") {
          const hashdedPassword = await bcrypt.hash(password, 10);

          req.body.password = hashdedPassword;
        } else {
          delete req.body.password;
        }

        if (req.files) {
          const { avatar } = req.files;
          if (user.avatar) {
            let public_id = user.avatar?.public_id;
            await cloudinary.v2.uploader.destroy(public_id, async (err) => {
              if (err) {
                throw err;
              }
            });
          }

          const result = await cloudinary.v2.uploader.upload(
            avatar.tempFilePath,
            {
              folder: "Autoelon",
            },
            async (err, result) => {
              if (err) {
                throw err;
              }

              removeTemp(avatar.tempFilePath);

              return result;
            }
          );
          const rasm = { url: result.secure_url, public_id: result.public_id };

          req.body.avatar = rasm;
        }

        const updatedUser = await User.findByIdAndUpdate(id, req.body, {
          new: true,
        });

        if (!updatedUser) {
          return res.status(404).json({ message: "Not found" });
        }

        return res
          .status(200)
          .json({ message: "Updated succesfully", user: updatedUser });
      }
    } catch (error) {
      res.status(503).json(error.message);
    }
  },
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { token } = req.headers;

      if (!token) {
        res.status(403).send({ message: "Token is required" });
      }

      const currentUser = JWT.decode(token);

      if (id == currentUser._id || currentUser.role == "admin") {
        const deletedUser = await User.findByIdAndDelete(id);
        await Comment.deleteMany({authorId: id});
        const userCars = await Car.find({author: id})

        userCars.forEach(async car => {
          if(car?.image?.public_id){
            await cloudinary.v2.uploader.destroy(
              car.image.public_id,
              async (err) => {
                if (err) {
                  throw err;
                }
              }
            );
            await Car.findByIdAndDelete(car._id)
          }
        })

        if (!deletedUser) {
          return res.status(404).send({ message: "Not found" });
        }
        if (deletedUser.avatar?.public_id) {
          await cloudinary.v2.uploader.destroy(
            deletedUser.avatar.public_id,
            async (err) => {
              if (err) {
                throw err;
              }
            }
          );
        }

        return res
          .status(200)
          .send({ message: "Deleted succesfully", deletedUser, userCars });
      }

      res.status(405).send({ message: "Not allowed" });
    } catch (error) {
      res.status(503).send(error.message);
    }
  },
};

module.exports = userCtrl;
