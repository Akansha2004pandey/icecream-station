require("dotenv").config()
const express = require('express');
const app = express();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const notifier = require('node-notifier');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const Products = require('./models/products');
const Admin = require('./models/Admin');
const bodyParser=require('body-parser');
//const paymentRoutes = require('./routes/payment');
let order=200;
const port = process.env.PORT||3000;

var category;
app.use(express.static(path.join(__dirname, 'public')));
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Mongodb Connected"))
  .catch((err) => console.log("Mongo Error", err));

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 3600000
  }

}));
app.use(flash());


app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
//app.use('/payment', paymentRoutes);
function showSuccessMessage(message) {
  notifier.notify({
    title: 'Success',
    message: message,
    sound: true, // Play a notification sound
    timeout: 3000 // Auto hide after 3 seconds
  });
}

app.get('/modee', async (req, res) => {
  mode = req.query.mode;

  req.session.mode = mode;
  console.log(mode);
  req.session.cart = [];
  try {
    const data = await Products.find({});

    if (data.length === 0) {
      console.log('No data found for category 2');
    }

    res.render("main.ejs", { data: data });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
})
app.get('/category', async (req, res) => {
  category = req.query.category;
  console.log(category);

  try {
    const data = await Products.find({ category: category });

    res.render("main.ejs", { data: data });



  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
})
app.get('/cart/cart', async (req, res) => {
  const itemId = req.query.itemId;
  const data = await Products.findOne({ _id: itemId });
  if (!data) {
    return res.status(404).send('Product not found');
  }
  const dataitems = {
    ...data.toObject(), 
    items: 1
  };
  if (!req.session.cart) {
    req.session.cart = [];
}
  const name = dataitems.productName;

  const existingItemIndex = req.session.cart.findIndex(item => item._id.toString() === dataitems._id.toString());
  if (existingItemIndex !== -1) {
      req.session.cart[existingItemIndex].items += 1;
  } else {
      req.session.cart.push(dataitems);
  }
  
  showSuccessMessage(`${name} added to cart successfully!`);

  const cart = req.session.cart;


  const category = data.category;
  res.redirect(`/category?category=${category}`);


})
app.get('/cart/items', (req, res) => {
  
  res.render("cart", { cart: req.session.cart });
})
app.get('/cart/increment', (req, res) => {
  const id = req.query.id;
  if (!req.session.cart || !Array.isArray(req.session.cart)) {
    return res.status(404).send('Cart is empty or not initialized');
  }
  const item = req.session.cart.find(cartItem => cartItem._id.toString() === id);
  item.items += 1;
  res.redirect('/cart/items');
})
app.get('/cart/decrement', (req, res) => {
  const id = req.query.id;
  if (!req.session.cart || !Array.isArray(req.session.cart)) {
    return res.status(404).send('Cart is empty or not initialized');
  }
  const item = req.session.cart.find(cartItem => cartItem._id.toString() === id);
  if (item.items > 1) {
    item.items -= 1;
  }


  res.redirect('/cart/items');
})
app.get('/cart/remove', (req, res) => {
  const id = req.query.id;
  if (!req.session.cart || !Array.isArray(req.session.cart)) {
    return res.status(404).send('Cart is empty or not initialized');
  }
  const initialLength = req.session.cart.length;
  req.session.cart = req.session.cart.filter(cartItem => cartItem._id.toString() !== id);
  if (req.session.cart.length === initialLength) {
    return res.status(404).send('Item not found in cart');
  }
  showSuccessMessage('Item removed from cart successfully!');
  if (!req.session.cart.length) {
    res.redirect(`/mode`);
  } else {
    
    res.redirect('/cart/items');
  }
})
app.get('/confirm', (req, res) => {

  let total = 0;
  if(!req.session.cart){
    res.redirect('/');
  }
  const cart = req.session.cart;
  
  
  cart.forEach((item) => {
    total += item.regularPrice * item.items;
  });
  
  req.session.total=total;
  const mode = req.session.mode;
  res.render('confirm', { cart, total, mode });
});
app.get('/cancel', (req, res) => {
  req.session.cart = [];
  res.redirect('/');
})
app.get('/order', async (req, res) => {
  const mode = req.query.mode;
  if(!req.session.cart){
    res.redirect("/");
 }
  

  if (req.session && req.session.cart) {
    order+=1;
    let orderId=uuidv4();
    if (mode === "cash") {
      const obj = {
        items: req.session.cart,
        totalPrice: req.session.total,
        payementMethod: mode,
        orderNo: order,
        orderId:orderId
      }
      if(!req.session.cart){
        res.redirect('/');
      }

      try {
        const data = await Admin.create(obj);
        

        req.session.destroy(err => {
          if (err) {
            return res.status(500).send('Failed to destroy session');
          }
          res.render("order", { order: order});
        });


      } catch (error) {
       
        console.error('Error creating order:', error);
        
        res.status(500).json({ message: 'Internal server error' });
      }
    }else{
       res.render("transaction",{order:order});
    }
  } else {
    res.redirect('/');
  }
})

app.get('/mode', (req, res) => {
  res.render("mode");
})

app.get('/', (req, res) => {
  res.render("homepage");
})
app.listen(port, () => {
  console.log(`listening to port ${port}`);
})
