const express = require("express");
const router = express.Router();

const userCtrl = require("../controller/userCtrl");

router.post("/register", userCtrl.register);
router.get("/", userCtrl.getUsers);
router.post("/login", userCtrl.login);
router.get("/:id", userCtrl.getUserById);
router.put("/:id", userCtrl.updateUser);
router.delete("/:id", userCtrl.deleteUser);

module.exports = router;
