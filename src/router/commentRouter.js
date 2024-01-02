const express = require("express");
const router = express.Router();

const commentCtrl = require("../controller/commentCtrl");

router.post("/", commentCtrl.addComment);
router.get("/:id", commentCtrl.getCommentById);
router.put("/:id", commentCtrl.updateComment);
router.delete("/:id", commentCtrl.deleteComment);

module.exports = router;
