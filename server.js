const express = require('express')
const app = express()
var cors = require('cors')
const cloudinary = require('cloudinary')

const mongoose = require('mongoose')
// mongoose.connect('mongodb://localhost/ecomm-web-app-3')

mongoose.connect('mongodb+srv://Satyam:Satyam@cluster0.juvnkvf.mongodb.net/SocialMedia?retryWrites=true&w=majority')



const db = mongoose.connection
db.on('error',error=>console.log(error))
db.on('open', ()=>console.log('connected to mongoose'))

cloudinary.v2.config({
    cloud_name: "dxwsqa8dh",
    api_key: "574333474688782",
    api_secret: "qVBZJtC-Lo8pB0IvmNB7faneBPI",
  });

const userRouter = require('./routes/userRoutes')
const productRouter = require('./routes/productRoutes')
const orderRouter = require('./routes/orderRoutes')

app.use(express.json())
app.use(cors())
app.use('/', userRouter)
app.use('/', productRouter)
app.use('/', orderRouter)

app.listen(5500)

