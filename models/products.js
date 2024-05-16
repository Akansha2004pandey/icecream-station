const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  regularPrice: {
    type: Number,
    required: true
  },
  productImage: {
    type: String,
    required: true
  },
  productQty: {
    type: Number,
    required: true
  }
});

const Products = mongoose.model('Products', productSchema,'Products');

module.exports = Products;
