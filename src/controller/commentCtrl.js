const Comment = require("../model/commentsModel");

const commentCtrl = {
  addComment: async (req, res) => {
    try {
      const newComment = await Comment.create(req.body);

      res.status(201).json({ message: "Succesfully added", newComment });
    } catch (error) {
      console.log(error);
      res.status(503).json(error.message);
    }
  },

  getComments: async (req, res) => {
    try {
      const comments = await Comment.find()
        .populate("authorId", "firstname")
        .populate("carId", "title");

      res.status(200).json({ message: "All comments", comments });
    } catch (error) {
      console.log(error);
      res.status(503).json(error.message);
    }
  },
};

module.exports = commentCtrl;
