const express= require('express')
const router = express.Router()
const Order = require('../models/order')
const jwt = require('jsonwebtoken')

var JWT_SECRET = 'amitauthencates'


//place an order
router.post('/placeOrder', async (req, res)=>{

    const token = req.header('auth-token')
    if(!token) res.status(400).json({error : "login first"})

    const data = jwt.verify(token, JWT_SECRET)

    try{
        const order = Order({
            shippingInfo : req.body.shippingInfo,
            orderItems : req.body.orderItems,
            user : data.user.id
    })

    await order.save()
    res.status(200).json({order})
} catch(error){
    res.status(500).json({error})

    console.log(error)
}
})

//get order details
router.get('/order/:id', async (req, res)=>{
   
   try{
       const order = await Order.findOne({_id : req.params.id})
       if(!order)
            return res.status(400).json({error:"no order found with this id"})
            
            res.status(200).json({order})
    }catch(error){
             res.status(500).json({error})
    }
})

//cancel or delete an order
router.delete('/order/:id/delete', async (req, res)=>{
    try{
        const order = await Order.findOne({_id : req.params.id})
        if(!order)
            return res.status(400).json({error:"no order found with this id"})

            //  res.status(200).json({order})
            await order.remove()
            res.status(200).json({message : "order deleted"},{order : order})
     }catch(error){
              res.status(500).json({error})
     }
})


module.exports = router