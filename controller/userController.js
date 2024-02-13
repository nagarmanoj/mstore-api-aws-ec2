const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const uniqid = require("uniqid");
const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/jwtToken");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshtoken");
const jwt = require("jsonwebtoken");
const { get } = require("mongoose");
const sendEmail = require("./emailController");
const crypto = require("crypto");


const sendVerificationEmail = async (email, verificationToken) => {
    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
        // Configure the email service or SMTP details here
        service: "gmail",
        auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASSWORD,
        },
        // host: "smtp.gmail.com",
        // port: 587,
        // secure: false, // true for 465, false for other ports
        // auth: {
        //   user: process.env.EMAIL_ID, // generated ethereal user
        //   pass: process.env.EMAIL_PASSWORD, // generated ethereal password
        // },
    });
  
    // Compose the email message
    const mailOptions = {
      from: "mcommerce.com",
      to: email,
      subject: "Email Verification",
      text: `Please click the following link to verify your email: http://localhost:5000/verify/${verificationToken}`,
    };
  
    // Send the email
    try {
      await transporter.sendMail(mailOptions);
      console.log("Verification email sent successfully");
    } catch (error) {
      console.error("Error sending verification email:", error);
    }
};
/** Create User */
const createUser = async(req,res) =>{
    try{
        const {name,email,password,mobile} = req.body;
        //console.log(name,email,password,mobile)
        //Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("Email already registered:", email); // Debugging statement
            return res.status(400).json({ message: "Email already registered" });
        }
        const existingPhone = await User.findOne({ mobile });
        if (existingPhone) {
            console.log("Phone number already taken", mobile); // Debugging statement
            return res.status(400).json({ message: "Phone number already registered" });
        }
        
        // Create a new user
        const newUser = new User({ name, email, password,mobile });
        // Generate and store the verification token
        newUser.verificationToken = crypto.randomBytes(20).toString("hex");

        // Save the user to the database
        await newUser.save();

        // Debugging statement to verify data
        console.log("New User Registered:", newUser);

        // Send verification email to the user
        // Use your preferred email service or library to send the email
        //sendVerificationEmail(newUser.email, newUser.verificationToken);

        res.status(201).json({
        message:
            "Registration successful. Please check your email for verification.",
        });
    }catch(error){
        console.log("Error during registration",error);
        res.status(500).json({message:"Registration Failed"});
    }
};

