// const express = require("express");
// const {
//   createCategory,
//   updateCategory,
//   deleteCategory,
//   getCategory,
//   getallCategory,
// } = require("../controller/prodcategoryCtrl");
// const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
// const router = express.Router();

// router.post("/", authMiddleware, isAdmin, createCategory);
// router.put("/:id", authMiddleware, isAdmin, updateCategory);
// router.delete("/:id", authMiddleware, isAdmin, deleteCategory);
// router.get("/:id", getCategory);
// router.get("/", getallCategory);

// module.exports = router;










// routes/prodcategoryRoute.js
const express = require("express");
const {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getallCategory,
  getCategoryProducts, // Ensure this is imported
} = require("../controller/prodcategoryCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { uploadPhoto, productImgResize, uploadCategoryImages } = require("../middlewares/catUploadImage");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  isAdmin,
  uploadPhoto.single("image"),
  createCategory
);
router.put(
  "/upload/:id",
  authMiddleware,
  isAdmin,
  uploadPhoto.single("image"),
  productImgResize,
  uploadCategoryImages
);
router.put("/:id", authMiddleware, isAdmin, updateCategory);
router.delete("/:id", authMiddleware, isAdmin, deleteCategory);

// *** CRITICAL FIX: Place the more specific route first ***
router.get("/:id/products", getCategoryProducts);

// The general :id route should come after more specific ones
router.get("/:id", getCategory);
router.get("/", getallCategory);

module.exports = router;