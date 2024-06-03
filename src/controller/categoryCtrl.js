const Category = require("../model/categoryModel");
const Car = require("../model/carModel");
const Comment = require("../model/commentsModel");
const mongoose = require("mongoose");
const fs = require("fs");
const cloudinary = require("cloudinary");

const JWT = require("jsonwebtoken");

const removeTemp = (path) => {
  fs.unlink(path, (err) => {
    if (err) {
      throw err;
    }
  });
};

const categoryCtrl = {
  add: async (req, res) => {
    const { image } = req.files;
    const { token } = req.headers;
    try {
      if (!token) {
        return res.status(403).json({ message: "Token is required" });
      }
      const format = image.mimetype.split("/")[1];

      if (format !== "png" && format !== "jpeg") {
        return res.status(403).send("File format inccorect");
      }

      const result = await cloudinary.v2.uploader.upload(
        image.tempFilePath,
        {
          folder: "Autoelon",
        },
        async (err, result) => {
          if (err) {
            throw err;
          }

          removeTemp(image.tempFilePath);

          return result;
        }
      );
      const rasm = { url: result.secure_url, public_id: result.public_id };

      req.body.image = rasm;

      const category = await Category.create(req.body);

      res
        .status(201)
        .send({ message: "Category added successfully", category });
    } catch (error) {
      res.status(503).send({ message: error.message });
    }
  },

  get: async (req, res) => {
    try {
      const category = await Category.aggregate([
        {
          $lookup: {
            from: "cars",
            let: { category: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$category", "$$category"] } } },
            ],
            as: "cars",
          },
        },
      ]);

      res.status(200).send({ message: "Categoryies list", category });
    } catch (error) {
      res.status(503).send({ message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { token } = req.headers;
      const { id } = req.params;
      if (!token) {
        return res.status(403).json({ message: "Token is required" });
      }

      const currentUser = JWT.decode(token);

      if (currentUser.role === "admin") {
        const category = await Category.findByIdAndDelete(id);

        if (!category) {
          return res.status(404).send({ message: "Category not found" });
        }

        const cars = await Car.find({ category: id });

        cars.forEach(async (car) => {
          await cloudinary.v2.uploader.destroy(car.public_id, async (err) => {
            if (err) {
              throw err;
            }
          });
          await Comment.deleteMany({ carId: car._id });
        });

        await cloudinary.v2.uploader.destroy(
          category.image.public_id,
          async (err) => {
            if (err) {
              throw err;
            }
          }
        );

        await Car.deleteMany({ category: id });

        res
          .status(200)
          .send({ message: "Category delete successfully", category });
      } else {
        res.status(405).json({ message: "Not allowed" });
      }
    } catch (error) {
      res.status(503).send({ message: error.message });
    }
  },
  getCategoryById: async (req, res) => {
    const { id } = req.params;

    try {
      const category = await Category.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        {
          $lookup: {
            from: "cars",
            let: { category: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$category", "$$category"] } } },
              {
                $lookup: {
                  from: "users",
                  let: { author: "$author" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$author"] } } },
                  ],
                  as: "author",
                },
              },
              {
                $unwind: "$author",
              },
            ],
            as: "cars",
          },
        },
      ]);

      res.status(200).json({ message: "Category", category });
    } catch (error) {
      console.log(error);
      res.status(503).json(error.message);
    }
  },
};

module.exports = categoryCtrl;
