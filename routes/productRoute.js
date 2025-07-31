const express = require("express");
const {
  createProduct,
  getaProduct,
  getAllProduct,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  getWishlistCount,
  updateProduct,
  deleteProduct,
  // addToWishlist,
  getRelatedProducts,
  rating,
} = require("../controller/productCtrl");
const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");
const { productImgResize, uploadPhoto, uploadImages } = require("../middlewares/uploadImages");
const router = express.Router();

router.post("/", authMiddleware, isAdmin, createProduct);

router.put(
  "/upload/:id",
  authMiddleware,
  isAdmin,
  uploadPhoto.array("images", 10),
  productImgResize,
  uploadImages
);
router.get("/:id", getaProduct);
router.put("/wishlist", authMiddleware, addToWishlist);
router.put("/rating", authMiddleware, rating);
router.get('/related/:productId', getRelatedProducts);
router.get("/wishlist", authMiddleware, getWishlist);
router.delete("/wishlist", authMiddleware, removeFromWishlist);
router.delete("/wishlist/clear", authMiddleware, clearWishlist);
router.get("/wishlist/count", authMiddleware, getWishlistCount);

router.put("/:id", authMiddleware, isAdmin, updateProduct);
router.delete("/:id", authMiddleware, isAdmin, deleteProduct);

router.get("/", getAllProduct);

module.exports = router;
