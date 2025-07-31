const Product = require("../models/productModel");
const User = require("../models/userModel");
const Category = require("../models/prodcategoryModel.js");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");
const cloudinaryUploadingImg = require("../utils/cloudinary");
const shuffleArray = require("../utils/shuffleArray");

const createProduct = asyncHandler(async (req, res) => {
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }

    const category = await Category.findOne({ title: req.body.category });
    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }

    req.body.category = category._id;

    // Handle different types of image uploads
    if (req.files && req.files.length > 0) {
      const mainImages = [];
      let detailsImage = null;
      let productionImage = null;
      let beforeImage = null;
      let afterImage = null;

      for (const file of req.files) {
        const uploadResult = await cloudinary.uploader.upload(file.buffer.toString('base64'), {
          folder: "products",
        });

        const imageData = {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url
        };

        switch (file.fieldname) {
          case 'detailsImage':
            detailsImage = imageData;
            break;
          case 'productionImage':
            productionImage = imageData;
            break;
          case 'beforeImage':
            beforeImage = imageData;
            break;
          case 'afterImage':
            afterImage = imageData;
            break;
          default:
            mainImages.push(imageData);
        }
      }

      req.body.images = mainImages;
      if (detailsImage) req.body.detailsImage = detailsImage;
      if (productionImage) req.body.productionImage = productionImage;
      if (beforeImage && afterImage) {
        req.body.beforeAfterImages = {
          before: beforeImage,
          after: afterImage
        };
      }
    }

    // Handle benefits and keyFeatures arrays
    if (req.body.benefits && typeof req.body.benefits === 'string') {
      req.body.benefits = req.body.benefits.split(',').map(benefit => benefit.trim());
    }
    
    if (req.body.keyFeatures && typeof req.body.keyFeatures === 'string') {
      req.body.keyFeatures = req.body.keyFeatures.split(',').map(feature => feature.trim());
    }

    const newProduct = await Product.create({
      ...req.body,
      isFinalSale: req.body.isFinalSale || false,
      size: req.body.size,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      featured: req.body.featured || false
    });

    await Category.findByIdAndUpdate(category._id, {
      $push: { products: newProduct._id }
    });

    res.json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: error.message });
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id); 

  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }

    if (req.body.category) {
      const category = await Category.findOne({ title: req.body.category });
      if (!category) {
        return res.status(400).json({ message: "Category not found" });
      }
      req.body.category = category._id;
    }

    // Handle array fields
    if (req.body.benefits && typeof req.body.benefits === 'string') {
      req.body.benefits = req.body.benefits.split(',').map(benefit => benefit.trim());
    }
    
    if (req.body.keyFeatures && typeof req.body.keyFeatures === 'string') {
      req.body.keyFeatures = req.body.keyFeatures.split(',').map(feature => feature.trim());
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true, 
    }).populate('category');

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product", error: error.message });
  }
});

