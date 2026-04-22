const express = require("express");
const router = express.Router();

const medicineController = require("../controllers/medicine.controller");
const upload = require("../middlewares/upload");

router.get("/", medicineController.getAll);
router.post("/", upload.single("image"), medicineController.create);
router.patch("/:id", upload.single("image"), medicineController.update);
router.patch("/:id/delete", medicineController.remove);
router.patch("/:id/restore", medicineController.restore);

module.exports = router;
