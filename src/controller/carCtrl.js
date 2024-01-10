const mongoose = require("mongoose");
const Car = require("../model/carModel");
const Comment = require("../model/commentsModel");
const fs = require("fs");
const path = require("path");
const JWT = require("jsonwebtoken");
const { v4 } = require("uuid");

const uploadsDir = path.join(__dirname, "../", "files");

const carCtrl = {
  add: async (req, res) => {
    const { token } = req.headers;
    try {
      if (!token) {
        res.status(403).send({ message: "Token is required" });
      }

      if (req.files) {
        const { image } = req.files;
        const format = image.mimetype.split("/")[1];

        if (format !== "png" && format !== "jpg" && format !== "jpeg") {
          return res.status(403).json({ message: "Format is incorrect" });
        }

        const nameImg = `${v4()}.${format}`;

        image.mv(path.join(uploadsDir, nameImg), (err) => {
          if (err) {
            res.status(503).send(err.message);
          }
        });
        req.body.image = nameImg;
        const car = await Car.create(req.body);
        res.status(201).send({
          message: "Car added successfully",
          car,
        });
      } else {
        res.status(403).send({ message: "Image is required!" });
      }
    } catch (error) {
      console.log(error);
      res.status(503).send(error.message);
    }
  },
  getCars: async (req, res) => {
    try {
      // const cars = await Car.find().populate("author", "firstname");
      const cars = await Car.aggregate([
        {
          $lookup: {
            from: "comments",
            let: { carId: "$_id" },
            pipeline: [{ $match: { $expr: { $eq: ["$carId", "$$carId"] } } }],
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "users",
            let: { author: "$author" },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$author"] } } }],
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
      ]);

      res.status(200).json({ message: "All cars", cars });
    } catch (error) {
      console.log(error);
      res.status(503).json(error.message);
    }
  },
  getCarById: async (req, res) => {
    const { id } = req.params;

    try {
      const car = await Car.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        {
          $lookup: {
            from: "comments",
            let: { carId: "$_id" },
            pipeline: [{ $match: { $expr: { $eq: ["$carId", "$$carId"] } } }],
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "users",
            let: { author: "$author" },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$author"] } } }],
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
      ]);

      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }

      res.status(200).json({ message: "Car", car });
    } catch (error) {
      console.log(error);
      res.status(503).json(error.message);
    }
  },
  deleteCar: async (req, res) => {
    try {
      const { id } = req.params;
      const { token } = req.headers;

      if (!token) {
        return res.status(403).send({ message: "Token is required" });
      }

      const currentCar = await JWT.decode(token);

      const car = await Car.findById(id);
      if (!car) {
        return res.status(404).send({ message: "Not found" });
      }
      if (car.author == currentCar._id || currentCar.role == "admin") {
        if (car.image) {
          await fs.unlink(path.join(uploadsDir, car.image), (err) => {
            if (err) {
              return res.status(503).send({ message: err.message });
            }
          });
        }
        await Comment.deleteMany({ carId: id });
        const deletedCar = await Car.findByIdAndDelete(id);

        return res
          .status(200)
          .send({ message: "Deleted succesfully", deletedCar });
      }

      res.status(405).send({ message: "Not allowed" });
    } catch (error) {
      res.status(503).send(error.message);
    }
  },
  update: async (req, res) => {
    const { id } = req.params;
    try {
      const { token } = req.headers;

      if (!token) {
        return res.status(403).send({ message: "Token is required" });
      }

      const currentCar = await JWT.decode(token);
      const car = await Car.findById(id);

      if (car.author == currentCar._id || currentCar.role == "admin") {
        if (car.image !== null || car.image !== "") {
          if (req.files) {
            await fs.unlink(path.join(uploadsDir, car.image), (err) => {
              if (err) {
                return res.status(503).json({ message: err.message });
              }
            });
            const { image } = req.files;

            const format = image.mimetype.split("/")[1];

            if (format !== "png" && format !== "jpg" && format !== "jpeg") {
              return res.status(403).json({ message: "Format is incorrect" });
            }

            const nameImg = `${v4()}.${format}`;

            image.mv(path.join(uploadsDir, nameImg), (err) => {
              if (err) {
                return res.status(503).json(err.message);
              }
            });

            req.body.image = nameImg;
          }
        }

        const cars = await Car.findByIdAndUpdate(id, req.body, {
          new: true,
        });

        return res.status(200).json({ message: "Updated succesfully", cars });
      }
    } catch (error) {
      res.status(503).json({ message: error.message });
    }
  },
};

module.exports = carCtrl;