// Get single product with all details
const getaProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const foundProduct = await Product.findById(id)
      .populate('category', 'title')
      .populate('ratings.postedby', 'firstname lastname');
    
    if (!foundProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json(foundProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully", deletedProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const getAllProduct = asyncHandler(async (req, res) => {
  try {
    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields", "size"];
    excludeFields.forEach((el) => delete queryObj[el]);
    
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Product.find(JSON.parse(queryStr)).populate('category', 'title');

    if (req.query.title) {
      query = query.where('title', new RegExp(req.query.title, 'i'));
    }

    if (req.query.tags) {
      query = query.where('tags', req.query.tags);
    }

    if (req.query.featured) {
      query = query.where('featured', req.query.featured === 'true');
    }

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.size) || 10;
    const skip = (page - 1) * limit;
    
    const totalCount = await Product.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      if (skip >= totalCount) throw new Error("This Page does not exist");
    }

    const products = await query;
    
    res.json({
      results: products,
      count: totalCount,
      page: page,
      pages: Math.ceil(totalCount / limit)
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const getRelatedProducts = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  try {
    const product = await Product.findById(productId).populate('category');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: productId },
      isActive: true
    }).populate('category', 'title');

    relatedProducts = shuffleArray(relatedProducts);
    relatedProducts = relatedProducts.slice(0, 10);

    res.json(relatedProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const getWishlist = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.user;
    validateMongoDbId(_id);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.size) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(_id).populate({
      path: 'wishlist',
      populate: {
        path: 'category',
        select: 'title'
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const totalCount = user.wishlist.length;
    const paginatedWishlist = user.wishlist.slice(skip, skip + limit);

    const formattedProducts = paginatedWishlist.map(product => ({
      id: product._id,
      _id: product._id,
      title: product.title,
      name: product.title,
      description: product.description,
      price: product.price,
      brand: product.brand,
      category: product.category,
      images: product.images,
      size: product.size,
      quantity: product.quantity,
      isFinalSale: product.isFinalSale,
      tags: product.tags,
      ratings: product.ratings,
      totalrating: product.totalrating,
      slug: product.slug,
      itemNumber: product._id.toString().slice(-8).toUpperCase()
    }));

    res.json({
      products: formattedProducts,
      count: totalCount,
      page: page,
      pages: Math.ceil(totalCount / limit),
      product_details: {
        results: formattedProducts,
        count: totalCount,
        page: page,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Failed to fetch wishlist' });
  }
});

const addToWishlist = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.body;
    const { _id: userId } = req.user;

    validateMongoDbId(userId);
    
    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required.' });
    }
    validateMongoDbId(productId);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(userId).select('+wishlist');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const isAlreadyInWishlist = user.wishlist.some(
      (item) => item && item.equals(productId)
    );

    if (isAlreadyInWishlist) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    user.wishlist.push(productId);
    await user.save();

    const updatedUserForLog = await User.findById(userId).select('wishlist');

    res.status(200).json({
      message: 'Product added to wishlist successfully',
      wishlistCount: user.wishlist.length
    });
  } catch (error) {
    console.error(`[addToWishlist] Uncaught error:`, error);
    res.status(500).json({ message: 'Failed to add product to wishlist', error: error.message });
  }
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.body;
    const { _id: userId } = req.user;

    validateMongoDbId(userId);
    validateMongoDbId(productId);

    const user = await User.findById(userId).select('+wishlist');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const productExistsInWishlist = user.wishlist.some(
      (item) => item && item.equals(productId)
    );

    if (!productExistsInWishlist) {
      return res.status(400).json({ message: 'Product not found in wishlist' });
    }

    user.wishlist = user.wishlist.filter(id => !id.equals(productId));
    await user.save();

    res.status(200).json({
      message: 'Product removed from wishlist successfully',
      wishlistCount: user.wishlist.length
    });
  } catch (error) {
    console.error('[removeFromWishlist]', error);
    res.status(500).json({ message: 'Failed to remove product from wishlist' });
  }
});

const clearWishlist = asyncHandler(async (req, res) => {
  try {
    const { _id: userId } = req.user;
    validateMongoDbId(userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.wishlist = [];
    await user.save();

    res.status(200).json({
      message: 'Wishlist cleared successfully',
      wishlistCount: 0
    });
  } catch (error) {
    console.error('[clearWishlist]', error);
    res.status(500).json({ message: 'Failed to clear wishlist' });
  }
});

const getWishlistCount = asyncHandler(async (req, res) => {
  try {
    const { _id: userId } = req.user;
    validateMongoDbId(userId);

    const user = await User.findById(userId).select('wishlist');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ count: user.wishlist.length });
  } catch (error) {
    console.error('[getWishlistCount]', error);
    res.status(500).json({ message: 'Failed to get wishlist count' });
  }
});

const rating = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { star, prodId, comment } = req.body;

  if (!star || !prodId || !comment) {
    return res.status(400).json({ message: 'Star rating, product ID, and comment are required' });
  }

  try {
    const product = await Product.findById(prodId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let alreadyRated = product.ratings.find(
      (userId) => userId.postedby.toString() === _id.toString()
    );

    const currentDate = new Date();

    if (alreadyRated) {
      await Product.updateOne(
        { _id: prodId, "ratings._id": alreadyRated._id },
        { $set: { "ratings.$.star": star, "ratings.$.comment": comment, "ratings.$.date": currentDate } },
        { new: true }
      );
    } else {
      await Product.findByIdAndUpdate(
        prodId,
        {
          $push: {
            ratings: {
              star,
              comment,
              date: currentDate,
              postedby: _id,
            },
          },
        },
        { new: true }
      );
    }

    const allRatings = await Product.findById(prodId);
    const totalRating = allRatings.ratings.length;
    const ratingSum = allRatings.ratings.reduce((acc, item) => acc + item.star, 0);
    const actualRating = Math.round(ratingSum / totalRating);
    const finalProduct = await Product.findByIdAndUpdate(
      prodId,
      { totalrating: actualRating },
      { new: true }
    );

    res.json(finalProduct);
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
});

const uploadImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const uploader = (path) => cloudinaryUploadingImg(path);
    const urls = [];
    const files = req.files;
    for (const file of files) {
      const { path } = file;
      const newPath = await uploader(path);
      urls.push(newPath);
      fs.unlinkSync(path);
    }
    const product = await Product.findByIdAndUpdate(
      id,
      {
        $push: { images: { $each: urls } },
      },
      { new: true }
    );
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = {
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
  rating,
  uploadImages,
  getRelatedProducts
};