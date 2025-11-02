const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware.js");
const {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController.js");

const router = express.Router();

router.get("/", verifyToken, getCourses);
router.post("/", verifyToken, createCourse);
router.put("/:id", verifyToken, updateCourse);
router.delete("/:id", verifyToken, deleteCourse);

module.exports = router;
