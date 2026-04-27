const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/import_request.controller");
const checkAuditLock = require("../middlewares/auditLockMiddleware");

const requireRole = require("../middlewares/roleMiddleware");

router.get("/", ctrl.getAll);
router.post("/", checkAuditLock, requireRole("MANAGER"), ctrl.create);
router.patch("/:id/receive", requireRole("STOREKEEPER"), ctrl.receive);
router.patch("/:id/reject", requireRole("STOREKEEPER", "MANAGER"), ctrl.reject);

module.exports = router;