/** Login User */
const loginUser = async(req,res)=>{
    try{
        const { email, password } = req.body;
        const findUser = await User.findOne({ email });
        //check if the password is correct        
        
        if(findUser &&(await findUser.isPasswordMatched(password))){
            const refreshToken = generateRefreshToken(findUser?._id);
            const updateuser = await User.findByIdAndUpdate(
                findUser.id,
                {
                    refreshToken:refreshToken,
                },
                {
                    new:true
                }
            );
            res.cookie('refreshToken',refreshToken,{
                httpOnly:true,
                maxAge:72*60*60*1000,
            })
            res.json({
                _id:findUser?._id,
                name:findUser?.name,                
                email:findUser?.email,
                role:findUser?.role,
                mobile:findUser?.mobile,
                verified:findUser?.verified,
                isBlocked:findUser?.isBlocked,
                cart:findUser?.cart,
                orders:findUser?.orders,
                wishlist:findUser?.wishlist,
                addresses:findUser?.addresses,
                token: generateToken(findUser._id),
            });
        }
        
    }catch(error){
        console.log("Error during Login",error);
        res.status(500).json({message:"Sign In Failed !"});
    }
    
};
/** Login Admin */
const loginAdmin = asyncHandler(async(req,res)=>{
    const { email, password } = req.body;
    const findAdmin = await User.findOne({ email });
    if(findAdmin.role !=="admin") throw new Error("Not Authorize");
    if(findAdmin &&(await findAdmin.isPasswordMatched(password))){
        const refreshToken = generateRefreshToken(findAdmin?._id);
        const updateuser = await User.findByIdAndUpdate(
            findAdmin.id,
            {
                refreshToken:refreshToken,
            },
            {
                new:true
            }
        );
        res.cookie('refreshToken',refreshToken,{
            httpOnly:true,
            maxAge:72*60*60*1000,
        })
        res.json({
            _id:findAdmin?._id,
            firstname:findAdmin?.firstname,
            lastname:findAdmin?.lastname,
            email:findAdmin?.email,
            role:findAdmin?.role,
            mobile:findAdmin?.mobile,
            token: generateToken(findAdmin._id),
        });
    }else{
        throw new Error("Invalid Creadential");
    }
    
});
//handle refresh token
const handleRefreshToken = asyncHandler(async(req,res)=>{
    const cookie = req.cookies;
    console.log(cookie);
    if(!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
    const refreshToken = cookie.refreshToken;
    console.log(refreshToken);
    const user = await User.findOne({ refreshToken });
    if(!user) throw new Error("No Refresh token present in db or not match");
    jwt.verify(refreshToken,process.env.JWT_SECRET,(err,decoded)=>{
        if(err || user.id !== decoded.id){
            throw new Error("There is something wrong with refresh token");
        }
        const accessToken = generateToken(user?._id);
        res.json({ accessToken });
    });
});
//logout functionality
const logout = asyncHandler(async(req,res)=>{
    const cookie = req.cookies;
    if(!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if(!user){
        res.clearCookie("refreshToken",{
            httpOnly:true,
            secure:true
        });
        return res.sendStatus(204);
    }
    await User.findOneAndUpdate(refreshToken,{
        refreshToken:"",
    });
    res.clearCookie("refreshToken",{
        httpOnly:true,
        secure:true
    });
    res.sendStatus(204);
});
/** Update a user */
const updatedUser = asyncHandler(async(req,res)=>{
    const {_id} = req.user;
    validateMongoDbId(_id);
    try{
        const updatedUser = await User.findByIdAndUpdate(_id,{
            firstname:req?.body?.firstname,
            lastname:req?.body?.lastname,
            email:req?.body?.lastname,
            mobile:req?.body?.mobile,
        },{
            new:true,
        });
        res.json(updatedUser);
        
    }catch (error){
        throw new Error(error);
    }
});

// save user Address

const saveAddress = asyncHandler(async (req, res, next) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
  
    try {
      const updatedUser = await User.findByIdAndUpdate(
        _id,
        {
          address: req?.body?.address,
        },
        {
          new: true,
        }
      );
      res.json(updatedUser);
    } catch (error) {
      throw new Error(error);
    }
});

/** Get All User */
const getallUser = asyncHandler(async(req,res)=>{
    try{
        const getUsers = await User.find();
        res.json(getUsers);
    }catch (error){
        throw new Error(error);
    }
});

/** Get Single User */
const getaUser = asyncHandler( async(req,res)=>{
    const {id} = req.params;
    validateMongoDbId(id);
    try{
        const getaUser = await User.findById(id);
        res.json({
            getaUser,
        })
    }catch (error){
        throw new Error(error);
    }
});

/** Get Delete User */
const deleteaUser = asyncHandler( async(req,res)=>{
    const {id} = req.params;
    validateMongoDbId(id);
    try{
        const deleteaUser = await User.findByIdAndDelete(id);
        res.json({
            deleteaUser,
        })
    }catch (error){
        throw new Error(error);
    }
});

/** Block User */
const blockUser = asyncHandler(async(req,res)=>{
    const {id}= req.params;
    validateMongoDbId(id);
    try{
        const block = await User.findByIdAndUpdate(
            id,
            {
                isBlocked:true,
            },
            {
                new:true,
            }
        );
        res.json({
            message:"User Blocked",
        });
    }catch (error){
        throw new Error(error);
    }
});
const unblockUser = asyncHandler(async(req,res)=>{
    const {id}= req.params;
    validateMongoDbId(id);
    try{
        const unblock = await User.findByIdAndUpdate(
            id,
            {
                isBlocked:false,
            },
            {
                new:true,
            }
        );
        res.json({
            message:"User UnBlocked",
        })
    }catch (error){
        throw new Error(error);
    }
});


const updatePassword = asyncHandler(async(req,res)=>{
    const { _id } = req.user;
    const {password} = req.body;
    validateMongoDbId(_id);
    const user = await User.findById(_id);
    console.log(user);
    if(password){
        user.password = password;
        const updatedPassword = await user.save();
        res.json(updatedPassword);
    }else{
        res.json(user);
    }
});

const forgotPasswordToken = asyncHandler(async(req,res)=>{
    const { email } = req.body;
    const user = await User.findOne({email});
    if(!user) throw new Error("User not found this email");
    try{
        const token = await user.createPasswordResetToken();
        await user.save();
        const resetURL = `Hi, Please follow this link to reset your Password. This link valid 10 minutes from now.<a href='http://localhost:5000/api/user/reset-password/${token}'>Click Here</a>`;
        const data = {
            to:email,
            text:"Hey User",
            subject:"Forgot Password Link",
            html:resetURL
        };
        sendEmail(data);
        res.json(token);
    }catch (error){
        throw new Error(error);
    }
});

const resetPassword = asyncHandler(async(req,res)=>{
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest("hex");
    const user = await User.findOne({
        passwordResetToken:hashedToken,
        passwordResetExpires:{ $gt: Date.now()},
    });
    if(!user) throw new Error(" Token Expired, Please try again later");
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json(user);
});

const getWishlist = asyncHandler(async(req,res)=>{
    const { _id } = req.user;
    try{
        const findUser = await User.findById(_id).populate("wishlist");
        res.json(findUser);
    }catch(error){
        throw new Error(error);
    }
});

const userCart = asyncHandler(async (req, res) => {
    const { productId,color,quantity,price } = req.body;
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
        
        let newCart = await new Cart({
            userId:_id,
            productId,
            color,
            price,
            quantity,
        }).save();
        res.json(newCart);
    } catch (error) {
        throw new Error(error);
    }
});

const getUserCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
        const cart = await Cart.find({ userId: _id }).populate(
            "productId"
        ).populate("color");
        res.json(cart);
    } catch (error) {
        throw new Error(error);
    }
});

const removeProductFromCart = asyncHandler(async(req,res)=>{
    const { _id } = req.user;
    const { cartItemId } = req.params;
    validateMongoDbId(_id);
    try{
        const deleteProductFromCart = await Cart.deleteOne({userId:_id,_id:cartItemId});
        res.json(deleteProductFromCart);
    }catch(error){
        throw new Error(error);
    }
});

const updateProductQuantityFromCart = asyncHandler(async(req,res)=>{
    const { _id } = req.user;
    const { cartItemId,newQuantity } = req.params;
    validateMongoDbId(_id);
    try{
        const cartItem = await Cart.findOne({userId:_id,_id:cartItemId});
        cartItem.quantity = newQuantity;
        cartItem.save();
        res.json(cartItem);
    }catch(error){
        throw new Error(error);
    }

});
const emptyCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
        const user = await User.findOne({ _id });
        const cart = await Cart.findOneAndRemove({ orderby: user._id });
        res.json(cart);
    } catch (error) {
        throw new Error(error);
    }
});

const applyCoupon = asyncHandler(async (req, res) => {
    const { coupon } = req.body;
    const { _id } = req.user;
    validateMongoDbId(_id);
    const validCoupon = await Coupon.findOne({ name: coupon });
    if (validCoupon === null) {
        throw new Error("Invalid Coupon");
    }
    const user = await User.findOne({ _id });
    let { cartTotal } = await Cart.findOne({
      orderby: user._id,
    }).populate("products.product");
    let totalAfterDiscount = (
      cartTotal -
      (cartTotal * validCoupon.discount) / 100
    ).toFixed(2);
    await Cart.findOneAndUpdate(
      { orderby: user._id },
      { totalAfterDiscount },
      { new: true }
    );
    res.json(totalAfterDiscount);
});


const createOrder = asyncHandler(async (req, res) => {
    const { shippingInfo, orderItems,totalPrice,totalPriceAfterDiscount,paymentInfo } = req.body;
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
        const order = await Order.create({
            shippingInfo, orderItems,totalPrice,totalPriceAfterDiscount,paymentInfo,user:_id
        });
        res.json({
            order,
            success:true,
        });
    } catch (error) {
        throw new Error(error);
    }
});

const getOrders = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
      const userorders = await Order.findOne({ orderby: _id })
        .populate("products.product")
        .populate("orderby")
        .exec();
      res.json(userorders);
    } catch (error) {
      throw new Error(error);
    }
});

const getAllOrders = asyncHandler(async (req, res) => {
    try {
      const alluserorders = await Order.find()
        .populate("products.product")
        .populate("orderby")
        .exec();
      res.json(alluserorders);
    } catch (error) {
      throw new Error(error);
    }
});

const getOrderByUserId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
      const userorders = await Order.findOne({ orderby: id })
        .populate("products.product")
        .populate("orderby")
        .exec();
      res.json(userorders);
    } catch (error) {
      throw new Error(error);
    }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    validateMongoDbId(id);
    try {
      const updateOrderStatus = await Order.findByIdAndUpdate(
        id,
        {
          orderStatus: status,
          paymentIntent: {
            status: status,
          },
        },
        { new: true }
      );
      res.json(updateOrderStatus);
    } catch (error) {
      throw new Error(error);
    }
});

module.exports = { 
    createUser, 
    loginUser ,
    loginAdmin, 
    getallUser, 
    getaUser, 
    deleteaUser, 
    updatedUser,
    blockUser,
    unblockUser,
    handleRefreshToken,
    logout,
    updatePassword,
    forgotPasswordToken,
    resetPassword,
    getWishlist,
    saveAddress,
    userCart,
    getUserCart,
    emptyCart,
    applyCoupon,
    createOrder,
    getOrders,
    getAllOrders,
    getOrderByUserId,
    updateOrderStatus,
    removeProductFromCart,
    updateProductQuantityFromCart,
};
