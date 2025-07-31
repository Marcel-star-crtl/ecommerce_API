const mongoose = require("mongoose");

var productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'PCategory', required: true },
    brand: { type: String, required: true },
    quantity: { type: Number, required: true },
    sold: { type: Number, default: 0 },
    images: [{ public_id: String, url: String }],
    color: [],
    tags: { type: String, required: true },
    ratings: [
      {
        star: Number,
        comment: String,
        date: { type: Date, default: Date.now },
        postedby: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      }
    ],
    totalrating: { type: String, default: 0 },
    isFinalSale: { type: Boolean, default: false },
    size: { type: String, required: false },
    
    howToUse: { type: String, required: false },
    ingredients: { type: String, required: false },
    productionProcess: { type: String, required: false },
    benefits: [{ type: String }], 
    keyFeatures: [{ type: String }], 
    skinType: { type: String, required: false }, 
    applicationMethod: { type: String, required: false },
    beforeAfterImages: {
      before: { public_id: String, url: String },
      after: { public_id: String, url: String }
    },
    detailsImage: { public_id: String, url: String }, 
    productionImage: { public_id: String, url: String }, 
    
    metaTitle: { type: String, required: false },
    metaDescription: { type: String, required: false },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);