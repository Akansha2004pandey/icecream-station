const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    category: { type: String, required: true },
    regularPrice: { type: Number, required: true },
    productImage: { type: String, required: true },
    productQty: { type: Number, required: true },
    items: { type: Number, required: true }
    // Assuming mode is defined in your schema
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
