const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware.js");
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController.js");

const router = express.Router();

router.get("/", verifyToken, getEvents);
router.post("/", verifyToken, createEvent);
router.put("/:id", verifyToken, updateEvent);
router.delete("/:id", verifyToken, deleteEvent);

module.exports = router;
