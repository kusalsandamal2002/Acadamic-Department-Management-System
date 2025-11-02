const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware.js");
const {
  getBookings,
  createBooking,
  updateBooking,
  deleteBooking,
} = require("../controllers/hallController.js");

const router = express.Router();

router.get("/", verifyToken, getBookings);
router.post("/", verifyToken, createBooking);
router.put("/:id", verifyToken, updateBooking);
router.delete("/:id", verifyToken, deleteBooking);

module.exports = router;
