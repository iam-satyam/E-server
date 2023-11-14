const express = require('express')
const router = express.Router()
const multer  = require('multer')
const Product = require('../models/product')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
// const singleUpload = require('../middlewares/multer')
const getDataUri = require('../utils/datauri')
const cloudinary = require('cloudinary')
const storage = multer.memoryStorage();

const singleUpload = multer({
        storage: storage,
        limits: { fileSize: 1000*1000 } }).single("file");
 

const CATEGORIES = [
    'electronics',
    'furniture',
    'groceries',
    'clothes',
    'home appliances',
]

var JWT_SECRET = 'amitauthencates'

//add a product
router.post('/addProduct' , singleUpload  , async (req, res)=>{

    const { name, description, price, category } = req.body
    // console.log(req.body)
    const token = req.header('auth-token')
    if (!token) {
        res.status(401).send({ error: "Please authenticate using a valid token" })
    }
    const data = jwt.verify(token, JWT_SECRET);
    
    const file = req.file;
    
    try{
    
        const fileUri = getDataUri(file);
        const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
        // console.log(mycloud)

        console.log("mycloud" + mycloud)
        const product = Product({
            name : name,
            description : description,
            price : price,
            category : category,
            seller : data.user.id,
            image : {
                public_id : mycloud.public_id,
                url : mycloud.secure_url
            }
    })
    
    await product.save()
    res.json({product})
} catch(error){
    res.status(400).send(error)
    }
})

//Edit a product details
router.put('/product/:id/edit', async(req, res)=>{
    const { name, description, price, Stock } = req.body;
    let product = await Product.findOne({_id : req.params.id })
    if(!product) return res.status(500).json({error : "product with this id not found"})
    
    product.name = name
    product.description = description
    product.price = price
    product.Stock = Stock
    try{
        await product.save()
        res.status(200).json({product})
    }catch(error){
        res.status(400).json({error})
    }

})


//get all category products in a array of objects array.
router.get('/all-products', async (req, res)=>{
    let allProducts = []
    
        allProducts.push(await Product.find({category : CATEGORIES[0]}).limit(16))
        allProducts.push(await Product.find({category : CATEGORIES[1]}).limit(16))
        allProducts.push(await Product.find({category : CATEGORIES[2]}).limit(16))
        allProducts.push(await Product.find({category : CATEGORIES[3]}).limit(16))
        allProducts.push(await Product.find({category : CATEGORIES[4]}).limit(16))

    res.status(200).json({allProducts})
})


//get a product details
router.get('/product/:id', async (req, res)=>{
    //it is crashing if id passed is undefined
    // if(!req.params.id || req.params.id===undefined)
    // res.status(400).json({error : "provide correct product id"})
    const product = await Product.findOne({_id : req.params.id})
    if(!product)
    res.status(400).json({error : "no product found with this id"})

    res.status(200).json({product})
})

//get all products added by a user(seller)
router.get('/shop', async (req, res)=>{
    const products = await Product.find({seller : req.header('sellerId')})
    if(!products)
    res.status(400).json({error : "no product found in your shop"})

    res.status(200).json({products})
})

//get product list of a particular category
router.get('/product/:category', async (req, res)=>{
    
    const products = await Product.find({category : req.params.category})
    if(!products)
    res.status(400).json({error : "no product found with this id"})

    res.status(200).json({products})
})


//add a review
router.post('/product/:id/addReview', async (req, res)=>{

    const product = await Product.findOne({_id: req.params.id})
    if(!product)
    res.status(400).json({error : "no product found with this id"})

    const token = req.header('auth-token')
    if (!token) {
        console.log('token' + token)
        res.status(401).send({ error: "Please authenticate using a valid token" })
    }
    const data = jwt.verify(token, JWT_SECRET);

    const user = await User.findOne({_id : data.user.id})

    const review = {
        user : data.user.id,
        name :  user.name,
        avatar : user.avatar.url,
        rating : req.body.rating,
        comment : req.body.comment
    }

    try{
        product.numOfReviews = product.reviews.unshift(review)
        let rating = 0;
        //updates product rating
        product.reviews.forEach((review)=>{     
            rating = rating + review.rating;
        })
        
        product.ratings = rating/product.numOfReviews
        await product.save()
        res.status(200).json({product})
    } catch(error){
        res.status(500).json({error})
    }

})

//delete a product

module.exports = router