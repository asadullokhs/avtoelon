const express = require("express");
const router = express.Router();

const commentCtrl = require("../controller/commentCtrl");

router.post("/", commentCtrl.addComment);
router.get("/", commentCtrl.getComments);

module.exports = router;
