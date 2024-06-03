const router = require("express").Router();
const categoryCtrl = require("../controller/categoryCtrl");

router.post("/", categoryCtrl.add);
router.get("/", categoryCtrl.get);
router.get("/:id", categoryCtrl.getCategoryById);
router.delete("/:id", categoryCtrl.delete);

module.exports = router;
