const express = require("express");
const { 
    createProduct, 
    getProduct, 
    getAllProduct, 
    updateProduct, 
    deleteProduct, 
    addToWishlist, 
    rating 
} = require("../controller/productController");
const router = express.Router();
const {authMiddleware,isAdmin} = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/fileUpload");

router.post("/",authMiddleware,isAdmin,createProduct);
router.get("/:id",getProduct);
router.put("/wishlist", authMiddleware, addToWishlist);
router.put("/rating", authMiddleware, rating);
router.put("/:id",authMiddleware,isAdmin,updateProduct);
router.get("/",getAllProduct);
router.delete("/:id",authMiddleware,isAdmin,deleteProduct);

module.exports = router;
