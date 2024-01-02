const router = require("express").Router();
const categoryCtrl = require("../controller/categoryCtrl");

router.post("/", categoryCtrl.add)
router.get("/", categoryCtrl.get)
router.get("/:carId", categoryCtrl.getOne)
router.delete("/:id", categoryCtrl.delete)
router.put("/:id", categoryCtrl.update)



module.exports = router