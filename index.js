const express=require('express');
const app=express();
const path=require('path');
const notifier = require('node-notifier');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const Cart=require('./models/cart')
const Products=require('./models/products');



const port=3000;


var category;
app.use(express.static(path.join(__dirname, 'public')));
mongoose.connect('mongodb://127.0.0.1:27017/kiosk')
.then(()=>console.log("Mongodb Connected"))
.catch((err)=>console.log("Mongo Error",err));

app.use(session({
    secret: 'secret', 
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 3600000 
      }

  }));
  app.use(flash());

  
app.set("view engine","ejs");
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
function showSuccessMessage(message) {
  notifier.notify({
    title: 'Success',
    message: message,
    sound: true, // Play a notification sound
    timeout: 3000 // Auto hide after 3 seconds
  });
}

app.get('/modee',async (req,res)=>{
  mode = req.query.mode;
  
  req.session.mode=mode;
  console.log(mode);
  req.session.cart=[];
  try {
    const data = await Products.find({});
   
    if (data.length === 0) {
      console.log('No data found for category 2');
    }
  
    res.render("main.ejs",{data:data});
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
})
app.get('/category',async (req,res)=>{
  category = req.query.category;
  console.log(category);

  try {
    const data = await Products.find({category:category});
    
    res.render("main.ejs",{data:data});

   
   
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
})
app.get('/cart/cart',async (req,res)=>{
    const itemId=req.query.itemId;
    const data=await Products.findOne({_id:itemId});
    data.items=1;
    const name=data.productName;
    req.session.cart.push(data);
    console.log(req.session.cart);
    showSuccessMessage(`${name} added to cart successfully!`);
    
    const cart=req.session.cart;
    
   
    const category=data.category;
    res.redirect(`/category?category=${category}`);


})
app.get('/cart/items',(req,res)=>{
   
  
   res.render("cart",{cart:req.session.cart});
})
app.get('/mode',(req,res)=>{
    res.render("mode");
})

app.get('/',(req,res)=>{
    res.render("homepage");
})
app.listen(port,()=>{
    console.log(`listening to port ${port}`);
})
