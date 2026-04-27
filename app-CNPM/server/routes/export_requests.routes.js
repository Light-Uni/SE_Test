const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/export_request.controller");
const checkAuditLock = require("../middlewares/auditLockMiddleware");

const requireRole = require("../middlewares/roleMiddleware");

router.get("/my", ctrl.getMy);
router.get("/", ctrl.getAll);
router.post("/", checkAuditLock, requireRole("REQUESTER", "MANAGER"), ctrl.create);
router.patch("/:id/approve", requireRole("MANAGER"), ctrl.approve);
router.patch("/:id/reject", requireRole("MANAGER"), ctrl.reject);
router.patch("/:id/complete", requireRole("STOREKEEPER"), ctrl.complete);

module.exports = router;
