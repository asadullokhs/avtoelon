const Comment = require("../model/commentsModel");
const mongoose = require("mongoose");

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

  deleteComment: async (req, res) => {},
};

module.exports = commentCtrl;
