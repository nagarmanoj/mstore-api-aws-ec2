const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");


const createProduct = asyncHandler(async(req,res)=>{
    const {_id} = req.user;
    validateMongoDbId(_id);
    try{
        // let imageUrlArray = [];
      	// Promise.all(req.files.map(async(file)=>{
        //   const url = req.protocol + '://' + req.get('host');
        //   const imageUrl = url + '/public/images/' + file.filename;
        //   imageUrlArray.push(imageUrl);
      	// }));
        //console.log(_id);
      	if(req.body.title){
        	req.body.slug = slugify(req.body.title);
          req.body.user = _id;
        	//req.body.images = imageUrlArray;    
      	}
        const newProduct = await Product.create(req.body);
        res.json(newProduct);

    }catch (error){
        throw new Error(error);
    }
});

const updateProduct = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const {_id} = req.user;
    validateMongoDbId(id);
    validateMongoDbId(_id);
    try {
        // let imageUrlArray = [];
      	// Promise.all(req.files.map(async(file)=>{
        //   const url = req.protocol + '://' + req.get('host');
        //   const imageUrl = url + '/public/images/' + file.filename;
        //   imageUrlArray.push(imageUrl);
      	// }));
      	if (req.body.title) {
        	req.body.slug = slugify(req.body.title);
          req.body.user = _id;
        	//req.body.images = imageUrlArray;
      	}
        const updateProduct = await Product.findByIdAndUpdate(id , req.body, {
            new: true
        });
        res.json(updateProduct);
    } catch (error) {
        throw new Error(error);
    }
});


const getProduct = asyncHandler(async(req,res)=>{
    const { id } = req.params;
    try{
        const findProdut = await Product.findById(id).populate("color");
        res.json(findProdut);
    }catch(error){
        throw new Error(error);
    }
});


const deleteProduct = asyncHandler(async(req,res)=>{
    const { id } = req.params;
    validateMongoDbId(id);
    try{
        const findProdut = await Product.findByIdAndDelete(id);
        res.json({
            message:"Product Delete Successfully"
        });
    }catch(error){
        throw new Error(error);
    }
});
const getAllProduct = asyncHandler(async(req,res)=>{
    try{
        //filtering
        const queryObj = {...req.query};
        const excludeFields = ["page", "sort", "limit", "fields"];
        excludeFields.forEach((el) => delete queryObj[el]);
        
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        
        let query = Product.find(JSON.parse(queryStr));

        //Sorting 
        if(req.query.sort){
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy);
        }else{
            query = query.sort("-createdAt");
        }

        //limiting fields 
        if(req.query.fields){
            const fields = req.query.fields.split(",").join(" ");
            query = query.select(fields);
        }else{
            query = query.select("-__v");
        }
        //pagination
        const page = req.query.page;
        const limit = req.query.limit;
        const skip = (page-1) * limit;
        query = query.skip(skip).limit(limit);
        if(req.query.page){
            const productCount = await Product.countDocuments();
            if(skip >= productCount) throw new Error("This page not exists");
        }
        console.log(page,limit,skip);

        const product = await query;
        res.json(product);
    }catch(error){
        throw new Error(error);
    }
});
const addToWishlist = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { prodId } = req.body;
    try {
      const user = await User.findById(_id);
      const alreadyadded = user.wishlist.find((id) => id.toString() === prodId);
      if (alreadyadded) {
        let user = await User.findByIdAndUpdate(
          _id,
          {
            $pull: { wishlist: prodId },
          },
          {
            new: true,
          }
        );
        res.json(user);
      } else {
        let user = await User.findByIdAndUpdate(
          _id,
          {
            $push: { wishlist: prodId },
          },
          {
            new: true,
          }
        );
        res.json(user);
      }
    } catch (error) {
      throw new Error(error);
    }
});

const rating = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { star, prodId, comment } = req.body;
    try {
      const product = await Product.findById(prodId);
      let alreadyRated = product.ratings.find(
        (userId) => userId.postedby.toString() === _id.toString()
      );
      if (alreadyRated) {
        const updateRating = await Product.updateOne(
          {
            ratings: { $elemMatch: alreadyRated },
          },
          {
            $set: { "ratings.$.star": star, "ratings.$.comment": comment },
          },
          {
            new: true,
          }
        );
      } else {
        const rateProduct = await Product.findByIdAndUpdate(
          prodId,
          {
            $push: {
              ratings: {
                star: star,
                comment: comment,
                postedby: _id,
              },
            },
          },
          {
            new: true,
          }
        );
      }
      const getallratings = await Product.findById(prodId);
      let totalRating = getallratings.ratings.length;
      let ratingsum = getallratings.ratings
        .map((item) => item.star)
        .reduce((prev, curr) => prev + curr, 0);
      let actualRating = Math.round(ratingsum / totalRating);
      let finalproduct = await Product.findByIdAndUpdate(
        prodId,
        {
          totalrating: actualRating,
        },
        { new: true }
      );
      res.json(finalproduct);
    } catch (error) {
      throw new Error(error);
    }
});

module.exports = {
    createProduct,
    getProduct,
    getAllProduct,
    updateProduct,
    deleteProduct,
    addToWishlist,
    rating,
};
