const express = require("express");
const router = express.Router();

const carCtrl = require("../controller/carCtrl");

router.post("/", carCtrl.add);
router.get("/", carCtrl.getCars);
router.get("/:id", carCtrl.getCarById);
router.delete("/:id", carCtrl.deleteCar);
router.put("/:id", carCtrl.update);

module.exports = router;
