const Category = require("../models/prodcategoryModel.js");
const Product = require("../models/productModel.js"); 
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const { cloudinaryUploadImg } = require("../utils/cloudinary");

const createCategory = asyncHandler(async (req, res) => {
  try {
    let newCategory;
    if (req.file) {
      const file = req.file.path;
      const uploadResult = await cloudinaryUploadImg(file, 'categories');
      newCategory = await Category.create({
        title: req.body.title,
        image: {
          public_id: uploadResult.public_id,
          url: uploadResult.url,
        },
      });
    } else {
      newCategory = await Category.create({
        title: req.body.title,
      });
    }
    res.json(newCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    let updatedCategory;
    if (req.file) {
      const file = req.file.path;
      const uploadResult = await cloudinaryUploadImg(file, 'categories');
      updatedCategory = await Category.findByIdAndUpdate(
        id,
        {
          title: req.body.title,
          image: {
            public_id: uploadResult.public_id,
            url: uploadResult.url,
          },
        },
        { new: true }
      );
    } else {
      updatedCategory = await Category.findByIdAndUpdate(
        id,
        { title: req.body.title },
        { new: true }
      );
    }
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const category = await Category.findById(id);
    if (category) {
      await Category.findByIdAndDelete(id);
      res.json({ message: "Category deleted successfully" });
    } else {
      res.status(404).json({ message: "Category not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    // Get products that belong to this category
    const products = await Product.find({ category: id }).populate('category');
    
    res.json({
      ...category.toObject(),
      products: products
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const getallCategory = asyncHandler(async (req, res) => {
  try {
    const categories = await Category.find();
    
    // Get product count for each category
    const categoriesWithProductCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ category: category._id });
        return {
          ...category.toObject(),
          productCount: productCount
        };
      })
    );
    
    res.json(categoriesWithProductCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add this new function to get products by category with pagination
const getCategoryProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id); // This validation will now apply to the correct route

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.pageSize) || 10; // *** FIX: Changed from 'size' to 'pageSize' ***
    const skip = (page - 1) * limit;

    // Fetch the category to get its title and ensure it exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Get total count of products for this category
    const totalCount = await Product.countDocuments({ category: id });

    // Get products with pagination
    const products = await Product.find({ category: id })
      .populate('category') // Populate category details if needed for each product
      .skip(skip)
      .limit(limit)
      .sort('-createdAt'); // Sort by creation date, newest first

    res.json({
      products: products, // *** FIX: Renamed 'results' to 'products' ***
      totalProductsCount: totalCount, // *** FIX: Renamed 'count' to 'totalProductsCount' ***
      categoryName: category.title, // *** FIX: Include the category title in the response ***
      page: page,
      pages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    // Log the error for debugging on the backend
    console.error("Error in getCategoryProducts:", error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getallCategory,
  getCategoryProducts, // Add this export
};

