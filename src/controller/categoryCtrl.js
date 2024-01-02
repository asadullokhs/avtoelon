const Category = require("../model/categoryModel");
const { v4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const uploadsDir = path.join(__dirname, "../", "files");

const categoryCtrl = {
  add: async (req, res) => {
    const { title } = req.body;
    const { image } = req.files;
    const { token } = req.headers;
    try {
      if (!token) {
        return res.status(403).json({ message: "Token is required" });
      }
      const format = image.mimetype.split("/")[1];

      if (!format !== "png" && format !== "jpeg") {
        return res.status(403).send("File format inccorect");
      }

      const nameImg = `${v4()}.${format}`;

      image.mv(path.join(uploadsDir, nameImg), (err) => {
        if (err) {
          return res.status(503).send({ message: err.message });
        }
      });

      const category = await Category.create({ title, image: nameImg });

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
      const { id } = req.params;
      const category = await Category.findByIdAndDelete(id);

      if (!category) {
        return res.status(404).send({ message: "Category not found" });
      }

      await fs.unlink(path.join(uploadsDir, category.image), (err) => {
        if (err) {
          return res.status(503).send({ message: err.message });
        }
      });

      res
        .status(200)
        .send({ message: "Category delete successfully", category });
    } catch (error) {
      res.status(503).send({ message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { title } = req.body;
      const { image } = req.files;

      const Products = await Category.findById(id);

      if (Products && image) {
        await fs.unlink(path.join(uploadsDir, Products.image), (err) => {
          if (err) {
            return res.status(503).send({ message: err.message });
          }
        });
      }

      const format = image.mimetype.split("/")[1];

      if (format !== "png" && format !== "jpeg") {
        return res.status(403).send({ message: "file format incorrect" });
      }

      const nameImg = `${v4()}.${format}`;

      image.mv(path.join(uploadsDir, nameImg), (error) => {
        if (error) {
          return res.status(503).send({ message: err.message });
        }
        Products.image = nameImg;
      });

      Products.title = title ? title : Products.title;
      const updateProducts = await Category.findByIdAndUpdate(id, Products, {
        new: true,
      });

      res.status(200).send({
        message: "Category update successfully",
        category: updateProducts,
      });
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
