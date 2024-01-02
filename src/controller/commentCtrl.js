const Comment = require("../model/commentsModel");
const mongoose = require("mongoose");
const JWT = require("jsonwebtoken");

const commentCtrl = {
  addComment: async (req, res) => {
    try {
      const { token } = req.headers;
      if (!token) {
        return res.status(403).json({ message: "Token is required" });
      }
      const newComment = await Comment.create(req.body);

      res.status(201).json({ message: "Succesfully added", newComment });
    } catch (error) {
      console.log(error);
      res.status(503).json(error.message);
    }
  },

  getCommentById: async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await Comment.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        {
          $lookup: {
            from: "users",
            let: { authorId: "$authorId" },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$authorId"] } } }],
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
      ]);

      res.status(200).json({ message: "One comment", comment });
    } catch (error) {
      console.log(error);
      res.status(503).json(error.message);
    }
  },

  deleteComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { token } = req.headers;

      if (!token) {
        return res.status(403).send({ message: "Token is required" });
      }

      const currentUser = await JWT.decode(token);

      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).send({ message: "Not found" });
      }
      if (comment.authorId == currentUser._id || currentUser.role == "admin") {
        const deletedComment = await Comment.findByIdAndDelete(id);

        return res
          .status(200)
          .send({ message: "Deleted succesfully", deletedComment });
      }

      res.status(405).send({ message: "Not allowed" });
    } catch (error) {
      res.status(503).send(error.message);
    }
  },

  updateComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { token } = req.headers;

      if (!token) {
        return res.status(403).send({ message: "Token is required" });
      }

      const currentUser = await JWT.decode(token);
      const comment = await Comment.findById(id);

      if (comment.authorId == currentUser._id || currentUser.role == "admin") {
        const comments = await Comment.findByIdAndUpdate(id, req.body, {
          new: true,
        });

        return res
          .status(200)
          .send({ message: "Updated succesfully", comments });
      }
    } catch (error) {
      res.status(503).send({ message: error.message });
    }
  },
};

module.exports = commentCtrl;
