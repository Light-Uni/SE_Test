const express = require("express");
const router = express.Router();
const auditController = require("../controllers/audit.controller");

const requireRole = require("../middlewares/roleMiddleware");

router.get("/", auditController.getAll);
router.get("/:id", auditController.get);
router.post("/", requireRole("MANAGER"), auditController.create);
router.post("/:id/items", auditController.addItem);
router.patch("/:id/confirm", requireRole("MANAGER"), auditController.confirm);

module.exports = router;
