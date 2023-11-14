const express = require('express')
const router = express.Router()
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const {body, validationResult} = require('express-validator')
const jwt = require('jsonwebtoken')
const fetchuser = require('../middlewares/fetchUser')

var JWT_SECRET = 'amitauthencates'

const multer  = require('multer')
const getDataUri = require('../utils/datauri')
const cloudinary = require('cloudinary')
const storage = multer.memoryStorage();

const singleUpload = multer({
        storage: storage,
        limits: { fileSize: 1*1000*1000 } }).single("avatar");

//signup user
router.post('/signup',  
        singleUpload,
        // body('name').exists(),
        // body('email').isEmail(),
        // body('password').isLength({min: 8 }),
        async (req, res)=>{

    let user = await User.findOne({email : req.body.email})
    if(user) return res.status(400).json([{error : "account with email already exists"}, {user : user}])

    // const errors = validationResult(req)
    // if(!errors.isEmpty())
    //     return res.status(400).json({errors : errors.array() })
    
        const salt = await bcrypt.genSalt(10)
        const secPass = await bcrypt.hash(req.body.password, salt)
        console.log(secPass)

        try{
                // console.log(req.file)
            // if(req.file!=undefined){
                const file = req.file;  // avatar image extraction from req object
                console.log(file)
                const fileUri = getDataUri(file);
                // console.log(fileUri)
                const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
                console.log(mycloud)
            // }       
        
            const user = User({
                name : req.body.name,
                email : req.body.email,
                password : secPass,
                role : req.body.role,
                // role : req.header('role'),
                avatar : {
                    public_id : mycloud.public_id || '',
                    url : mycloud.secure_url || ''
                }
        })
        await user.save()
        res.json({user})

    } catch(error){
        res.status(500).send(error)
    }
})

//user login page using email and password
router.post('/login', 
body('email').isLength({min: 5}),
body('password').isLength({min: 8})
,async (req, res)=>{

    const errors = validationResult(req)
    if(!errors.isEmpty()) return res.status(400).json({errors})

    let user = await User.findOne({email : req.body.email})
    // console.log(user)
    if(!user) return res.status(400).json({message : "Please enter correct email and password"})
    
    let isSame = await bcrypt.compare(req.body.password, user.password);
    if(!isSame) return res.status(400).json({message : "Please enter correct email and password"})
    
    const data = {
        user:{
            id: user.id
        }
    }
    
    const authtoken = jwt.sign(data, JWT_SECRET)
    res.status(200).json({authtoken: authtoken, user: user})
    //   console.log({authtoken})
})

//get user with auth-token
router.get('/user-auth', async (req, res)=>{
    const token = req.header('auth-token')

    try {
        const data = jwt.verify(token, JWT_SECRET);
        let user = await User.findOne({_id : data.user.id})
        res.status(200).json({user})

    } catch (error) {
        res.status(401).send({ error: "Please authenticate using a valid token" })
    }

})

//get user details with user id
router.get('/user/:id', fetchuser, async (req, res)=>{

    try {
        let user = await User.findOne({_id : req.params.id})
        if(!user) return res.status(400).json({error : "user with this email not found"})
        
        res.status(200).json({user : user})
        console.log(data.user)

    } catch (error) {
        res.status(401).send({ error: "Please authenticate using a valid token" })
    }

})




//edit user details
router.put('/:id/edit', async (req, res)=>{
    let user = await User.findOne({id : req.params.id})
    if(!user) return res.status(500).json({error : "user with this id not found"})
    
    user.name = req.body.name
    user.email = req.body.email
    
    await user.save()
    res.status(200).json({user : user})
})

//delete a user
router.delete('/:id/delete', async (req, res)=>{
    let user = await User.findOne({id : req.params.id})
    if(!user) return res.status(500).json({error : "user with this id not found"})
    
    await user.remove()
    res.status(200).json([{message : "user deleted"}, {user: user}])
})

module.exports = router