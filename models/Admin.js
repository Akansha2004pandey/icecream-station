const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the Cart Item Schema
const cartItemSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    default: () => new mongoose.Types.ObjectId(),
  },
  productName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  regularPrice: {
    type: Number,
    required: true,
  },
  productImage: {
    type: String,
    required: true,
  },
  productQty: {
    type: Number,
    required: true,
  },
  items: {
    type: Number,
    required: true,
  }
});

// Define the Cart Schema
const AdminSchema = new Schema({
  items: [cartItemSchema], // Array of cart items
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'online'],
    default: 'cash',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  orderNo:{
    type:Number,
     required:true
  },
  orderId:{
    type:String,
    required:true
  }
});

// Create the Cart model
const Admin = mongoose.model('Admin', AdminSchema,'Admin');

// Export the Cart model
module.exports = Admin;
