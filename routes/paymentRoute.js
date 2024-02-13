const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {authMiddleware} = require("../middlewares/authMiddleware");

//strip integration
router.post('/intent',async (req, res) => {
    try {      
      const {name} = req.body;
      if(!name) return res.status(400).json({message:"Please enter a name"});
      const paymentIntent = await stripe.paymentIntents.create({
        customer:customer.id,
        amount: req.body.amount,
        currency: 'INR',
        payment_method_types:["card"],
        metadata:{name},
      });
  
      res.json({ 
        paymentIntent: paymentIntent.client_secret,
         
      });
    } catch (err) {
      console.error(err)
      res.status(400).json({
        error: err.message,
      });
    }
});


//router endpoints
module.exports = router;